import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

export function ColorPickerModal({
  open, value, onClose, onConfirm,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (hex: string) => void;
}) {
  const [hsv, setHsv] = useState(() => hexToHsv(value));

  useEffect(() => { if (open) setHsv(hexToHsv(value)); }, [open, value]);

  const hex = useMemo(() => hsvToHex(hsv.h, hsv.s, hsv.v), [hsv]);
  const hueColor = useMemo(() => hsvToHex(hsv.h, 1, 1), [hsv.h]);

  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  const dragSV = (e: React.PointerEvent) => {
    const el = svRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const update = (clientX: number, clientY: number) => {
      const r = el.getBoundingClientRect();
      const s = clamp((clientX - r.left) / r.width, 0, 1);
      const v = 1 - clamp((clientY - r.top) / r.height, 0, 1);
      setHsv((p) => ({ ...p, s, v }));
    };
    update(e.clientX, e.clientY);
    const move = (ev: PointerEvent) => update(ev.clientX, ev.clientY);
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  const dragHue = (e: React.PointerEvent) => {
    const el = hueRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const update = (clientX: number) => {
      const r = el.getBoundingClientRect();
      const h = clamp((clientX - r.left) / r.width, 0, 1) * 360;
      setHsv((p) => ({ ...p, h }));
    };
    update(e.clientX);
    const move = (ev: PointerEvent) => update(ev.clientX);
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/70 px-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">
            Cor personalizada
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="press grid h-8 w-8 place-items-center rounded-full text-[#888] hover:bg-[#1a1a1a] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={svRef}
          onPointerDown={dragSV}
          className="relative mb-4 h-56 w-full touch-none select-none overflow-hidden rounded-2xl border border-[#2a2a2a]"
          style={{ backgroundColor: hueColor }}
        >
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(to right, #fff, transparent)" }} />
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(to top, #000, transparent)" }} />
          <div
            className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
            style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: hex }}
          />
        </div>

        <div
          ref={hueRef}
          onPointerDown={dragHue}
          className="relative mb-4 h-5 w-full touch-none select-none rounded-full"
          style={{ backgroundImage: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
        >
          <div
            className="pointer-events-none absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
            style={{ left: `${(hsv.h / 360) * 100}%`, backgroundColor: hsvToHex(hsv.h, 1, 1) }}
          />
        </div>

        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-[#888]">
          Código HEX
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 focus-within:border-[#68ed00]">
          <span className="h-5 w-5 rounded border border-[#2a2a2a]" style={{ backgroundColor: hex }} />
          <span className="text-sm text-[#888]">#</span>
          <input
            value={hex.replace(/^#/, "").toUpperCase()}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
              if (/^[0-9a-fA-F]{6}$/.test(v)) setHsv(hexToHsv("#" + v));
            }}
            className="w-full bg-transparent text-sm uppercase tracking-widest text-white outline-none"
            placeholder="FFFFFF"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[#888] hover:bg-[#1a1a1a]"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm(hex);
              onClose();
            }}
            className="rounded-lg bg-[#68ed00] px-4 py-2 text-sm font-bold text-black hover:opacity-90"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

function clamp(n: number, mn: number, mx: number) { return Math.min(mx, Math.max(mn, n)); }

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return { h: 0, s: 0, v: 1 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60)      { r = c; g = x; }
  else if (h < 120){ r = x; g = c; }
  else if (h < 180){ g = c; b = x; }
  else if (h < 240){ g = x; b = c; }
  else if (h < 300){ r = x; b = c; }
  else             { r = c; b = x; }
  const to = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
  return ("#" + to(r) + to(g) + to(b)).toUpperCase();
}