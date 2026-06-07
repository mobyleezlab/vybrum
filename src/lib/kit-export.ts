import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";

/** Página fixa 16:9 — usada como referência de proporção. */
const PAGE_W = 1920;
const PAGE_H = 1080;

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
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

/** Exporta como PDF (1 página, paisagem, 16:9). */
export async function exportCompositePdf(node: HTMLElement, filename: string) {
  const dataUrl = await toJpeg(node, {
    width: node.offsetWidth,
    height: node.offsetHeight,
    pixelRatio: 1920 / node.offsetWidth,
    cacheBust: true,
    backgroundColor: "#ffffff",
    quality: 0.95,
  });
  // página em pt: 16:9. 720pt x 405pt mantém proporção exata.
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [PAGE_W, PAGE_H] });
  pdf.addImage(dataUrl, "JPEG", 0, 0, PAGE_W, PAGE_H);
  pdf.save(filename);
}

/** Exporta como SVG composto (nested SVGs lado a lado em viewBox 16:9). */
export function exportCompositeSvg(
  frontSvg: SVGSVGElement,
  backSvg: SVGSVGElement,
  filename: string,
) {
  const xmlns = "http://www.w3.org/2000/svg";
  const root = document.createElementNS(xmlns, "svg");
  root.setAttribute("xmlns", xmlns);
  root.setAttribute("viewBox", `0 0 ${PAGE_W} ${PAGE_H}`);
  root.setAttribute("width", String(PAGE_W));
  root.setAttribute("height", String(PAGE_H));

  // fundo branco
  const bg = document.createElementNS(xmlns, "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", String(PAGE_W));
  bg.setAttribute("height", String(PAGE_H));
  bg.setAttribute("fill", "#ffffff");
  root.appendChild(bg);

  const place = (src: SVGSVGElement, x: number) => {
    const clone = src.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", xmlns);
    clone.setAttribute("x", String(x));
    clone.setAttribute("y", "40");
    clone.setAttribute("width", String(PAGE_W / 2));
    clone.setAttribute("height", String(PAGE_H - 80));
    clone.setAttribute("preserveAspectRatio", "xMidYMid meet");
    clone.removeAttribute("style");
    root.appendChild(clone);
  };
  place(frontSvg, 0);
  place(backSvg, PAGE_W / 2);

  const xml = new XMLSerializer().serializeToString(root);
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`], {
    type: "image/svg+xml",
  });
  const url = URL.createObjectURL(blob);
  download(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}