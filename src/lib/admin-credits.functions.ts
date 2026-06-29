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

// ===== Credit Packages =====

export type AdminCreditPackage = {
  id: string;
  name: string;
  credits: number;
  bonus_credits: number;
  total_credits: number | null;
  price_brl: number;
  sort_order: number;
  is_active: boolean;
  google_product_id: string | null;
  created_at: string;
};

export const adminListCreditPackages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminCreditPackage[]> => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    const { data, error } = await sb
      .from("credit_packages")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(errorMessage(error));
    return (data ?? []) as AdminCreditPackage[];
  });

const packageSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1).max(80),
  credits: z.number().int().min(1).max(1_000_000),
  bonus_credits: z.number().int().min(0).max(1_000_000).default(0),
  price_brl: z.number().min(0).max(100_000),
  sort_order: z.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
  google_product_id: z.string().trim().max(120).nullable().optional(),
});
export type AdminCreditPackageInput = z.infer<typeof packageSchema>;

export const adminUpsertCreditPackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => packageSchema.parse(i))
  .handler(async ({ data, context }) => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    const payload: any = {
      name: data.name,
      credits: data.credits,
      bonus_credits: data.bonus_credits,
      total_credits: data.credits + data.bonus_credits,
      price_brl: data.price_brl,
      sort_order: data.sort_order,
      is_active: data.is_active,
      google_product_id: data.google_product_id ?? null,
    };
    if (data.id) payload.id = data.id;
    const { error } = await sb.from("credit_packages").upsert(payload);
    if (error) throw new Error(errorMessage(error));
    return { ok: true };
  });

export const adminDeleteCreditPackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    const { error } = await sb.from("credit_packages").delete().eq("id", data.id);
    if (error) throw new Error(errorMessage(error));
    return { ok: true };
  });

// ===== Packs (drops/coleções) =====

export type AdminPackItem = { id: string; model_code: string; sort_order: number | null };

export type AdminPack = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cost_credits: number;
  original_value: number;
  discount_pct: number | null;
  is_limited: boolean;
  is_active: boolean;
  available_until: string | null;
  thumbnail_url: string | null;
  sort_order: number | null;
  created_at: string;
  pack_items: AdminPackItem[];
};

export const adminListPacks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminPack[]> => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    const { data, error } = await sb
      .from("packs")
      .select("*, pack_items(id, model_code, sort_order)")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw new Error(errorMessage(error));
    return (data ?? []) as AdminPack[];
  });

const packSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).nullable().optional(),
  category: z.string().trim().min(1).max(40),
  cost_credits: z.number().int().min(0).max(1_000_000),
  original_value: z.number().min(0).max(1_000_000),
  discount_pct: z.number().int().min(0).max(100).nullable().optional(),
  is_limited: z.boolean().default(false),
  is_active: z.boolean().default(true),
  available_until: z.string().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
  sort_order: z.number().int().min(0).max(9999).nullable().optional(),
  model_codes: z.array(z.string().min(1).max(40)).max(200).default([]),
});
export type AdminPackInput = z.infer<typeof packSchema>;

export const adminUpsertPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => packSchema.parse(i))
  .handler(async ({ data, context }) => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    const payload: any = {
      name: data.name,
      description: data.description ?? null,
      category: data.category,
      cost_credits: data.cost_credits,
      original_value: data.original_value,
      discount_pct: data.discount_pct ?? null,
      is_limited: data.is_limited,
      is_active: data.is_active,
      available_until: data.available_until ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
      sort_order: data.sort_order ?? null,
    };
    if (data.id) payload.id = data.id;
    const { data: row, error } = await sb.from("packs").upsert(payload).select("id").single();
    if (error) throw new Error(errorMessage(error));
    const packId = row.id as string;

    // Replace pack_items
    const del = await sb.from("pack_items").delete().eq("pack_id", packId);
    if (del.error) throw new Error(errorMessage(del.error));
    if (data.model_codes.length) {
      const items = data.model_codes.map((code, index) => ({ pack_id: packId, model_code: code, sort_order: index }));
      const ins = await sb.from("pack_items").insert(items);
      if (ins.error) throw new Error(errorMessage(ins.error));
    }
    return { ok: true, id: packId };
  });

export const adminDeletePack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    await sb.from("pack_items").delete().eq("pack_id", data.id);
    const { error } = await sb.from("packs").delete().eq("id", data.id);
    if (error) throw new Error(errorMessage(error));
    return { ok: true };
  });

// Lightweight model picker for the pack form
export const adminListModelCodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    const { data, error } = await sb
      .from("models")
      .select("code,name,category,thumbnail_url")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(errorMessage(error));
    return (data ?? []) as Array<{ code: string; name: string; category: string; thumbnail_url: string | null }>;
  });

// Bulk update unlock cost by category on models
const bulkCostSchema = z.object({
  category: z.enum(["free", "pro", "premium", "elite", "rare"]),
  unlock_cost: z.number().int().min(0).max(1_000_000),
});

export const adminBulkUpdateUnlockCost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => bulkCostSchema.parse(i))
  .handler(async ({ data, context }) => {
    const sb = await getAdminClient(context.supabase as any, context.userId);
    const { error, count } = await sb
      .from("models")
      .update({ unlock_cost: data.unlock_cost }, { count: "exact" })
      .eq("category", data.category);
    if (error) throw new Error(errorMessage(error));
    return { ok: true, updated: count ?? 0 };
  });