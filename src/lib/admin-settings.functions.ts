import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function getAdminClient(authSb: any, userId: string) {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const r = await sb.from("user_roles").select("user_id").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (r.data) return sb;
    const p = await sb.from("profiles").select("plan").eq("id", userId).maybeSingle();
    if (p.data?.plan === "admin") return sb;
    throw new Error("Forbidden: admin only");
  }
  const { data, error } = await authSb.rpc("is_admin", { uid: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
  return authSb;
}

export type AppSetting = {
  key: string;
  value: any;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
  updated_by_email: string | null;
};

export const adminListSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ settings: AppSetting[] }> => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    const { data, error } = await sb.from("app_settings").select("*").order("key");
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((data ?? []).map((r: any) => r.updated_by).filter(Boolean))) as string[];
    const map = new Map<string, string>();
    if (ids.length) {
      const { data: profs } = await sb.from("profiles").select("id,email").in("id", ids);
      for (const p of profs ?? []) map.set(p.id, p.email);
    }

    return {
      settings: (data ?? []).map((r: any) => ({
        key: r.key,
        value: r.value,
        description: r.description,
        updated_at: r.updated_at,
        updated_by: r.updated_by,
        updated_by_email: r.updated_by ? map.get(r.updated_by) ?? null : null,
      })),
    };
  });

const upsertSchema = z.object({
  key: z.string().trim().min(1).max(80).regex(/^[a-z0-9_]+$/i),
  value: z.any(),
});

export const adminUpsertSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => upsertSchema.parse(i))
  .handler(async ({ data, context }) => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    const { data: prev } = await sb.from("app_settings").select("value").eq("key", data.key).maybeSingle();
    const { error } = await sb
      .from("app_settings")
      .upsert(
        { key: data.key, value: data.value, updated_at: new Date().toISOString(), updated_by: context.userId },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);

    await sb.from("admin_audit_log").insert({
      admin_id: context.userId,
      action: "settings.update",
      payload: { key: data.key, previous: prev?.value ?? null, next: data.value } as any,
    });
    return { ok: true };
  });

export type AuditEntry = {
  id: string;
  admin_id: string;
  admin_email: string | null;
  action: string;
  target_user_id: string | null;
  target_user_email: string | null;
  payload: any;
  created_at: string;
};

export const adminListAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ limit: z.number().int().min(1).max(300).default(100), action: z.string().trim().max(80).optional().nullable() }).parse(i),
  )
  .handler(async ({ data, context }): Promise<{ entries: AuditEntry[]; actions: string[] }> => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    let q = sb.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.action) q = q.eq("action", data.action);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const ids = Array.from(
      new Set(
        (rows ?? []).flatMap((r: any) => [r.admin_id, r.target_user_id]).filter(Boolean),
      ),
    ) as string[];
    const emails = new Map<string, string>();
    if (ids.length) {
      const { data: profs } = await sb.from("profiles").select("id,email").in("id", ids);
      for (const p of profs ?? []) emails.set(p.id, p.email);
    }

    const { data: actionRows } = await sb.from("admin_audit_log").select("action").limit(1000);
    const actions = Array.from(new Set<string>((actionRows ?? []).map((r: any) => String(r.action)))).sort();

    const entries: AuditEntry[] = (rows ?? []).map((r: any) => ({
      id: r.id,
      admin_id: r.admin_id,
      admin_email: emails.get(r.admin_id) ?? null,
      action: r.action,
      target_user_id: r.target_user_id,
      target_user_email: r.target_user_id ? emails.get(r.target_user_id) ?? null : null,
      payload: r.payload,
      created_at: r.created_at,
    }));
    return { entries, actions };
  });