import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import frontRawDefault from "@/assets/kit-front.svg?raw";
import backRawDefault from "@/assets/kit-back.svg?raw";
import {
  COLOR_GROUP_IDS, TEXT_GROUP_IDS, ESCUDO_IDS,
  type KitState, type ColorGroup, type TextGroup,
} from "@/lib/kit-state";

interface Props {
  state: KitState;
  frontRaw?: string;
  backRaw?: string;
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

function replaceText(
  root: SVGElement, id: string,
  layer: { value: string; color: string; font: string }, upper: boolean,
) {
  const g = root.querySelector(`#${id}`) as SVGGElement | null;
  if (!g) return;
  const cached = g.getAttribute("data-bbox");
  let bbox: { x: number; y: number; w: number; h: number };
  if (cached) {
    const [x, y, w, h] = cached.split(",").map(Number);
    bbox = { x, y, w, h };
  } else {
    try {
      const b = g.getBBox();
      bbox = { x: b.x, y: b.y, w: b.width, h: b.height };
      g.setAttribute("data-bbox", `${bbox.x},${bbox.y},${bbox.w},${bbox.h}`);
    } catch { return; }
  }
  while (g.firstChild) g.removeChild(g.firstChild);
  const ns = "http://www.w3.org/2000/svg";
  const t = document.createElementNS(ns, "text");
  t.setAttribute("x", String(bbox.x + bbox.w / 2));
  t.setAttribute("y", String(bbox.y + bbox.h / 2));
  t.setAttribute("text-anchor", "middle");
  t.setAttribute("dominant-baseline", "central");
  t.setAttribute("font-family", `${layer.font}, sans-serif`);
  t.setAttribute("font-size", String(bbox.h));
  t.setAttribute("fill", layer.color);
  t.style.pointerEvents = "none";
  t.textContent = upper ? (layer.value || "").toUpperCase() : layer.value;
  g.appendChild(t);
}

function applyBadge(root: SVGElement, id: string, src: string | null, sizeMul: number) {
  const g = root.querySelector(`#${id}`) as SVGGElement | null;
  if (!g) return;
  const cached = g.getAttribute("data-bbox");
  let bbox: { x: number; y: number; w: number; h: number };
  if (cached) {
    const [x, y, w, h] = cached.split(",").map(Number);
    bbox = { x, y, w, h };
  } else {
    try {
      const b = g.getBBox();
      bbox = { x: b.x, y: b.y, w: b.width, h: b.height };
      g.setAttribute("data-bbox", `${bbox.x},${bbox.y},${bbox.w},${bbox.h}`);
    } catch { return; }
  }
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

export const KitSvg = forwardRef<SVGSVGElement, Props>(({ state, frontRaw, backRaw }, ref) => {
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
    // Cores — aplica a TODOS os ids do grupo presentes neste view
    (Object.keys(COLOR_GROUP_IDS) as ColorGroup[]).forEach((g) => {
      COLOR_GROUP_IDS[g].forEach((id) => applyFill(svg, id, state.colors[g]));
    });
    // Textos
    (Object.keys(TEXT_GROUP_IDS) as TextGroup[]).forEach((g) => {
      TEXT_GROUP_IDS[g].forEach((id) =>
        replaceText(svg, id, state.texts[g], g === "nome"),
      );
    });
    // Escudo (mesmo arquivo em peito e calção)
    ESCUDO_IDS.forEach((id) => applyBadge(svg, id, state.escudo.src, state.escudo.size));
  });

  return <div ref={hostRef} className="h-full w-full" />;
});
KitSvg.displayName = "KitSvg";
