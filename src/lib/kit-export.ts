import { toPng } from "html-to-image";

export async function exportKitPng(node: HTMLElement, filename = "kit.png") {
  const dataUrl = await toPng(node, {
    pixelRatio: 3,
    backgroundColor: "#ECECEC",
    cacheBust: true,
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}