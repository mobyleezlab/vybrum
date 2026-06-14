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

function extractShieldPath(value: string): string | null {
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\/+/, "");
  try {
    const url = new URL(value);
    const idx = url.pathname.indexOf("/user-shields/");
    if (idx === -1) return null;
    return url.pathname.slice(idx + "/user-shields/".length);
  } catch {
    return null;
  }
}

export type AdminShield = {
  id: string;
  name: string;
  image_url: string;
  is_default: boolean;
  created_at: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  user_plan: string | null;
};

const listSchema = z.object({
  search: z.string().trim().max(120).optional().nullable(),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(48),
});

export const adminListShields = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => listSchema.parse(i))
  .handler(async ({ data, context }): Promise<{ shields: AdminShield[]; total: number }> => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    const from = data.page * data.pageSize;
    const to = from + data.pageSize - 1;

    let q = sb.from("user_shields").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (data.search) {
      const s = data.search.replace(/[%,]/g, "");
      q = q.ilike("name", `%${s}%`);
    }
    q = q.range(from, to);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((rows ?? []).map((r: any) => r.user_id)));
    const profMap = new Map<string, any>();
    if (ids.length) {
      const { data: profs } = await sb.from("profiles").select("id,email,full_name,plan").in("id", ids);
      for (const p of profs ?? []) profMap.set(p.id, p);
    }

    const shields: AdminShield[] = (rows ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      image_url: r.image_url,
      is_default: !!r.is_default,
      created_at: r.created_at,
      user_id: r.user_id,
      user_email: profMap.get(r.user_id)?.email ?? null,
      user_name: profMap.get(r.user_id)?.full_name ?? null,
      user_plan: profMap.get(r.user_id)?.plan ?? null,
    }));
    return { shields, total: count ?? 0 };
  });

export const adminDeleteShield = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), reason: z.string().trim().min(1).max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    const { data: row, error: getErr } = await sb.from("user_shields").select("id,user_id,image_url,name").eq("id", data.id).maybeSingle();
    if (getErr) throw new Error(getErr.message);
    if (!row) throw new Error("Escudo não encontrado.");

    const path = extractShieldPath(row.image_url);
    if (path) {
      const { error: stErr } = await sb.storage.from("user-shields").remove([path]);
      if (stErr && !/not.*found/i.test(stErr.message)) throw new Error(stErr.message);
    }

    const { error: delErr } = await sb.from("user_shields").delete().eq("id", data.id);
    if (delErr) throw new Error(delErr.message);

    await sb.from("admin_audit_log").insert({
      admin_id: context.userId,
      action: "moderation.delete_shield",
      target_user_id: row.user_id,
      payload: { shield_id: row.id, name: row.name, reason: data.reason, target_type: "shield" } as any,
    });
    return { ok: true };
  });

export type AdminSecurityLog = {
  id: string;
  event_type: string;
  ip_address: string | null;
  user_id: string | null;
  user_email: string | null;
  details: any;
  created_at: string;
};

const logsSchema = z.object({
  eventType: z.string().trim().max(80).optional().nullable(),
  limit: z.number().int().min(1).max(500).default(150),
});

export const adminListSecurityLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => logsSchema.parse(i))
  .handler(async ({ data, context }): Promise<{ logs: AdminSecurityLog[]; eventTypes: string[] }> => {
    const sb = await getAdminClient(context.supabase as any, context.userId);

    let q = sb.from("security_logs").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.eventType) q = q.eq("event_type", data.eventType);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const ids = Array.from(new Set((rows ?? []).map((r: any) => r.user_id).filter(Boolean))) as string[];
    const profMap = new Map<string, any>();
    if (ids.length) {
      const { data: profs } = await sb.from("profiles").select("id,email").in("id", ids);
      for (const p of profs ?? []) profMap.set(p.id, p);
    }

    const logs: AdminSecurityLog[] = (rows ?? []).map((r: any) => ({
      id: r.id,
      event_type: r.event_type,
      ip_address: r.ip_address,
      user_id: r.user_id,
      user_email: r.user_id ? profMap.get(r.user_id)?.email ?? null : null,
      details: r.details,
      created_at: r.created_at,
    }));

    const { data: types } = await sb.from("security_logs").select("event_type").limit(1000);
    const eventTypes = Array.from(new Set((types ?? []).map((t: any) => String(t.event_type)))).sort();

    return { logs, eventTypes };
  });