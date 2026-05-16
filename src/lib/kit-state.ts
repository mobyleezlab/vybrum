export type PartId =
  | "body"
  | "sleeves"
  | "collar"
  | "pattern"
  | "shorts"
  | "shortsPattern"
  | "details";

export type PatternKind =
  | "solid"
  | "verticalStripes"
  | "horizontalStripes"
  | "sash"
  | "diagonal";

export type TabId =
  | "body"
  | "sleeves"
  | "collar"
  | "pattern"
  | "shorts"
  | "shortsPattern"
  | "name"
  | "number"
  | "badgeChest"
  | "badgeShorts";

export interface TextLayer {
  value: string;
  font: string;
  size: number;
  color: string;
  offsetY: number;
}

export interface BadgeLayer {
  src: string | null;
  x: number;
  y: number;
  size: number;
}

export interface KitState {
  view: "front" | "back";
  activeTab: TabId;
  selectedColor: string;
  selectedPart: PartId;
  partColors: Record<PartId, string>;
  pattern: PatternKind;
  shortsPattern: PatternKind;
  playerName: TextLayer;
  playerNumberBack: TextLayer;
  playerNumberFront: TextLayer;
  badgeChest: BadgeLayer;
  badgeShorts: BadgeLayer;
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
  body: "#1A3DB5",
  sleeves: "#00E5C8",
  collar: "#FFFFFF",
  pattern: "#FFFFFF",
  shorts: "#00E5C8",
  shortsPattern: "#1A3DB5",
  details: "#FFB600",
};

export const TAB_TO_PART: Partial<Record<TabId, PartId>> = {
  body: "body",
  sleeves: "sleeves",
  collar: "collar",
  pattern: "pattern",
  shorts: "shorts",
  shortsPattern: "shortsPattern",
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
  activeTab: "body",
  selectedColor: "#1A3DB5",
  selectedPart: "body",
  partColors: { ...DEFAULT_COLORS },
  pattern: "solid",
  shortsPattern: "solid",
  playerName: { value: "JOGADOR", font: "Bebas Neue", size: 70, color: "#FFFFFF", offsetY: 0 },
  playerNumberBack: { value: "10", font: "Bebas Neue", size: 250, color: "#FFFFFF", offsetY: 0 },
  playerNumberFront: { value: "10", font: "Bebas Neue", size: 60, color: "#FFFFFF", offsetY: 0 },
  badgeChest: { src: null, x: 660, y: 250, size: 90 },
  badgeShorts: { src: null, x: 360, y: 940, size: 70 },
};
