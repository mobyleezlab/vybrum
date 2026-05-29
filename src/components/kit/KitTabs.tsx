import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Tab { id: string; label: string; icon: React.ReactNode }

export function KitTabs({
  tabs, activeId, onChange,
}: { tabs: Tab[]; activeId: string; onChange: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const drag = useRef<{ x: number; sl: number; moved: boolean } | null>(null);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && ref.current) {
      ref.current.scrollLeft += e.deltaY;
    }
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    drag.current = { x: e.clientX, sl: el.scrollLeft, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !ref.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 4) {
      if (!drag.current.moved) {
        drag.current.moved = true;
        ref.current.setPointerCapture(e.pointerId);
      }
      ref.current.scrollLeft = drag.current.sl - dx;
    }
  };
  const onPointerUp = () => {
    // keep `moved` flag briefly so the upcoming click can be suppressed
    setTimeout(() => { drag.current = null; }, 0);
  };
  const scrollBy = (n: number) => ref.current?.scrollBy({ left: n, behavior: "smooth" });

  return (
    <div className="relative mt-4">
      <div
        ref={ref}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          maskImage: `linear-gradient(to right, ${edges.left ? "transparent" : "black"} 0, black 24px, black calc(100% - 24px), ${edges.right ? "transparent" : "black"} 100%)`,
          cursor: "grab",
        }}
      >
        {tabs.map((t) => {
          const active = activeId === t.id;
          return (
            <button
              key={t.id}
              title={t.label}
              onClick={(e) => { if (drag.current?.moved) { e.preventDefault(); return; } onChange(t.id); }}
              className={[
                "press relative flex h-14 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-semibold transition",
                active
                  ? "bg-[#68ed00] text-black"
                  : "bg-[#1a1a1a] text-[#888] border border-[#2a2a2a] hover:text-white",
              ].join(" ")}
            >
              {t.icon}
              <span className="px-0.5 leading-tight">{t.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
      {edges.left && (
        <button
          aria-label="Anterior"
          onClick={() => scrollBy(-140)}
          className="absolute left-0 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-[#1a1a1a] text-white shadow-md ring-1 ring-[#2a2a2a] hover:bg-[#262626]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {edges.right && (
        <button
          aria-label="Próximo"
          onClick={() => scrollBy(140)}
          className="absolute right-0 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-[#1a1a1a] text-white shadow-md ring-1 ring-[#2a2a2a] hover:bg-[#262626]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
