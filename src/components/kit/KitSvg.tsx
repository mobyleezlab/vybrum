import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import frontRaw from "@/assets/kit-front.svg?raw";
import backRaw from "@/assets/kit-back.svg?raw";
import type { KitState, PartId, TextId, BadgeId } from "@/lib/kit-state";
import { BADGE_IDS, TEXT_IDS } from "@/lib/kit-state";

interface Props {
  state: KitState;
}

// IDs que existem em cada view
const FRONT_PARTS: PartId[] = [
  "costuras_frente", "gola_frente", "mangas_frente", "camisa_frente", "short_frente",
  "estampa_mangas_frente", "estampa_camisa_frente", "estampa_short_frente",
  "escudo_camisa_frente", "escudo_short_frente",
];
const BACK_PARTS: PartId[] = [
  "costuras_verso", "gola_verso", "mangas_verso", "camisa_verso", "short_verso",
  "estampa_mangas_verso", "estampa_camisa_verso", "estampa_short_verso",
];

function applyFill(root: SVGElement, id: string, color: string) {
  const g = root.querySelector(`#${id}`) as SVGGElement | null;
  if (!g) return;
  // Pinta o próprio grupo e todos os shapes pintáveis dentro dele
  const shapes = g.querySelectorAll<SVGElement>("path, rect, circle, polygon, ellipse");
  shapes.forEach((s) => {
    // só pinta se já tinha fill (ignora fill="none" dos clipPath wrappers)
    const cur = s.getAttribute("fill");
    if (cur === "none") return;
    s.setAttribute("fill", color);
  });
}

function replaceText(root: SVGElement, id: TextId, layer: { value: string; color: string; font: string }) {
  const g = root.querySelector(`#${id}`) as SVGGElement | null;
  if (!g) return;
  // medir bbox dos glifos originais (apenas na 1ª aplicação por mount)
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
    } catch {
      return;
    }
  }
  // substitui filhos por um <text> centralizado no bbox original
  while (g.firstChild) g.removeChild(g.firstChild);
  const ns = "http://www.w3.org/2000/svg";
  const t = document.createElementNS(ns, "text");
  const cx = bbox.x + bbox.w / 2;
  const cy = bbox.y + bbox.h / 2;
  t.setAttribute("x", String(cx));
  t.setAttribute("y", String(cy));
  t.setAttribute("text-anchor", "middle");
  t.setAttribute("dominant-baseline", "central");
  t.setAttribute("font-family", `${layer.font}, sans-serif`);
  t.setAttribute("font-size", String(bbox.h));
  t.setAttribute("fill", layer.color);
  t.style.pointerEvents = "none";
  t.textContent =
    id === "nome_camisa_verso" ? (layer.value || "").toUpperCase() : layer.value;
  g.appendChild(t);
}

function applyBadge(root: SVGElement, id: BadgeId, src: string | null, sizeMul: number) {
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
    } catch {
      return;
    }
  }
  // mantém o placeholder; se houver src, sobrescreve com <image>
  // Remove qualquer <image> previamente adicionado
  g.querySelectorAll("image").forEach((n) => n.remove());
  // Mostra/oculta os shapes originais
  const shapes = g.querySelectorAll<SVGElement>("path, rect, circle, polygon");
  shapes.forEach((s) => {
    s.style.display = src ? "none" : "";
  });
  if (src) {
    const ns = "http://www.w3.org/2000/svg";
    const img = document.createElementNS(ns, "image");
    const w = bbox.w * sizeMul;
    const h = bbox.h * sizeMul;
    const x = bbox.x + bbox.w / 2 - w / 2;
    const y = bbox.y + bbox.h / 2 - h / 2;
    img.setAttribute("x", String(x));
    img.setAttribute("y", String(y));
    img.setAttribute("width", String(w));
    img.setAttribute("height", String(h));
    img.setAttribute("preserveAspectRatio", "xMidYMid meet");
    img.setAttributeNS("http://www.w3.org/1999/xlink", "href", src);
    img.setAttribute("href", src);
    g.appendChild(img);
  }
}

export const KitSvg = forwardRef<SVGSVGElement, Props>(({ state }, ref) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useImperativeHandle(ref, () => svgRef.current as SVGSVGElement, []);

  // Re-inject SVG sempre que a view muda
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = state.view === "front" ? frontRaw : backRaw;
    const svg = host.querySelector("svg") as SVGSVGElement | null;
    if (!svg) return;
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.display = "block";
    svgRef.current = svg;
  }, [state.view]);

  // Aplica cores / textos / escudos a cada alteração
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const parts = state.view === "front" ? FRONT_PARTS : BACK_PARTS;
    parts.forEach((p) => applyFill(svg, p, state.partColors[p]));
    TEXT_IDS.forEach((id) => {
      if ((state.view === "front" && id !== "nome_camisa_verso" && id !== "numero_camisa_verso") ||
          (state.view === "back" && (id === "nome_camisa_verso" || id === "numero_camisa_verso"))) {
        replaceText(svg, id, state.texts[id]);
      }
    });
    BADGE_IDS.forEach((id) => {
      if (state.view === "front") applyBadge(svg, id, state.badges[id].src, state.badges[id].size);
    });
  });

  return <div ref={hostRef} className="h-full w-full" />;
});
KitSvg.displayName = "KitSvg";
