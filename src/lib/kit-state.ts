/**
 * Cada PartId corresponde EXATAMENTE a um id de <g> dentro dos SVGs
 * de uniforme (kit-front.svg / kit-back.svg). Trocar a cor de um
 * PartId pinta apenas aquele grupo.
 */
export type PartId =
  // Frente
  | "costuras_frente"
  | "gola_frente"
  | "mangas_frente"
  | "camisa_frente"
  | "short_frente"
  | "estampa_mangas_frente"
  | "estampa_camisa_frente"
  | "estampa_short_frente"
  | "escudo_camisa_frente"
  | "escudo_short_frente"
  // Verso
  | "costuras_verso"
  | "gola_verso"
  | "mangas_verso"
  | "camisa_verso"
  | "short_verso"
  | "estampa_mangas_verso"
  | "estampa_camisa_verso"
  | "estampa_short_verso";

export type TextId =
  | "numero_camisa_frente"
  | "numero_camisa_verso"
  | "numero_short_frente"
  | "nome_camisa_verso";

export type BadgeId = "escudo_camisa_frente" | "escudo_short_frente";

export type TabId = PartId | TextId;

export interface TextLayer {
  value: string;
  font: string;
  color: string;
}

export interface BadgeLayer {
  src: string | null;
  size: number; // multiplicador relativo ao bbox (1 = igual ao placeholder)
}

export interface KitState {
  view: "front" | "back";
  activeTab: TabId;
  selectedPart: PartId | null;
  partColors: Record<PartId, string>;
  texts: Record<TextId, TextLayer>;
  badges: Record<BadgeId, BadgeLayer>;
}

export const SPORT_FONTS = [
  "Bebas Neue",
  "Anton",
  "Teko",
  "Oswald",
  "Russo One",
  "Rajdhani",
  "Orbitron",
] as const;

export const PALETTE: string[] = [
  "#F5E52A", "#F5A623", "#F07D1A", "#E85D00", "#E52222",
  "#D61FA0", "#8B00E8", "#3B22E8", "#2196F3", "#00BFA5",
  "#1ACC2A", "#8BC34A", "#FFFFFF", "#9E9E9E", "#111111",
];

export const DEFAULT_COLORS: Record<PartId, string> = {
  // Frente
  costuras_frente: "#4b4b4b",
  gola_frente: "#FFB600",
  mangas_frente: "#0669F7",
  camisa_frente: "#5D08BF",
  short_frente: "#18ED87",
  estampa_mangas_frente: "#4B4B4B",
  estampa_camisa_frente: "#4B4B4B",
  estampa_short_frente: "#4B4B4B",
  escudo_camisa_frente: "#FFFFFF",
  escudo_short_frente: "#FFFFFF",
  // Verso
  costuras_verso: "#4b4b4b",
  gola_verso: "#FFB600",
  mangas_verso: "#0669F7",
  camisa_verso: "#5D08BF",
  short_verso: "#18ED87",
  estampa_mangas_verso: "#4B4B4B",
  estampa_camisa_verso: "#4B4B4B",
  estampa_short_verso: "#4B4B4B",
};

export const TEXT_IDS: TextId[] = [
  "numero_camisa_frente",
  "numero_camisa_verso",
  "numero_short_frente",
  "nome_camisa_verso",
];

export const BADGE_IDS: BadgeId[] = ["escudo_camisa_frente", "escudo_short_frente"];

export const PART_LABELS: Record<PartId, string> = {
  camisa_frente: "Camisa Frente",
  camisa_verso: "Camisa Verso",
  mangas_frente: "Mangas Frente",
  mangas_verso: "Mangas Verso",
  gola_frente: "Gola Frente",
  gola_verso: "Gola Verso",
  short_frente: "Short Frente",
  short_verso: "Short Verso",
  estampa_camisa_frente: "Estampa Camisa Frente",
  estampa_camisa_verso: "Estampa Camisa Verso",
  estampa_mangas_frente: "Estampa Mangas Frente",
  estampa_mangas_verso: "Estampa Mangas Verso",
  estampa_short_frente: "Estampa Short Frente",
  estampa_short_verso: "Estampa Short Verso",
  costuras_frente: "Costuras Frente",
  costuras_verso: "Costuras Verso",
  escudo_camisa_frente: "Escudo Camisa",
  escudo_short_frente: "Escudo Short",
};

export const TEXT_LABELS: Record<TextId, string> = {
  numero_camisa_frente: "Número Frente",
  numero_camisa_verso: "Número Verso",
  numero_short_frente: "Número Short",
  nome_camisa_verso: "Nome Jogador",
};

// Inline SVG badge presets (data URIs so we don't need asset files)
const badge = (label: string, bg: string, fg: string) =>
  `data:image/svg+xml;utf8,` +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 4 L92 22 L86 70 L50 96 L14 70 L8 22 Z" fill="${bg}" stroke="#111" stroke-width="3"/><text x="50" y="62" text-anchor="middle" font-family="Bebas Neue, Arial Black, sans-serif" font-size="40" fill="${fg}">${label}</text></svg>`,
  );

export const BADGE_PRESETS: { id: string; src: string; name: string }[] = [
  { id: "fc", src: badge("FC", "#1A3DB5", "#fff"), name: "FC" },
  { id: "sc", src: badge("SC", "#E52222", "#fff"), name: "SC" },
  { id: "ac", src: badge("AC", "#111111", "#FFB600"), name: "AC" },
  { id: "hs", src: badge("HS", "#0CA357", "#fff"), name: "HS" },
  { id: "rb", src: badge("RB", "#8B00E8", "#fff"), name: "RB" },
  { id: "vc", src: badge("VC", "#F07D1A", "#111"), name: "VC" },
];

export const INITIAL_STATE: KitState = {
  view: "front",
  activeTab: "camisa_frente",
  selectedPart: "camisa_frente",
  partColors: { ...DEFAULT_COLORS },
  texts: {
    numero_camisa_frente: { value: "10", font: "Bebas Neue", color: "#FFFFFF" },
    numero_camisa_verso: { value: "10", font: "Bebas Neue", color: "#FFFFFF" },
    numero_short_frente: { value: "10", font: "Bebas Neue", color: "#FFFFFF" },
    nome_camisa_verso: { value: "JOGADOR", font: "Bebas Neue", color: "#FFFFFF" },
  },
  badges: {
    escudo_camisa_frente: { src: null, size: 1 },
    escudo_short_frente: { src: null, size: 1 },
  },
};
