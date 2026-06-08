import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import "svg2pdf.js";

/** Página fixa 16:9 — usada como referência de proporção. */
const PAGE_W = 1920;
const PAGE_H = 1080;

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

/** Constrói o SVG composto (frente + verso lado a lado em 16:9). */
function buildCompositeSvg(
  frontSvg: SVGSVGElement,
  backSvg: SVGSVGElement,
): SVGSVGElement {
  const xmlns = "http://www.w3.org/2000/svg";
  const root = document.createElementNS(xmlns, "svg");
  root.setAttribute("xmlns", xmlns);
  root.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  root.setAttribute("viewBox", `0 0 ${PAGE_W} ${PAGE_H}`);
  root.setAttribute("width", String(PAGE_W));
  root.setAttribute("height", String(PAGE_H));

  const bg = document.createElementNS(xmlns, "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", String(PAGE_W));
  bg.setAttribute("height", String(PAGE_H));
  bg.setAttribute("fill", "#ffffff");
  root.appendChild(bg);

  const PAD = 40;
  const cellW = PAGE_W / 2 - PAD * 2;
  const cellH = PAGE_H - PAD * 2;

  const place = (src: SVGSVGElement, x: number) => {
    const clone = src.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", xmlns);
    clone.setAttribute("x", String(x + PAD));
    clone.setAttribute("y", String(PAD));
    clone.setAttribute("width", String(cellW));
    clone.setAttribute("height", String(cellH));
    clone.setAttribute("preserveAspectRatio", "xMidYMid meet");
    clone.removeAttribute("style");
    root.appendChild(clone);
  };
  place(frontSvg, 0);
  place(backSvg, PAGE_W / 2);
  return root;
}

/** Exporta o nó composto (frente + verso lado a lado, 16:9) como PNG/JPG. */
export async function exportComposite(
  node: HTMLElement,
  format: "png" | "jpg",
  resolution: 720 | 1080,
  filename: string,
) {
  const height = resolution;
  const width = Math.round((height * 16) / 9);
  const pixelRatio = width / node.offsetWidth;
  const opts = {
    width: node.offsetWidth,
    height: node.offsetHeight,
    pixelRatio,
    cacheBust: true,
    backgroundColor: "#ffffff",
    style: {
      transform: "none",
    },
  };
  const dataUrl =
    format === "jpg"
      ? await toJpeg(node, { ...opts, quality: 0.95 })
      : await toPng(node, opts);
  download(dataUrl, filename);
}

/** Exporta como PDF VETORIAL (1 página, paisagem, 16:9) via svg2pdf.js. */
export async function exportCompositePdf(
  frontSvg: SVGSVGElement,
  backSvg: SVGSVGElement,
  filename: string,
) {
  if (!frontSvg || !backSvg) throw new Error("SVG refs ausentes para exportar PDF.");
  const composite = buildCompositeSvg(frontSvg, backSvg);
  // svg2pdf precisa do SVG anexado ao DOM para medir.
  const holder = document.createElement("div");
  holder.style.position = "fixed";
  holder.style.left = "-100000px";
  holder.style.top = "0";
  holder.appendChild(composite);
  document.body.appendChild(holder);
  try {
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [PAGE_W, PAGE_H] });
    await (pdf as unknown as {
      svg: (el: SVGElement, opts: { x: number; y: number; width: number; height: number }) => Promise<void>;
    }).svg(composite, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
    pdf.save(filename);
  } finally {
    holder.remove();
  }
}

/** Exporta como SVG composto (nested SVGs lado a lado em viewBox 16:9). */
export function exportCompositeSvg(
  frontSvg: SVGSVGElement,
  backSvg: SVGSVGElement,
  filename: string,
) {
  if (!frontSvg || !backSvg) throw new Error("SVG refs ausentes para exportar SVG.");
  const root = buildCompositeSvg(frontSvg, backSvg);
  const xml = new XMLSerializer().serializeToString(root);
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`], {
    type: "image/svg+xml",
  });
  const url = URL.createObjectURL(blob);
  download(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}