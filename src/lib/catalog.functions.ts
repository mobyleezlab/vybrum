import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ModelRow } from "@/lib/models";
import type { Pack } from "@/lib/credits";

const MODEL_COLUMNS =
  "code,name,category,rarity_level,is_limited,is_unlocked,features_level,unlock_cost,buy_cost,svg_frente_url,svg_costas_url,thumbnail_url,available_until,days_remaining,is_expired,drop_name,sort_order,sport";

export const listModelsPublic = createServerFn({ method: "GET" }).handler(async (): Promise<ModelRow[]> => {
  const { data, error } = await (supabaseAdmin as any)
    .from("models_with_status")
    .select(MODEL_COLUMNS)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ModelRow[];
});

export const listPacksPublic = createServerFn({ method: "GET" }).handler(async (): Promise<Pack[]> => {
  const { data, error } = await (supabaseAdmin as any)
    .from("packs")
    .select("*, pack_items(id,model_code,sort_order)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Pack[];
});