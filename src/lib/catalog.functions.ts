import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { ModelRow } from "@/lib/models";
import type { Pack } from "@/lib/credits";

const MODEL_COLUMNS =
  "code,name,category,rarity_level,is_limited,is_unlocked,unlock_cost,buy_cost,svg_frente_url,svg_costas_url,thumbnail_url,available_until,days_remaining,is_expired,drop_name,sort_order,sport";

function getPublicClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase public env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const listModelsPublic = createServerFn({ method: "GET" }).handler(async (): Promise<ModelRow[]> => {
  const { data, error } = await (getPublicClient() as any)
    .from("models_with_status")
    .select(MODEL_COLUMNS)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ModelRow[];
});

export const listPacksPublic = createServerFn({ method: "GET" }).handler(async (): Promise<Pack[]> => {
  const { data, error } = await (getPublicClient() as any)
    .from("packs")
    .select("*, pack_items(id,model_code,sort_order)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Pack[];
});