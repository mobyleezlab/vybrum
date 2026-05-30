import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import frontRawDefault from "@/assets/kit-front.svg?raw";
import backRawDefault from "@/assets/kit-back.svg?raw";
import {
  COLOR_GROUP_IDS, TEXT_FILL_IDS, TEXT_STROKE_IDS, ESCUDO_IDS, SPONSOR_IDS,
  type KitState, type ColorGroup, type TextGroup, type TextLayer,
} from "@/lib/kit-state";

interface Props {
  state: KitState;
  frontRaw?: string;
  backRaw?: string;
  display?: "full" | "shirt" | "short";
}

function applyFill(root: SVGElement, id: string, color: string) {
  const g = root.querySelector(`#${id}`) as SVGGElement | null;
  if (!g) return;
  const shapes = g.querySelectorAll<SVGElement>("path, rect, circle, polygon, ellipse");
  shapes.forEach((s) => {
    if (s.getAttribute("fill") === "none") return;
    s.setAttribute("fill", color);
  });
}

function getBBox(g: SVGGElement): { x: number; y: number; w: number; h: number } | null {
  const cached = g.getAttribute("data-bbox");
  if (cached) {
    const [x, y, w, h] = cached.split(",").map(Number);
    return { x, y, w, h };
  }
  try {
    const b = g.getBBox();
    const bb = { x: b.x, y: b.y, w: b.width, h: b.height };
    g.setAttribute("data-bbox", `${bb.x},${bb.y},${bb.w},${bb.h}`);
    return bb;
  } catch {
    return null;
  }
}

/** Render text inside a group with a fixed bbox. mode controls fill vs stroke. */
function renderText(
  root: SVGElement, id: string,
  layer: TextLayer, upper: boolean,
  mode: "fill" | "stroke",
) {
  const g = root.querySelector(`#${id}`) as SVGGElement | null;
  if (!g) return;
  const bbox = getBBox(g);
  if (!bbox) return;
  while (g.firstChild) g.removeChild(g.firstChild);
  if (mode === "stroke" && !layer.outlineEnabled) return; // contorno OFF
  const ns = "http://www.w3.org/2000/svg";
  const t = document.createElementNS(ns, "text");
  t.setAttribute("x", String(bbox.x + bbox.w / 2));
  t.setAttribute("y", String(bbox.y + bbox.h / 2));
  t.setAttribute("text-anchor", "middle");
  t.setAttribute("dominant-baseline", "central");
  t.setAttribute("font-family", `${layer.font}, sans-serif`);
  t.setAttribute("font-size", String(bbox.h));
  t.setAttribute("font-weight", "700");
  if (mode === "fill") {
    t.setAttribute("fill", layer.color);
    t.setAttribute("stroke", "none");
  } else {
    t.setAttribute("fill", "none");
    t.setAttribute("stroke", layer.outlineColor);
    t.setAttribute("stroke-width", String(layer.outlineWidth * 2));
    t.setAttribute("stroke-linejoin", "round");
    t.setAttribute("stroke-linecap", "round");
    t.setAttribute("paint-order", "stroke fill");
  }
  t.style.pointerEvents = "none";
  t.textContent = upper ? (layer.value || "").toUpperCase() : layer.value;
  g.appendChild(t);
}

function applyBadge(root: SVGElement, id: string, src: string | null, sizeMul: number) {
  const g = root.querySelector(`#${id}`) as SVGGElement | null;
  if (!g) return;
  const bbox = getBBox(g);
  if (!bbox) return;
  g.querySelectorAll("image").forEach((n) => n.remove());
  g.querySelectorAll<SVGElement>("path, rect, circle, polygon").forEach((s) => {
    s.style.display = src ? "none" : "";
  });
  if (src) {
    const ns = "http://www.w3.org/2000/svg";
    const img = document.createElementNS(ns, "image");
    const w = bbox.w * sizeMul;
    const h = bbox.h * sizeMul;
    img.setAttribute("x", String(bbox.x + bbox.w / 2 - w / 2));
    img.setAttribute("y", String(bbox.y + bbox.h / 2 - h / 2));
    img.setAttribute("width", String(w));
    img.setAttribute("height", String(h));
    img.setAttribute("preserveAspectRatio", "xMidYMid meet");
    img.setAttributeNS("http://www.w3.org/1999/xlink", "href", src);
    img.setAttribute("href", src);
    g.appendChild(img);
  }
}

