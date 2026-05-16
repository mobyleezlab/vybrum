import { useEffect, useRef, useState } from "react";
import { RefreshCw, RotateCcw, ZoomIn, Maximize2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { KitSvg } from "./KitSvg";
import type { KitState, PartId } from "@/lib/kit-state";

interface Props {
  state: KitState;
  onPartClick: (p: PartId) => void;
  onFlip: () => void;
  onReset: () => void;
  zoom: number;
  setZoom: (n: number) => void;
  pan: { x: number; y: number };
  setPan: (p: { x: number; y: number }) => void;
  exportRef: React.RefObject<HTMLDivElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

export function KitCanvas({
  state, onPartClick, onFlip, onReset, zoom, setZoom, pan, setPan, exportRef, svgRef,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [showZoom, setShowZoom] = useState(false);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const pinch = useRef<{ d: number; z: number } | null>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());

  // Wheel zoom
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      setZoom(Math.min(2, Math.max(0.5, +(zoom + delta).toFixed(2))));
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
      setZoom(Math.min(2, Math.max(0.5, +next.toFixed(2))));
      return;
    }
    if (drag && zoom > 1) {
      const max = 200 * (zoom - 1);
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
      className="relative mt-2 rounded-2xl bg-[#ECECEC] p-2"
      style={{ height: "clamp(320px, 50vh, 480px)" }}
      onPointerDownCapture={(e) => {
        if (showZoom && !(e.target as HTMLElement).closest("[data-zoom-ui]")) setShowZoom(false);
      }}
    >
      <button
        onClick={onFlip}
        aria-label="Frente / Costas"
        className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-neutral-700 shadow-sm backdrop-blur transition hover:bg-white"
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
          <KitSvg ref={svgRef} state={state} onPartClick={onPartClick} />
        </div>
      </div>

      <button
        onClick={onReset}
        aria-label="Reset"
        className="absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-neutral-700 shadow-sm backdrop-blur transition hover:bg-white"
      >
        <RotateCcw className="h-4 w-4" />
      </button>

      <div className="absolute bottom-3 right-3 flex items-center gap-2" data-zoom-ui>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          aria-label="Ajustar 100%"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/80 text-neutral-700 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <div className="relative">
          {showZoom && (
            <div className="absolute bottom-12 right-0 flex w-12 flex-col items-center gap-2 rounded-2xl bg-white/95 px-2 py-3 shadow-lg backdrop-blur">
              <span className="text-[10px] font-medium text-neutral-700 tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <div className="h-32">
                <Slider
                  orientation="vertical"
                  value={[zoom * 100]}
                  min={50}
                  max={200}
                  step={5}
                  onValueChange={(v) => setZoom(v[0] / 100)}
                />
              </div>
            </div>
          )}
          <button
            onClick={() => setShowZoom((s) => !s)}
            aria-label="Zoom"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/80 text-neutral-700 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
