import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { ModelRow } from "@/lib/models";
import type { Pack } from "@/lib/credits";
import type { Database } from "@/integrations/supabase/types";

const MODEL_COLUMNS =
  "code,name,category,rarity_level,is_limited,unlock_cost,buy_cost,svg_frente_url,svg_costas_url,thumbnail_url,available_until,drop_name,sort_order,sport";

function withPublicModelStatus(rows: Array<Record<string, unknown>>): ModelRow[] {
  const now = Date.now();
  return rows.map((row) => {
    const availableUntil = typeof row.available_until === "string" ? row.available_until : null;
    const untilTime = availableUntil ? new Date(availableUntil).getTime() : null;
    const isExpired = untilTime !== null ? untilTime < now : false;
    const daysRemaining =
      untilTime !== null && !isExpired ? Math.ceil((untilTime - now) / 86_400_000) : null;

    return {
      ...row,
      is_unlocked: row.category === "free",
      days_remaining: daysRemaining,
      is_expired: isExpired,
    } as ModelRow;
  });
}

function getPublicClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase public env vars");
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

export const listModelsPublic = createServerFn({ method: "GET" }).handler(
  async (): Promise<ModelRow[]> => {
    const { data, error } = await getPublicClient()
      .from("models")
      .select(MODEL_COLUMNS)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return withPublicModelStatus((data ?? []) as Array<Record<string, unknown>>);
  },
);

export const listPacksPublic = createServerFn({ method: "GET" }).handler(
  async (): Promise<Pack[]> => {
    const { data, error } = await getPublicClient()
      .from("packs")
      .select("*, pack_items(id,model_code,sort_order)")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Pack[];
  },
);
