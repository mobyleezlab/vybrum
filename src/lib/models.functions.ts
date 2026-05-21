import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Listagem pública de modelos (visitante anônimo). Retorna apenas colunas seguras
// usando o cliente admin (RLS da view só permite authenticated).
export const listModelsPublic = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("models_with_status")
      .select(
        "code,name,category,rarity_level,is_limited,is_unlocked,features_level,unlock_cost,buy_cost,svg_frente_url,svg_costas_url,thumbnail_url,available_until,days_remaining,is_expired,drop_name,sort_order,sport",
      )
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);