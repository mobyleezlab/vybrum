import type { Entitlements } from "@/lib/entitlements";

export type Feature =
  | "export-svg"
  | "export-pdf"
  | "export-png-hd"
  | "shield-library"
  | "shield-multi"
  | "shield-reposition"
  | "shield-extra-locations"
  | "sponsors"
  | "premium-fonts"
  | "goalkeeper"
  | "team-kit"
  | "premium-template";

export const FEATURE_LABEL: Record<Feature, string> = {
  "export-svg": "SVG editável",
  "export-pdf": "PDF editável",
  "export-png-hd": "PNG em alta resolução",
  "shield-library": "Biblioteca de escudos prontos",
  "shield-multi": "Múltiplos escudos (até 10)",
  "shield-reposition": "Reposicionar escudo",
  "shield-extra-locations": "Escudo na manga e nas costas",
  sponsors: "Patrocinadores",
  "premium-fonts": "Fontes premium",
  goalkeeper: "Goleiro separado",
  "team-kit": "Kit de time completo",
  "premium-template": "Template premium",
};

export function canUseFeature(_: Feature, ent: Entitlements | undefined): boolean {
  if (!ent) return false;
  return ent.hasAnyUnlock;
}

export const FREE_SHIELD_LIMIT = 1;
export const UNLOCKED_SHIELD_LIMIT = 10;