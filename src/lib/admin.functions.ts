import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AdminModelRow = Database["public"]["Tables"]["models"]["Row"];

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { uid: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

async function audit(
  supabase: any,
  actorId: string,
  action: string,
  targetType: string | null,
  targetId: string | null,
  payload: Record<string, unknown> | null = null,
) {
  await supabase.from("admin_audit_log").insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    payload: payload as any,
  });
}

export const adminCheck = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any).rpc("is_admin", { uid: context.userId });
    if (error) throw new Error(error.message);
    return { isAdmin: !!data };
  });

export const adminListModels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminModelRow[]> => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { data, error } = await sb
      .from("models")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminModelRow[];
  });

const modelSchema = z.object({
  code: z.string().trim().min(1).max(32).regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().trim().min(1).max(80),
  category: z.enum(["free", "pro", "premium", "elite", "rare"]),
  sport: z.string().trim().min(1).max(40).default("futebol"),
  rarity_level: z.string().trim().max(40).default("common"),
  is_limited: z.boolean().default(false),
  is_premium: z.boolean().default(false),
  unlock_cost: z.number().int().min(0).nullable().optional(),
  buy_cost: z.number().int().min(0).nullable().optional(),
  drop_name: z.string().trim().max(80).nullable().optional(),
  available_until: z.string().nullable().optional(),
  sort_order: z.number().int().min(0).default(0),
  thumbnail_url: z.string().url().nullable().optional(),
  svg_frente_url: z.string().url().nullable().optional(),
  svg_costas_url: z.string().url().nullable().optional(),
});
export type AdminModelInput = z.infer<typeof modelSchema>;

