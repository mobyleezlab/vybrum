import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AdminModelRow = Database["public"]["Tables"]["models"]["Row"];

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message?: unknown }).message ?? "");
  return String(error);
}

function isRlsRecursionError(error: unknown) {
  const message = errorMessage(error);
  return message.includes('infinite recursion detected in policy for relation "profiles"');
}

const adminSetupMessage =
  "As policies de admin no Supabase ainda precisam ser atualizadas. Aplique a migration de correção de RLS para listar usuários.";

async function getServiceAdminClientIfAvailable() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function isAdminViaServiceClient(sb: any, userId: string) {
  const roleRes = await sb
    .from("user_roles")
    .select("user_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleRes.error && roleRes.data) return true;
  if (roleRes.error && roleRes.error.code !== "42P01" && roleRes.error.code !== "42703") {
    throw new Error(roleRes.error.message);
  }

  const { data, error } = await sb.from("profiles").select("plan").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.plan === "admin";
}

async function resolveAdmin(authenticatedSupabase: any, userId: string) {
  const adminClient = await getServiceAdminClientIfAvailable();
  if (adminClient) return { isAdmin: await isAdminViaServiceClient(adminClient, userId), adminClient };

  const { data, error } = await authenticatedSupabase.rpc("is_admin", { uid: userId });
  if (error) throw new Error(error.message);
  return { isAdmin: !!data, adminClient: null as any };
}

async function assertAdmin(supabase: any, userId: string) {
  const { isAdmin } = await resolveAdmin(supabase, userId);
  if (!isAdmin) throw new Error("Forbidden: admin only");
}

async function getAdminDataClient(authenticatedSupabase: any, userId: string) {
  const { isAdmin, adminClient } = await resolveAdmin(authenticatedSupabase, userId);
  if (!isAdmin) throw new Error("Forbidden: admin only");
  return adminClient ?? authenticatedSupabase;
}

async function syncAdminRole(supabase: any, userId: string, plan: string) {
  if (plan === "admin") {
    const { error } = await supabase.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error && error.code !== "42P01") throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
  if (error && error.code !== "42P01") throw new Error(error.message);
}

async function audit(
  supabase: any,
  adminId: string,
  action: string,
  targetType: string | null,
  targetId: string | null,
  payload: Record<string, unknown> | null = null,
) {
  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action,
    target_user_id: targetType === "user" ? targetId : null,
    payload: { ...(payload ?? {}), target_type: targetType, target_id: targetId } as any,
  });
}

export const adminCheck = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      // Lê o próprio perfil via cliente autenticado (RLS permite SELECT do próprio row).
      // Evita dependência de user_roles, service-role envs ou da RPC is_admin.
      const { data, error } = await (context.supabase as any)
        .from("profiles")
        .select("plan")
        .eq("id", context.userId)
        .maybeSingle();
      if (error) {
        if (isRlsRecursionError(error)) return { isAdmin: false, setupError: adminSetupMessage };
        return {
          isAdmin: false,
          setupError: `Não foi possível validar admin: ${errorMessage(error)}`,
        };
      }
      return { isAdmin: data?.plan === "admin", setupError: null as string | null };
    } catch (error) {
      if (isRlsRecursionError(error)) return { isAdmin: false, setupError: adminSetupMessage };
      throw error;
    }
  });

export const adminListModels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminModelRow[]> => {
    const sb = await getAdminDataClient(context.supabase as any, context.userId);
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
    const sb = await getAdminDataClient(context.supabase as any, context.userId);
    const { error } = await sb.from("models").upsert(data, { onConflict: "code" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteModel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().min(1).max(32) }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = await getAdminDataClient(context.supabase as any, context.userId);
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
    const sb = await getAdminDataClient(context.supabase as any, context.userId);
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

export type AdminListUsersResult = { users: AdminUserRow[]; total: number; setupError?: string | null };

const listUsersSchema = z.object({
  search: z.string().trim().max(120).optional().nullable(),
  plan: z.enum(["all", "free", "pro", "premium", "admin"]).default("all"),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(50),
});

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => listUsersSchema.parse(i))
  .handler(async ({ data, context }): Promise<AdminListUsersResult> => {
    let sb: any;
    try {
      sb = await getAdminDataClient(context.supabase as any, context.userId);
    } catch (error) {
      if (isRlsRecursionError(error)) return { users: [], total: 0, setupError: adminSetupMessage };
      throw error;
    }

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
    if (error) {
      if (isRlsRecursionError(error)) return { users: [], total: 0, setupError: adminSetupMessage };
      throw new Error(errorMessage(error));
    }

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
    return { users, total: count ?? 0, setupError: null };
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
    const sb = await getAdminDataClient(context.supabase as any, context.userId);
    const { error } = await sb.from("profiles").update({
      plan: data.plan,
      plan_expires_at: data.plan_expires_at ?? null,
    }).eq("id", data.userId);
    if (error) throw new Error(error.message);
    await syncAdminRole(sb, data.userId, data.plan);
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
    const sb = await getAdminDataClient(context.supabase as any, context.userId);
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
    const sb = await getAdminDataClient(context.supabase as any, context.userId);

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
    const sb = await getAdminDataClient(context.supabase as any, context.userId);
    const { data, error } = await sb.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string; admin_id: string; target_user_id: string | null; action: string;
      payload: any; created_at: string;
    }>;
  });

