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

// Mockup catalog — used as fallback while the admin panel isn't ready.
// Todos os modelos apontam para o editor já pronto.
function mock(
  code: string,
  name: string,
  category: ModelRow["category"],
  extras: Partial<ModelRow> = {},
): ModelRow {
  return {
    code,
    name,
    category,
    rarity_level: null,
    is_limited: category === "rare",
    is_unlocked: category === "free",
    features_level: null,
    unlock_cost: category === "pro" ? 30 : category === "premium" ? 60 : category === "elite" ? 120 : category === "rare" ? 200 : 0,
    buy_cost: null,
    svg_frente_url: null,
    svg_costas_url: null,
    thumbnail_url: null,
    available_until: null,
    days_remaining: category === "rare" ? 7 : null,
    is_expired: false,
    drop_name: null,
    sort_order: 0,
    sport: "futebol",
    ...extras,
  };
}

export const MOCK_MODELS: ModelRow[] = [
  mock("VY001", "Trovão", "free"),
  mock("VY002", "Pulso", "free"),
  mock("VY003", "Vértice", "pro"),
  mock("VY004", "Eclipse", "pro"),
  mock("VY005", "Aurora", "premium"),
  mock("VY006", "Nébula", "elite"),
  mock("VY007", "Cometa", "rare", { days_remaining: 5 }),
];

export function useModels() {
  const fetchModels = useServerFn(listModelsPublic);
  return useQuery<ModelRow[]>({
    queryKey: ["models", "public"],
    staleTime: 60_000,
    queryFn: async () => {
      try {
        const rows = await fetchModels();
        if (Array.isArray(rows) && rows.length > 0) return rows;
      } catch {
        // fall through to mocks
      }
      return MOCK_MODELS;
    },
    placeholderData: MOCK_MODELS,
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