const SHORT_ONLY_IDS = [
  "short_frente", "short_verso",
  "short_estampa_frente", "short_estampa_verso",
  "short-numero_frente", "short_numero_frente",
  "short-numero_contorno_frente", "short_numero_contorno_frente",
  "short_escudo_frente",
];
const SHIRT_ONLY_IDS = [
  "camisa_frente", "camisa_verso",
  "camisa_mangas_frente", "camisa_mangas_verso",
  "camisa_gola_frente", "camisa_gola_verso",
  "camisa_estampa_frente", "camisa_estampa_verso",
  "camisa_mangas_estampa_frente", "camisa_mangas_estampa_verso",
  "camisa_numero_frente", "camisa_numero_verso",
  "camisa_numero_contorno_frente", "camisa_numero_contorno_verso",
  "camisa_nome_verso", "camisa_nome_contorno_verso",
  "camisa_escudo_frente",
  "camisa_patrocinador_frente", "camisa_patrocinador_verso",
  "camisa_logo_vybrum_frente",
];

function setHidden(root: SVGElement, id: string, hidden: boolean) {
  const g = root.querySelector(`#${id}`) as SVGGElement | null;
  if (!g) return;
  g.style.display = hidden ? "none" : "";
}

export const KitSvg = forwardRef<SVGSVGElement, Props>(({ state, frontRaw, backRaw, display = "full" }, ref) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useImperativeHandle(ref, () => svgRef.current as SVGSVGElement, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const raw =
      state.view === "front"
        ? (frontRaw ?? frontRawDefault)
        : (backRaw ?? backRawDefault);
    host.innerHTML = raw;
    const svg = host.querySelector("svg") as SVGSVGElement | null;
    if (!svg) return;
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.display = "block";
    svgRef.current = svg;
  }, [state.view, frontRaw, backRaw]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    // Cores — apenas se o usuário tocou o grupo
    (Object.keys(COLOR_GROUP_IDS) as ColorGroup[]).forEach((g) => {
      if (!state.colorsTouched[g]) return;
      COLOR_GROUP_IDS[g].forEach((id) => applyFill(svg, id, state.colors[g]));
    });
    // Textos — apenas se o layer foi tocado
    (Object.keys(TEXT_FILL_IDS) as TextGroup[]).forEach((g) => {
      const layer = state.texts[g];
      if (!layer.touched) return;
      const upper = g === "nome";
      TEXT_FILL_IDS[g].forEach((id) => renderText(svg, id, layer, upper, "fill"));
      TEXT_STROKE_IDS[g].forEach((id) => renderText(svg, id, layer, upper, "stroke"));
    });
    // Escudo
    if (state.escudo.touched) {
      ESCUDO_IDS.forEach((id) => applyBadge(svg, id, state.escudo.src, state.escudo.size));
    }
    // Patrocinador
    if (state.sponsor.front !== null) applyBadge(svg, SPONSOR_IDS.front, state.sponsor.front, 1);
    if (state.sponsor.back !== null) applyBadge(svg, SPONSOR_IDS.back, state.sponsor.back, 1);
    // Visibility per display mode
    const hideShort = display === "shirt";
    const hideShirt = display === "short";
    SHORT_ONLY_IDS.forEach((id) => setHidden(svg, id, hideShort));
    SHIRT_ONLY_IDS.forEach((id) => setHidden(svg, id, hideShirt));
  });

  return <div ref={hostRef} className="h-full w-full" />;
});
KitSvg.displayName = "KitSvg";
