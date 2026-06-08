import opentype from "opentype.js";

/** TTF URL para cada fonte de esporte usada no editor. */
export const FONT_TTF_URLS: Record<string, string> = {
  "Bebas Neue": "https://fonts.gstatic.com/s/bebasneue/v16/JTUSjIg69CK48gW7PXoo9Wlhzg.ttf",
  "Anton": "https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm3Kz-Co.ttf",
  "Teko": "https://fonts.gstatic.com/s/teko/v23/LYjYdG7kmE0gV69VVPPdFl06VN8XG4S11zY.ttf",
  "Oswald": "https://fonts.gstatic.com/s/oswald/v57/TK3_WkUHHAIjg75cFRf3bXL8LICs1_FvsUZiYA.ttf",
  "Russo One": "https://fonts.gstatic.com/s/russoone/v18/Z9XUDmZRWg6M1LvRYsHOz8mM.ttf",
  "Rajdhani": "https://fonts.gstatic.com/s/rajdhani/v17/LDIxapCSOBg7S-QT7p4HM-M.ttf",
  "Orbitron": "https://fonts.gstatic.com/s/orbitron/v35/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyGy6BoWg2.ttf",
  "Michroma": "https://fonts.gstatic.com/s/michroma/v21/PN_zRfy9qWD8fEagAPg9pTw.ttf",
  "Black Ops One": "https://fonts.gstatic.com/s/blackopsone/v21/qWcsB6-ypo7xBdr6Xshe96H3aDvbsg.ttf",
  "Bowlby One": "https://fonts.gstatic.com/s/bowlbyone/v25/taiPGmVuC4y96PFeqp8sqomI-Q.ttf",
  "Audiowide": "https://fonts.gstatic.com/s/audiowide/v22/l7gdbjpo0cum0ckerWCdlg_L.ttf",
  "Barlow Condensed": "https://fonts.gstatic.com/s/barlowcondensed/v13/HTx3L3I-JCGChYJ8VI-L6OO_au7B6xHT3w.ttf",
  "Saira Condensed": "https://fonts.gstatic.com/s/sairacondensed/v12/EJROQgErUN8XuHNEtX81i9TmEkrvoutA.ttf",
  "Staatliches": "https://fonts.gstatic.com/s/staatliches/v15/HI_OiY8KO6hCsQSoAPmtMYebvpU.ttf",
  "Monoton": "https://fonts.gstatic.com/s/monoton/v22/5h1aiZUrOngCibe4TkHLRw.ttf",
};

const cache = new Map<string, Promise<opentype.Font>>();

export function loadFont(family: string): Promise<opentype.Font> {
  const url = FONT_TTF_URLS[family];
  if (!url) return Promise.reject(new Error(`Fonte sem TTF mapeado: ${family}`));
  const hit = cache.get(family);
  if (hit) return hit;
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`Falha ao baixar ${family}`);
      return r.arrayBuffer();
    })
    .then((buf) => opentype.parse(buf));
  cache.set(family, p);
  return p;
}

/**
 * Converte todos os <text> dentro do SVG em <path> (curvas) usando a fonte
 * embutida. Mantém fill/stroke/stroke-width. Após esta operação o SVG não
 * depende de nenhuma fonte instalada.
 */
export async function textToCurves(svg: SVGSVGElement): Promise<void> {
  const texts = Array.from(svg.querySelectorAll("text"));
  // Pré-carrega cada família única
  const families = new Set<string>();
  texts.forEach((t) => {
    const fam = (t.getAttribute("font-family") || "").split(",")[0].trim().replace(/^["']|["']$/g, "");
    if (fam && FONT_TTF_URLS[fam]) families.add(fam);
  });
  const loaded = new Map<string, opentype.Font>();
  await Promise.all(
    Array.from(families).map(async (f) => {
      try { loaded.set(f, await loadFont(f)); } catch { /* fallback: mantém <text> */ }
    }),
  );

  for (const t of texts) {
    const famAttr = (t.getAttribute("font-family") || "").split(",")[0].trim().replace(/^["']|["']$/g, "");
    const font = loaded.get(famAttr);
    if (!font) continue;
    const sizeAttr = t.getAttribute("font-size") || "16";
    const size = parseFloat(sizeAttr);
    const x = parseFloat(t.getAttribute("x") || "0");
    const y = parseFloat(t.getAttribute("y") || "0");
    const anchor = t.getAttribute("text-anchor") || "start";
    const baseline = t.getAttribute("dominant-baseline") || "alphabetic";
    const fill = t.getAttribute("fill") ?? "#000";
    const stroke = t.getAttribute("stroke") ?? "none";
    const strokeWidth = t.getAttribute("stroke-width") ?? "0";
    const paintOrder = t.getAttribute("paint-order");
    const strokeLinejoin = t.getAttribute("stroke-linejoin");
    const strokeLinecap = t.getAttribute("stroke-linecap");
    const text = t.textContent || "";
    if (!text) { t.remove(); continue; }

    // Cálculo de posição com anchor/baseline
    const advance = font.getAdvanceWidth(text, size);
    let dx = 0;
    if (anchor === "middle") dx = -advance / 2;
    else if (anchor === "end") dx = -advance;
    let dy = 0;
    if (baseline === "central" || baseline === "middle") {
      // Aproxima centro vertical com base na métrica capHeight/units
      const cap = (font.tables?.os2 as { sCapHeight?: number } | undefined)?.sCapHeight
        ?? font.ascender * 0.7;
      dy = (cap / font.unitsPerEm) * size / 2;
    } else if (baseline === "hanging") {
      dy = (font.ascender / font.unitsPerEm) * size;
    }

    const path = font.getPath(text, x + dx, y + dy, size);
    const d = path.toPathData(3);
    const ns = "http://www.w3.org/2000/svg";
    const el = document.createElementNS(ns, "path");
    el.setAttribute("d", d);
    el.setAttribute("fill", fill);
    if (stroke && stroke !== "none") {
      el.setAttribute("stroke", stroke);
      el.setAttribute("stroke-width", strokeWidth);
      if (strokeLinejoin) el.setAttribute("stroke-linejoin", strokeLinejoin);
      if (strokeLinecap) el.setAttribute("stroke-linecap", strokeLinecap);
      if (paintOrder) el.setAttribute("paint-order", paintOrder);
    }
    t.replaceWith(el);
  }
}