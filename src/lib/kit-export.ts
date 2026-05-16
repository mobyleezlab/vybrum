import { toPng } from "html-to-image";

export async function exportKitPng(node: HTMLElement, filename = "kit.png") {
  const dataUrl = await toPng(node, {
    pixelRatio: 4,
    backgroundColor: undefined,
    cacheBust: true,
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function exportKitSvg(svgEl: SVGSVGElement, filename = "kit.svg") {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`], {
    type: "image/svg+xml",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
