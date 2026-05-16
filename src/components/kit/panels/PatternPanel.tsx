import type { PatternKind } from "@/lib/kit-state";
import { ColorPanel } from "./ColorPanel";

const PATTERNS: { id: PatternKind; label: string; preview: React.ReactNode }[] = [
  { id: "solid", label: "Sólido", preview: <div className="h-full w-full bg-current" /> },
  {
    id: "verticalStripes", label: "Vertical",
    preview: (
      <svg viewBox="0 0 40 40" className="h-full w-full"><rect width="40" height="40" fill="currentColor" opacity="0.2"/><rect x="6" width="6" height="40" fill="currentColor"/><rect x="20" width="6" height="40" fill="currentColor"/><rect x="34" width="2" height="40" fill="currentColor"/></svg>
    ),
  },
  {
    id: "horizontalStripes", label: "Horizontal",
    preview: (
      <svg viewBox="0 0 40 40" className="h-full w-full"><rect width="40" height="40" fill="currentColor" opacity="0.2"/><rect y="6" width="40" height="6" fill="currentColor"/><rect y="20" width="40" height="6" fill="currentColor"/></svg>
    ),
  },
  {
    id: "diagonal", label: "Diagonal",
    preview: (
      <svg viewBox="0 0 40 40" className="h-full w-full"><rect width="40" height="40" fill="currentColor" opacity="0.2"/><g transform="rotate(45 20 20)"><rect x="-10" width="6" height="80" fill="currentColor"/><rect x="14" width="6" height="80" fill="currentColor"/></g></svg>
    ),
  },
  {
    id: "sash", label: "Faixa",
    preview: (
      <svg viewBox="0 0 40 40" className="h-full w-full"><rect width="40" height="40" fill="currentColor" opacity="0.2"/><rect x="-5" y="14" width="50" height="10" transform="rotate(-22 20 20)" fill="currentColor"/></svg>
    ),
  },
];

export function PatternPanel({
  pattern, onPattern, color, onColor,
}: {
  pattern: PatternKind; onPattern: (p: PatternKind) => void;
  color: string; onColor: (c: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-neutral-400">Estampa</p>
        <div className="grid grid-cols-5 gap-2">
          {PATTERNS.map((p) => {
            const sel = pattern === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onPattern(p.id)}
                title={p.label}
                className={[
                  "grid aspect-square place-items-center rounded-lg border bg-white p-2 text-[#1A3DB5] transition",
                  sel ? "border-[#2196F3] ring-2 ring-[#2196F3]/30" : "border-neutral-200 hover:border-neutral-300",
                ].join(" ")}
              >
                {p.preview}
              </button>
            );
          })}
        </div>
      </div>
      <ColorPanel value={color} onChange={onColor} label="Cor da estampa" />
    </div>
  );
}
