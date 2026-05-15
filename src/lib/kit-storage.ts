import type { KitState } from "./kit-state";

const KEY = "kit-designer:designs";

export interface SavedDesign {
  id: string;
  name: string;
  createdAt: number;
  state: KitState;
}

export function loadDesigns(): SavedDesign[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveDesign(name: string, state: KitState): SavedDesign {
  const design: SavedDesign = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    state,
  };
  const all = loadDesigns();
  all.push(design);
  localStorage.setItem(KEY, JSON.stringify(all));
  return design;
}