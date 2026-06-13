import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message?: unknown }).message ?? "");
  return String(error);
}

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

export type DropStatus = "scheduled" | "live" | "ended" | "inactive";

export type AdminDrop = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cost_credits: number;
  original_value: number;
  discount_pct: number | null;
  is_active: boolean;
  is_limited: boolean;
  available_until: string | null;
  thumbnail_url: string | null;
  sort_order: number | null;
  created_at: string;
  items_count: number;
  unlocks_count: number;
  unique_buyers: number;
  credits_revenue: number;
  last_unlock_at: string | null;
  status: DropStatus;
};

export type AdminDropsResponse = {
  drops: AdminDrop[];
  totals: {
    total: number;
    live: number;
    scheduled: number;
    ended: number;
    inactive: number;
    unlocks: number;
    credits_revenue: number;
  };
};

function classify(p: { is_active: boolean; available_until: string | null }, now: Date): DropStatus {
  if (!p.is_active) return "inactive";
  if (p.available_until && new Date(p.available_until).getTime() < now.getTime()) return "ended";
  return "live";
}

export const adminListDrops = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminDropsResponse> => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    const { data: packs, error } = await sb
      .from("packs")
      .select("*, pack_items(id)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(errorMessage(error));
    const list = (packs ?? []) as any[];
    const ids = list.map((p) => p.id);

    let unlocks: Array<{ pack_id: string; user_id: string; credits_spent: number; created_at: string }> = [];
    if (ids.length) {
      const { data: u, error: ue } = await sb
        .from("unlocked_packs")
        .select("pack_id,user_id,credits_spent,created_at")
        .in("pack_id", ids);
      if (ue) throw new Error(errorMessage(ue));
      unlocks = (u ?? []) as any[];
    }

    const byPack = new Map<string, { count: number; buyers: Set<string>; revenue: number; last: string | null }>();
    for (const u of unlocks) {
      const cur = byPack.get(u.pack_id) ?? { count: 0, buyers: new Set<string>(), revenue: 0, last: null };
      cur.count += 1;
      cur.buyers.add(u.user_id);
      cur.revenue += Number(u.credits_spent || 0);
      if (!cur.last || new Date(u.created_at) > new Date(cur.last)) cur.last = u.created_at;
      byPack.set(u.pack_id, cur);
    }

    const now = new Date();
    const drops: AdminDrop[] = list.map((p) => {
      const stats = byPack.get(p.id);
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        cost_credits: p.cost_credits,
        original_value: p.original_value,
        discount_pct: p.discount_pct,
        is_active: p.is_active,
        is_limited: p.is_limited,
        available_until: p.available_until,
        thumbnail_url: p.thumbnail_url,
        sort_order: p.sort_order,
        created_at: p.created_at,
        items_count: Array.isArray(p.pack_items) ? p.pack_items.length : 0,
        unlocks_count: stats?.count ?? 0,
        unique_buyers: stats?.buyers.size ?? 0,
        credits_revenue: stats?.revenue ?? 0,
        last_unlock_at: stats?.last ?? null,
        status: classify(p, now),
      };
    });

    const totals = drops.reduce(
      (acc, d) => {
        acc.total += 1;
        acc.unlocks += d.unlocks_count;
        acc.credits_revenue += d.credits_revenue;
        if (d.status === "live") acc.live += 1;
        else if (d.status === "scheduled") acc.scheduled += 1;
        else if (d.status === "ended") acc.ended += 1;
        else acc.inactive += 1;
        return acc;
      },
      { total: 0, live: 0, scheduled: 0, ended: 0, inactive: 0, unlocks: 0, credits_revenue: 0 },
    );

    return { drops, totals };
  });

const lifecycleSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean().optional(),
  available_until: z.string().nullable().optional(),
  is_limited: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(9999).nullable().optional(),
});

export const adminUpdateDropLifecycle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => lifecycleSchema.parse(i))
  .handler(async ({ data, context }) => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    const payload: Record<string, unknown> = {};
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    if (data.is_limited !== undefined) payload.is_limited = data.is_limited;
    if (data.available_until !== undefined) payload.available_until = data.available_until;
    if (data.sort_order !== undefined) payload.sort_order = data.sort_order;
    if (!Object.keys(payload).length) return { ok: true };
    const { error } = await sb.from("packs").update(payload).eq("id", data.id);
    if (error) throw new Error(errorMessage(error));
    return { ok: true };
  });