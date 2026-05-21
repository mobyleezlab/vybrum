import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export interface ModelRow {
  code: string;
  name: string;
  category: string | null;
  rarity_level: string | null;
  is_limited: boolean | null;
  is_unlocked: boolean | null;
  features_level: string | null;
  unlock_cost: number | null;
  buy_cost: number | null;
  svg_frente_url: string | null;
  svg_costas_url: string | null;
  thumbnail_url: string | null;
  available_until: string | null;
  days_remaining: number | null;
  is_expired: boolean | null;
  drop_name: string | null;
  sort_order: number | null;
  sport: string | null;
}

const COLUMNS =
  "code,name,category,rarity_level,is_limited,is_unlocked,features_level,unlock_cost,buy_cost,svg_frente_url,svg_costas_url,thumbnail_url,available_until,days_remaining,is_expired,drop_name,sort_order,sport";

export function useModels() {
  const { user, loading } = useAuth();

  return useQuery<ModelRow[]>({
    queryKey: ["models", user?.id ?? "anon"],
    enabled: !loading,
    staleTime: 60_000,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("models_with_status")
        .select(COLUMNS)
        .order("sort_order", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as ModelRow[];
    },
  });
}

// Categoria → cor do badge (Tailwind classes).
export function categoryBadge(category: string | null | undefined) {
  switch ((category ?? "free").toLowerCase()) {
    case "premium":
      return { label: "PREMIUM", className: "bg-purple-600 text-white" };
    case "elite":
      return { label: "ELITE", className: "bg-amber-500 text-black" };
    case "rare":
    case "limited":
      return { label: "RARE", className: "bg-red-600 text-white" };
    case "pro":
      return { label: "PRO", className: "bg-blue-600 text-white" };
    default:
      return { label: "FREE", className: "bg-neutral-300 text-neutral-800" };
  }
}

export function canUseModel(m: ModelRow): boolean {
  if (m.is_expired) return false;
  const cat = (m.category ?? "free").toLowerCase();
  if (cat === "free") return true;
  return !!m.is_unlocked;
}