// ===== Billing =====

export type AdminBillingSummary = {
  totals: {
    revenue_brl: number;
    completed_count: number;
    pending_count: number;
    failed_count: number;
    refunded_count: number;
    paying_users: number;
    arpu_brl: number;
    avg_ticket_brl: number;
    credits_granted: number;
  };
  windows: {
    today_brl: number;
    last_7d_brl: number;
    last_30d_brl: number;
    prev_30d_brl: number;
    growth_pct: number | null;
  };
  daily: Array<{ date: string; revenue: number; count: number }>;
  top_packages: Array<{ package_id: string; name: string; count: number; revenue: number }>;
  recent: Array<{
    id: string;
    created_at: string;
    completed_at: string | null;
    status: string;
    price_brl: number;
    credits_granted: number;
    user_id: string;
    user_email: string | null;
    user_name: string | null;
    package_name: string | null;
  }>;
};

const billingSchema = z.object({
  rangeDays: z.number().int().min(7).max(365).default(30),
});

function emptyBillingSummary(rangeDays: number): AdminBillingSummary {
  const now = new Date();
  const daily = Array.from({ length: rangeDays }, (_, index) => {
    const d = new Date(now.getTime() - (rangeDays - index - 1) * 86400_000);
    return { date: d.toISOString().slice(0, 10), revenue: 0, count: 0 };
  });
  return {
    totals: { revenue_brl: 0, completed_count: 0, pending_count: 0, failed_count: 0, refunded_count: 0, paying_users: 0, arpu_brl: 0, avg_ticket_brl: 0, credits_granted: 0 },
    windows: { today_brl: 0, last_7d_brl: 0, last_30d_brl: 0, prev_30d_brl: 0, growth_pct: null },
    daily,
    top_packages: [],
    recent: [],
  };
}

