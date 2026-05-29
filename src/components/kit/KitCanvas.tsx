import { useEffect, useRef, useState } from "react";
import { RefreshCw, ZoomIn, Maximize2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { KitSvg } from "./KitSvg";
import type { KitState } from "@/lib/kit-state";

interface Props {
  state: KitState;
  onFlip: () => void;
  zoom: number;
  setZoom: (n: number) => void;
  pan: { x: number; y: number };
  setPan: (p: { x: number; y: number }) => void;
  exportRef: React.RefObject<HTMLDivElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  frontRaw?: string;
  backRaw?: string;
}

export function KitCanvas({
  state, onFlip, zoom, setZoom, pan, setPan, exportRef, svgRef, frontRaw, backRaw,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const pinch = useRef<{ d: number; z: number } | null>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      setZoom(Math.min(2.5, Math.max(0.5, +(zoom + delta).toFixed(2))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom, setZoom]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { d: Math.hypot(b.x - a.x, b.y - a.y), z: zoom };
    } else if (zoom > 1) {
      setDrag({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const next = pinch.current.z * (d / pinch.current.d);
      setZoom(Math.min(2.5, Math.max(0.5, +next.toFixed(2))));
      return;
    }
    if (drag && zoom > 1) {
      const max = 250 * (zoom - 1);
      setPan({
        x: Math.max(-max, Math.min(max, e.clientX - drag.x)),
        y: Math.max(-max, Math.min(max, e.clientY - drag.y)),
      });
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setDrag(null);
  };

  return (
    <div
      className="relative mt-2 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#111111] p-2"
      style={{
        height: "clamp(420px, 62vh, 620px)",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <button
        onClick={onFlip}
        aria-label="Frente / Costas"
        className="press absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-[#1a1a1a] text-white shadow-sm ring-1 ring-[#2a2a2a] transition hover:bg-[#262626]"
      >
        <RefreshCw className="h-4 w-4" />
      </button>

      <div
        ref={wrapRef}
        className="relative h-full w-full touch-none select-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: zoom > 1 ? (drag ? "grabbing" : "grab") : "default" }}
      >
        <div
          ref={exportRef}
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transition: drag || pinch.current ? "none" : "transform 200ms ease-out",
            willChange: "transform",
          }}
        >
          <div key={state.view} className="vy-flip flex h-full w-full items-center justify-center">
            <KitSvg ref={svgRef} state={state} frontRaw={frontRaw} backRaw={backRaw} />
          </div>
        </div>
      </div>

      {/* Zoom toggle button (bottom-right, mirrors the flip button) */}
      <button
        onClick={() => setZoomOpen((v) => !v)}
        aria-label="Zoom"
        aria-pressed={zoomOpen}
        className="press absolute right-3 bottom-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-[#1a1a1a] text-white shadow-sm ring-1 ring-[#2a2a2a] transition hover:bg-[#262626]"
      >
        <ZoomIn className="h-4 w-4" />
      </button>

      {zoomOpen && (
        <div className="absolute right-3 bottom-14 z-10 flex flex-col items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-1.5 py-3 shadow-sm">
          <span className="text-[10px] font-medium tabular-nums text-[#888]">
            {Math.round(zoom * 100)}%
          </span>
          <div className="h-40 py-1">
            <Slider
              orientation="vertical"
              value={[zoom * 100]}
              min={50}
              max={250}
              step={5}
              onValueChange={(v) => setZoom(v[0] / 100)}
              className="h-full"
            />
          </div>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="grid h-7 w-7 place-items-center rounded-full text-white hover:bg-[#262626]"
            aria-label="Tamanho padrão"
            title="Tamanho padrão"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
