/**
 * Estado consolidado: cada "grupo visual" tem UM controle no painel
 * e é mapeado para todos os IDs correspondentes na frente e verso do SVG.
 *
 * Os SVGs (kit-front.svg / kit-back.svg) já trazem todos os elementos
 * desenhados — o editor só os sobrescreve quando o usuário interage
 * (touched=true). Enquanto não interagir, o SVG original é preservado.
 */

export type ColorGroup =
  | "camisa"
  | "mangas"
  | "gola"
  | "short"
  | "estampaCamisa"
  | "estampaMangas"
  | "estampaShort";

export type TextGroup = "numero" | "nome";

export type BadgeGroup = "escudo";
export type SponsorGroup = "patrocinador";

/** Painel combinado: nome + número (inputs + fonte). */
export type TextosGroup = "textos";
/** Painel de fontes — seleciona a tipografia aplicada a nome e número. */
export type FontGroup = "fontes";
/** Painel de ajustes finos: cores/contornos/tamanhos/posições do nome e número. */
export type AjustesGroup = "ajustes";

export type TabId =
  | ColorGroup
  | TextosGroup
  | FontGroup
  | AjustesGroup
  | BadgeGroup
  | SponsorGroup;

/** IDs reais dentro dos SVGs. */
export const COLOR_GROUP_IDS: Record<ColorGroup, string[]> = {
  camisa: ["camisa_frente", "camisa_verso"],
  mangas: ["camisa_mangas_frente", "camisa_mangas_verso"],
  gola: ["camisa_gola_frente", "camisa_gola_verso"],
  short: ["short_frente", "short_verso"],
  estampaCamisa: ["camisa_estampa_frente", "camisa_estampa_verso"],
  estampaMangas: ["camisa_mangas_estampa_frente", "camisa_mangas_estampa_verso"],
  estampaShort: ["short_estampa_frente", "short_estampa_verso"],
};

/** Texto: grupo de FILL (cor do número/nome) */
export const TEXT_FILL_IDS: Record<TextGroup, string[]> = {
  numero: [
    "camisa_numero_frente",
    "camisa_numero_verso",
    "short-numero_frente",
    "short_numero_frente",
  ],
  nome: ["camisa_nome_verso"],
};

/** Texto: grupo de STROKE (contorno do número/nome) */
export const TEXT_STROKE_IDS: Record<TextGroup, string[]> = {
  numero: [
    "camisa_numero_contorno_frente",
    "camisa_numero_contorno_verso",
    "short-numero_contorno_frente",
    "short_numero_contorno_frente",
  ],
  nome: ["camisa_nome_contorno_verso"],
};

/** O escudo aparece no peito e no calção. */
export const ESCUDO_IDS = ["camisa_escudo_frente", "short_escudo_frente"];

/** Patrocinador: front e back independentes. */
export const SPONSOR_IDS = {
  front: "camisa_patrocinador_frente",
  back: "camisa_patrocinador_verso",
} as const;

export interface TextLayer {
  value: string;
  font: string;
  color: string;
  outlineEnabled: boolean;
  outlineColor: string;
  outlineWidth: number; // 1..8
  /** Multiplicador de tamanho da fonte (1 = padrão do bbox). */
  sizeScale: number; // 0.6..1.6
  /** Deslocamento em Y dentro do viewBox do SVG. */
  yOffset: number; // -150..150
  touched: boolean;
}

export interface BadgeLayer {
  src: string | null;
  size: number;
  touched: boolean;
}

export interface SponsorLayer {
  front: string | null; // base64 / URL
  back: string | null;
  sizeFront: number;
  sizeBack: number;
  yFront: number;
  yBack: number;
  touched: { front: boolean; back: boolean };
}

export interface KitState {
  view: "front" | "back";
  activeTab: TabId;
  colors: Record<ColorGroup, string>;
  colorsTouched: Partial<Record<ColorGroup, boolean>>;
  texts: Record<TextGroup, TextLayer>;
  escudo: BadgeLayer;
  sponsor: SponsorLayer;
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
  camisa: "#FFFFFF",
  mangas: "#FFFFFF",
  gola: "#111111",
  short: "#FFFFFF",
  estampaCamisa: "#68ED00",
  estampaMangas: "#68ED00",
  estampaShort: "#68ED00",
};

export const COLOR_LABELS: Record<ColorGroup, string> = {
  camisa: "Cor da Camisa",
  mangas: "Cor das Mangas",
  gola: "Cor da Gola",
  short: "Cor do Short",
  estampaCamisa: "Estampa da Camisa",
  estampaMangas: "Estampa das Mangas",
  estampaShort: "Estampa do Short",
};

export const TEXT_LABELS: Record<TextGroup, string> = {
  numero: "Número",
  nome: "Nome",
};

/** Tabs visíveis por view. O controle único atualiza ambos os lados. */
export const FRONT_TABS: TabId[] = [
  "camisa","mangas","gola","short",
  "textos","fontes","ajustes","escudo","patrocinador",
];
export const BACK_TABS: TabId[] = [
  "camisa","mangas","gola","short",
  "textos","fontes","ajustes","escudo","patrocinador",
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
  colorsTouched: {},
  texts: {
    numero: {
      value: "9",
      font: "Bebas Neue",
      color: "#FFFFFF",
      outlineEnabled: true,
      outlineColor: "#68ED00",
      outlineWidth: 4,
      sizeScale: 1,
      yOffset: 0,
      touched: true,
    },
    nome: {
      value: "JOGADOR",
      font: "Bebas Neue",
      color: "#FFFFFF",
      outlineEnabled: true,
      outlineColor: "#68ED00",
      outlineWidth: 4,
      sizeScale: 1,
      yOffset: 0,
      touched: true,
    },
  },
  escudo: { src: null, size: 1, touched: false },
  sponsor: {
    front: null, back: null,
    sizeFront: 1, sizeBack: 1,
    yFront: 0, yBack: 0,
    touched: { front: false, back: false },
  },
};
