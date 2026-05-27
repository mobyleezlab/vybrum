import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listModelsPublic } from "@/lib/catalog.functions";

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

export function useModels() {
  const fetchModels = useServerFn(listModelsPublic);
  return useQuery<ModelRow[]>({
    queryKey: ["models", "public"],
    staleTime: 60_000,
    queryFn: () => fetchModels(),
  });
}

// Categoria → cor do badge (Tailwind classes).
export function categoryBadge(category: string | null | undefined) {
  switch ((category ?? "free").toLowerCase()) {
    case "premium":
      return { label: "PREMIUM", className: "bg-violet-500/15 text-violet-300 border border-violet-500/30" };
    case "elite":
      return { label: "ELITE", className: "bg-[#cffc0b]/15 text-[#cffc0b] border border-[#cffc0b]/30" };
    case "rare":
    case "limited":
      return { label: "RARE", className: "bg-red-500/15 text-red-300 border border-red-500/30" };
    case "pro":
      return { label: "PRO", className: "bg-sky-500/15 text-sky-300 border border-sky-500/30" };
    default:
      return { label: "FREE", className: "bg-[#1a1a1a] text-[#888] border border-[#2a2a2a]" };
  }
}

export function canUseModel(m: ModelRow): boolean {
  if (m.is_expired) return false;
  const cat = (m.category ?? "free").toLowerCase();
  if (cat === "free") return true;
  return !!m.is_unlocked;
}