export const adminBillingSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => billingSchema.parse(i))
  .handler(async ({ data, context }): Promise<AdminBillingSummary> => {
    try {
      await assertAdmin(context.supabase as any, context.userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("infinite recursion detected in policy")) return emptyBillingSummary(data.rangeDays);
      throw error;
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return emptyBillingSummary(data.rangeDays);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;

    const now = new Date();
    const since = new Date(now.getTime() - data.rangeDays * 86400_000);
    const prevSince = new Date(since.getTime() - data.rangeDays * 86400_000);

    const [allRes, packagesRes, recentRes] = await Promise.all([
      sb.from("credit_purchases")
        .select("id,user_id,package_id,price_brl,credits_granted,status,created_at,completed_at")
        .gte("created_at", prevSince.toISOString())
        .order("created_at", { ascending: false })
        .limit(5000),
      sb.from("credit_packages").select("id,name"),
      sb.from("credit_purchases")
        .select("id,user_id,package_id,price_brl,credits_granted,status,created_at,completed_at")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);
    if (allRes.error) throw new Error(allRes.error.message);
    if (packagesRes.error) throw new Error(packagesRes.error.message);
    if (recentRes.error) throw new Error(recentRes.error.message);

    const rows: any[] = allRes.data ?? [];
    const pkgMap = new Map<string, string>((packagesRes.data ?? []).map((p: any) => [p.id, p.name]));

    const completedAll = rows.filter((r) => r.status === "completed");
    const inWindow = completedAll.filter((r) => new Date(r.created_at) >= since);
    const prevWindow = completedAll.filter((r) => {
      const t = new Date(r.created_at);
      return t >= prevSince && t < since;
    });

    const sum = (arr: any[]) => arr.reduce((a, r) => a + Number(r.price_brl ?? 0), 0);
    const sumCredits = (arr: any[]) => arr.reduce((a, r) => a + Number(r.credits_granted ?? 0), 0);

    const revenue = sum(inWindow);
    const prevRevenue = sum(prevWindow);
    const payingUsers = new Set(inWindow.map((r) => r.user_id)).size;

    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const start7 = new Date(now.getTime() - 7 * 86400_000);
    const start30 = new Date(now.getTime() - 30 * 86400_000);
    const startPrev30 = new Date(now.getTime() - 60 * 86400_000);

    const today_brl = sum(completedAll.filter((r) => new Date(r.created_at) >= startOfToday));
    const last_7d_brl = sum(completedAll.filter((r) => new Date(r.created_at) >= start7));
    const last_30d_brl = sum(completedAll.filter((r) => new Date(r.created_at) >= start30));
    const prev_30d_brl = sum(completedAll.filter((r) => {
      const t = new Date(r.created_at);
      return t >= startPrev30 && t < start30;
    }));

    // Daily series
    const byDay = new Map<string, { revenue: number; count: number }>();
    for (let i = data.rangeDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400_000);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, { revenue: 0, count: 0 });
    }
    for (const r of inWindow) {
      const key = new Date(r.created_at).toISOString().slice(0, 10);
      const slot = byDay.get(key);
      if (slot) { slot.revenue += Number(r.price_brl ?? 0); slot.count += 1; }
    }
    const daily = Array.from(byDay.entries()).map(([date, v]) => ({ date, revenue: Number(v.revenue.toFixed(2)), count: v.count }));

    // Top packages
    const pkgAgg = new Map<string, { count: number; revenue: number }>();
    for (const r of inWindow) {
      const cur = pkgAgg.get(r.package_id) ?? { count: 0, revenue: 0 };
      cur.count += 1; cur.revenue += Number(r.price_brl ?? 0);
      pkgAgg.set(r.package_id, cur);
    }
    const top_packages = Array.from(pkgAgg.entries())
      .map(([package_id, v]) => ({ package_id, name: pkgMap.get(package_id) ?? package_id.slice(0, 8), count: v.count, revenue: Number(v.revenue.toFixed(2)) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    // Recent purchases with user info
    const recentRows: any[] = recentRes.data ?? [];
    const userIds = Array.from(new Set(recentRows.map((r) => r.user_id)));
    const profilesRes = userIds.length
      ? await sb.from("profiles").select("id,email,full_name").in("id", userIds)
      : { data: [] };
    const profMap = new Map<string, any>((profilesRes.data ?? []).map((p: any) => [p.id, p]));

    const recent = recentRows.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      completed_at: r.completed_at,
      status: r.status,
      price_brl: Number(r.price_brl ?? 0),
      credits_granted: Number(r.credits_granted ?? 0),
      user_id: r.user_id,
      user_email: profMap.get(r.user_id)?.email ?? null,
      user_name: profMap.get(r.user_id)?.full_name ?? null,
      package_name: pkgMap.get(r.package_id) ?? null,
    }));

    return {
      totals: {
        revenue_brl: Number(revenue.toFixed(2)),
        completed_count: inWindow.length,
        pending_count: rows.filter((r) => r.status === "pending" && new Date(r.created_at) >= since).length,
        failed_count: rows.filter((r) => r.status === "failed" && new Date(r.created_at) >= since).length,
        refunded_count: rows.filter((r) => r.status === "refunded" && new Date(r.created_at) >= since).length,
        paying_users: payingUsers,
        arpu_brl: payingUsers ? Number((revenue / payingUsers).toFixed(2)) : 0,
        avg_ticket_brl: inWindow.length ? Number((revenue / inWindow.length).toFixed(2)) : 0,
        credits_granted: sumCredits(inWindow),
      },
      windows: {
        today_brl: Number(today_brl.toFixed(2)),
        last_7d_brl: Number(last_7d_brl.toFixed(2)),
        last_30d_brl: Number(last_30d_brl.toFixed(2)),
        prev_30d_brl: Number(prev_30d_brl.toFixed(2)),
        growth_pct: prevRevenue > 0 ? Number((((revenue - prevRevenue) / prevRevenue) * 100).toFixed(1)) : null,
      },
      daily,
      top_packages,
      recent,
    };
  });