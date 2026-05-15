export type PartId = "body" | "sleeves" | "collar" | "shorts";

export type TabId =
  | "jersey"
  | "jerseyStriped"
  | "shortsLong"
  | "shortsShort"
  | "text"
  | "badge";

export interface KitState {
  view: "front" | "back";
  activeTab: TabId;
  selectedColor: string;
  partColors: Record<PartId, string>;
}

export const DEFAULT_COLORS: Record<PartId, string> = {
  body: "#1A3DB5",
  sleeves: "#00E5C8",
  collar: "#FFFFFF",
  shorts: "#00E5C8",
};

export const PALETTE: string[] = [
  "#F5E52A",
  "#F5A623",
  "#F07D1A",
  "#E85D00",
  "#E52222",
  "#D61FA0",
  "#8B00E8",
  "#3B22E8",
  "#2196F3",
  "#00BFA5",
  "#1ACC2A",
  "#8BC34A",
  "#111111",
];

export const TAB_TO_PART: Record<TabId, PartId | null> = {
  jersey: "body",
  jerseyStriped: "body",
  shortsLong: "shorts",
  shortsShort: "shorts",
  text: null,
  badge: null,
};

export const INITIAL_STATE: KitState = {
  view: "front",
  activeTab: "jersey",
  selectedColor: "#2196F3",
  partColors: { ...DEFAULT_COLORS },
};