export const adminUpsertModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => modelSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { error } = await sb.from("models").upsert(data, { onConflict: "code" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().min(1).max(32) }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { error } = await sb.from("models").delete().eq("code", data.code);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const uploadSchema = z.object({
  code: z.string().trim().min(1).max(32).regex(/^[A-Za-z0-9_-]+$/),
  kind: z.enum(["thumb", "frente", "costas"]),
  base64: z.string().min(8).max(8_000_000),
  contentType: z.string().min(3).max(80),
  filename: z.string().min(1).max(120),
});

export const adminUploadAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => uploadSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const ext = (data.filename.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${data.code}/${data.kind}-${Date.now()}.${ext}`;
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const { error: upErr } = await sb.storage
      .from("model-svgs")
      .upload(path, bytes, { contentType: data.contentType, upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = sb.storage.from("model-svgs").getPublicUrl(path);
    return { url: pub.publicUrl, path };
  });

// ===== Users =====

export type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: string;
  plan_expires_at: string | null;
  is_disabled: boolean;
  created_at: string;
  last_seen_at: string | null;
  credits: number;
  total_earned: number;
  total_spent: number;
  kits_count: number;
  shields_count: number;
  purchases_total_brl: number;
};

const listUsersSchema = z.object({
  search: z.string().trim().max(120).optional().nullable(),
  plan: z.enum(["all", "free", "pro", "premium", "admin"]).default("all"),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(50),
});

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => listUsersSchema.parse(i))
  .handler(async ({ data, context }): Promise<{ users: AdminUserRow[]; total: number }> => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);

    const from = data.page * data.pageSize;
    const to = from + data.pageSize - 1;

    let q = sb.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (data.plan && data.plan !== "all") q = q.eq("plan", data.plan);
    if (data.search) {
      const s = data.search.replace(/[%,]/g, "");
      q = q.or(`email.ilike.%${s}%,full_name.ilike.%${s}%,id.eq.${/^[0-9a-f-]{36}$/i.test(s) ? s : "00000000-0000-0000-0000-000000000000"}`);
    }
    q = q.range(from, to);
    const { data: profiles, error, count } = await q;
    if (error) throw new Error(error.message);

    const ids = (profiles ?? []).map((p: any) => p.id);
    if (!ids.length) return { users: [], total: count ?? 0 };

    const [bal, kits, shields, purch] = await Promise.all([
      sb.from("credit_balances").select("user_id,balance,total_earned,total_spent").in("user_id", ids),
      sb.from("kits").select("user_id").in("user_id", ids),
      sb.from("user_shields").select("user_id").in("user_id", ids),
      sb.from("credit_purchases").select("user_id,price_brl,status").in("user_id", ids).eq("status", "completed"),
    ]);

    const balMap = new Map<string, any>((bal.data ?? []).map((r: any) => [r.user_id, r]));
    const countBy = (rows: any[] | null) => {
      const m = new Map<string, number>();
      for (const r of rows ?? []) m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1);
      return m;
    };
    const kitMap = countBy(kits.data);
    const shieldMap = countBy(shields.data);
    const purchMap = new Map<string, number>();
    for (const r of purch.data ?? []) purchMap.set(r.user_id, (purchMap.get(r.user_id) ?? 0) + Number(r.price_brl ?? 0));

    const users: AdminUserRow[] = (profiles ?? []).map((p: any) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      plan: p.plan,
      plan_expires_at: p.plan_expires_at,
      is_disabled: !!p.is_disabled,
      created_at: p.created_at,
      last_seen_at: p.last_seen_at ?? null,
      credits: balMap.get(p.id)?.balance ?? 0,
      total_earned: balMap.get(p.id)?.total_earned ?? 0,
      total_spent: balMap.get(p.id)?.total_spent ?? 0,
      kits_count: kitMap.get(p.id) ?? 0,
      shields_count: shieldMap.get(p.id) ?? 0,
      purchases_total_brl: purchMap.get(p.id) ?? 0,
    }));
    return { users, total: count ?? 0 };
  });

const updatePlanSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(["free", "pro", "premium", "admin"]),
  plan_expires_at: z.string().nullable().optional(),
});

export const adminUpdateUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => updatePlanSchema.parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { error } = await sb.from("profiles").update({
      plan: data.plan,
      plan_expires_at: data.plan_expires_at ?? null,
    }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    await audit(sb, context.userId, "user.update_plan", "user", data.userId, { plan: data.plan });
    return { ok: true };
  });

const setDisabledSchema = z.object({
  userId: z.string().uuid(),
  is_disabled: z.boolean(),
});

export const adminSetUserDisabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => setDisabledSchema.parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { error } = await sb.from("profiles").update({ is_disabled: data.is_disabled }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    await audit(sb, context.userId, data.is_disabled ? "user.disable" : "user.enable", "user", data.userId);
    return { ok: true };
  });

const adjustCreditsSchema = z.object({
  userId: z.string().uuid(),
  delta: z.number().int().refine((n) => n !== 0, "delta must be non-zero").refine((n) => Math.abs(n) <= 100_000, "too large"),
  reason: z.string().trim().min(1).max(200),
});

export const adminAdjustCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => adjustCreditsSchema.parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);

    const { data: bal } = await sb.from("credit_balances").select("balance,total_earned,total_spent").eq("user_id", data.userId).maybeSingle();
    const current = bal?.balance ?? 0;
    const next = current + data.delta;
    if (next < 0) throw new Error("Saldo ficaria negativo.");

    const earned = (bal?.total_earned ?? 0) + (data.delta > 0 ? data.delta : 0);
    const spent = (bal?.total_spent ?? 0) + (data.delta < 0 ? -data.delta : 0);

    const { error: upErr } = await sb.from("credit_balances").upsert({
      user_id: data.userId, balance: next, total_earned: earned, total_spent: spent, updated_at: new Date().toISOString(),
    });
    if (upErr) throw new Error(upErr.message);

    const { error: lErr } = await sb.from("credit_ledger").insert({
      user_id: data.userId,
      amount: data.delta,
      balance_after: next,
      type: data.delta > 0 ? "admin_grant" : "admin_revoke",
      description: `[admin] ${data.reason}`,
    });
    if (lErr) throw new Error(lErr.message);

    await audit(sb, context.userId, "user.adjust_credits", "user", data.userId, { delta: data.delta, reason: data.reason, balance_after: next });
    return { ok: true, balance: next };
  });

export const adminListAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as any;
    await assertAdmin(sb, context.userId);
    const { data, error } = await sb.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string; actor_id: string; action: string; target_type: string | null; target_id: string | null;
      payload: any; created_at: string;
    }>;
  });