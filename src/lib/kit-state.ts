/**
 * Estado consolidado: cada "grupo visual" tem UM controle no painel
 * e é mapeado para todos os IDs correspondentes na frente e verso do SVG.
 */

export type ColorGroup =
  | "camisa"
  | "mangas"
  | "gola"
  | "short"
  | "estampaCamisa"
  | "estampaMangas"
  | "estampaShort"
  | "costuras";

export type TextGroup = "numeroCamisa" | "numeroShort" | "nome";

export type BadgeGroup = "escudo";

export type TabId = ColorGroup | TextGroup | BadgeGroup;

/** IDs reais dentro dos SVGs (kit-front.svg / kit-back.svg). */
export const COLOR_GROUP_IDS: Record<ColorGroup, string[]> = {
  camisa: ["camisa_frente", "camisa_verso"],
  mangas: ["mangas_frente", "mangas_verso"],
  gola: ["gola_frente", "gola_verso"],
  short: ["short_frente", "short_verso"],
  estampaCamisa: ["estampa_camisa_frente", "estampa_camisa_verso"],
  estampaMangas: ["estampa_mangas_frente", "estampa_mangas_verso"],
  estampaShort: ["estampa_short_frente", "estampa_short_verso"],
  costuras: ["costuras_frente", "costuras_verso"],
};

export const TEXT_GROUP_IDS: Record<TextGroup, string[]> = {
  numeroCamisa: ["numero_camisa_frente", "numero_camisa_verso"],
  numeroShort: ["numero_short_frente"],
  nome: ["nome_camisa_verso"],
};

/** O escudo é aplicado nos dois locais (peito e calção) simultaneamente. */
export const ESCUDO_IDS = ["escudo_camisa_frente", "escudo_short_frente"];

export interface TextLayer {
  value: string;
  font: string;
  color: string;
}

export interface BadgeLayer {
  src: string | null;
  size: number;
}

export interface KitState {
  view: "front" | "back";
  activeTab: TabId;
  colors: Record<ColorGroup, string>;
  texts: Record<TextGroup, TextLayer>;
  escudo: BadgeLayer;
}

export const SPORT_FONTS = [
  "Bebas Neue", "Anton", "Teko", "Oswald", "Russo One", "Rajdhani", "Orbitron",
] as const;

export const PALETTE: string[] = [
  "#F5E52A","#F5A623","#F07D1A","#E85D00","#E52222",
  "#D61FA0","#8B00E8","#3B22E8","#2196F3","#00BFA5",
  "#1ACC2A","#8BC34A","#FFFFFF","#9E9E9E","#111111",
];

export const DEFAULT_COLORS: Record<ColorGroup, string> = {
  camisa: "#5D08BF",
  mangas: "#0669F7",
  gola: "#FFB600",
  short: "#18ED87",
  estampaCamisa: "#4B4B4B",
  estampaMangas: "#4B4B4B",
  estampaShort: "#4B4B4B",
  costuras: "#4B4B4B",
};

export const COLOR_LABELS: Record<ColorGroup, string> = {
  camisa: "Cor da Camisa",
  mangas: "Cor das Mangas",
  gola: "Cor da Gola",
  short: "Cor do Short",
  estampaCamisa: "Estampa da Camisa",
  estampaMangas: "Estampa das Mangas",
  estampaShort: "Estampa do Short",
  costuras: "Cor das Costuras",
};

export const TEXT_LABELS: Record<TextGroup, string> = {
  numeroCamisa: "Número da Camisa",
  numeroShort: "Número do Short",
  nome: "Nome do Jogador",
};

/** Tabs visíveis por view (front/back). Ambas mostram os grupos
 * compartilhados — o controle único atualiza os dois lados. */
export const FRONT_TABS: TabId[] = [
  "camisa","mangas","gola","short",
  "estampaCamisa","estampaMangas","estampaShort",
  "numeroCamisa","nome","escudo","costuras",
];
export const BACK_TABS: TabId[] = [
  "camisa","mangas","gola","short",
  "estampaCamisa","estampaMangas","estampaShort",
  "numeroCamisa","nome","escudo","costuras",
];

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
  activeTab: "camisa",
  colors: { ...DEFAULT_COLORS },
  texts: {
    numeroCamisa: { value: "10", font: "Bebas Neue", color: "#FFFFFF" },
    numeroShort: { value: "10", font: "Bebas Neue", color: "#FFFFFF" },
    nome: { value: "JOGADOR", font: "Bebas Neue", color: "#FFFFFF" },
  },
  escudo: { src: null, size: 1 },
};
