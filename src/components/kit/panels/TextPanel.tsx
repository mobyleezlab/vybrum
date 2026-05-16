import { Slider } from "@/components/ui/slider";
import { SPORT_FONTS, type TextLayer } from "@/lib/kit-state";
import { ColorPanel } from "./ColorPanel";

export function TextPanel({
  label, layer, onChange, numeric, sizeRange = [40, 300],
}: {
  label: string;
  layer: TextLayer;
  onChange: (l: TextLayer) => void;
  numeric?: boolean;
  sizeRange?: [number, number];
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-neutral-400">
          {label}
        </label>
        <input
          value={layer.value}
          onChange={(e) =>
            onChange({ ...layer, value: numeric ? e.target.value.replace(/\D/g, "").slice(0, 3) : e.target.value.slice(0, 16) })
          }
          inputMode={numeric ? "numeric" : "text"}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2196F3]"
        />
      </div>
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-neutral-400">Fonte</p>
        <div className="grid grid-cols-2 gap-2">
          {SPORT_FONTS.map((f) => {
            const sel = layer.font === f;
            return (
              <button
                key={f}
                onClick={() => onChange({ ...layer, font: f })}
                className={[
                  "rounded-lg border px-3 py-2 text-left transition",
                  sel ? "border-[#2196F3] bg-[#2196F3]/5" : "border-neutral-200 hover:border-neutral-300",
                ].join(" ")}
              >
                <div style={{ fontFamily: f }} className="text-base leading-none">{f}</div>
                <div style={{ fontFamily: f }} className="mt-1 text-xs text-neutral-500">ABC 10</div>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-neutral-400">
          <span>Tamanho</span><span className="tabular-nums">{layer.size}</span>
        </div>
        <Slider
          value={[layer.size]} min={sizeRange[0]} max={sizeRange[1]} step={2}
          onValueChange={(v) => onChange({ ...layer, size: v[0] })}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-neutral-400">
          <span>Posição vertical</span><span className="tabular-nums">{layer.offsetY}</span>
        </div>
        <Slider
          value={[layer.offsetY]} min={-120} max={120} step={2}
          onValueChange={(v) => onChange({ ...layer, offsetY: v[0] })}
        />
      </div>
      <ColorPanel value={layer.color} onChange={(c) => onChange({ ...layer, color: c })} label="Cor do texto" />
    </div>
  );
}
