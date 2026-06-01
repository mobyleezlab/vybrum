import { SPORT_FONTS, type TextLayer } from "@/lib/kit-state";
import { ColorPanel } from "./ColorPanel";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export function TextPanel({
  label, layer, onChange, numeric,
}: {
  label: string;
  layer: TextLayer;
  onChange: (l: TextLayer) => void;
  numeric?: boolean;
}) {
  const maxLen = numeric ? 2 : 14;
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-[#888]">
          {label}
        </label>
        <input
          value={layer.value}
          onChange={(e) => {
            const v = numeric
              ? e.target.value.replace(/\D/g, "").slice(0, maxLen)
              : e.target.value.toUpperCase().slice(0, maxLen);
            onChange({ ...layer, value: v, touched: true });
          }}
          inputMode={numeric ? "numeric" : "text"}
          className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none transition focus:border-[#68ed00]"
        />
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#888]">Fonte</p>
        <div className="grid grid-cols-2 gap-2">
          {SPORT_FONTS.map((f) => {
            const sel = layer.font === f;
            return (
              <button
                key={f}
                onClick={() => onChange({ ...layer, font: f, touched: true })}
                className={[
                  "rounded-lg border px-3 py-2 text-left transition",
                  sel
                    ? "border-[#68ed00] bg-[#68ed00]/10 text-white"
                    : "border-[#2a2a2a] bg-[#1a1a1a] text-[#bbb] hover:border-[#3a3a3a]",
                ].join(" ")}
              >
                <div style={{ fontFamily: f }} className="text-base leading-none">{f}</div>
                <div style={{ fontFamily: f }} className="mt-1 text-xs text-[#888]">ABC 10</div>
              </button>
            );
          })}
        </div>
      </div>

      <ColorPanel
        value={layer.color}
        onChange={(c) => onChange({ ...layer, color: c, touched: true })}
        label={`Cor do ${numeric ? "número" : "nome"}`}
      />

      <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#888]">Contorno</p>
          <Switch
            checked={layer.outlineEnabled}
            onCheckedChange={(v) =>
              onChange({ ...layer, outlineEnabled: v, touched: true })
            }
            className="data-[state=checked]:bg-[#68ed00] data-[state=unchecked]:bg-[#2a2a2a]"
          />
        </div>

        {layer.outlineEnabled && (
          <div className="mt-4 space-y-4">
            <ColorPanel
              value={layer.outlineColor}
              onChange={(c) => onChange({ ...layer, outlineColor: c, touched: true })}
              label="Cor do contorno"
            />
            <div>
              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-[#888]">
                <span>Espessura</span>
                <span className="tabular-nums text-white">{layer.outlineWidth}px</span>
              </div>
              <Slider
                value={[layer.outlineWidth]}
                min={1}
                max={8}
                step={1}
                onValueChange={(v) =>
                  onChange({ ...layer, outlineWidth: v[0], touched: true })
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
