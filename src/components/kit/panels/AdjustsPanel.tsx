import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ColorPanel } from "./ColorPanel";
import type { TextLayer } from "@/lib/kit-state";

/**
 * Cores e contornos do nome e do número.
 * Tamanhos e posição vivem no painel "Nome/Nº".
 */
export function AdjustsPanel({
  nome, numero, onChange,
}: {
  nome: TextLayer;
  numero: TextLayer;
  onChange: (next: { nome: TextLayer; numero: TextLayer }) => void;
}) {
  const both = (patch: Partial<TextLayer>) =>
    onChange({
      nome: { ...nome, ...patch, touched: true },
      numero: { ...numero, ...patch, touched: true },
    });

  return (
    <div className="space-y-4">
      <ColorPanel
        value={nome.color}
        onChange={(c) => both({ color: c })}
        label="Cor do nome e número"
      />

      <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#888]">Contorno</p>
          <Switch
            checked={nome.outlineEnabled || numero.outlineEnabled}
            onCheckedChange={(v) => both({ outlineEnabled: v })}
            className="data-[state=checked]:bg-[#68ed00] data-[state=unchecked]:bg-[#2a2a2a]"
          />
        </div>

        {(nome.outlineEnabled || numero.outlineEnabled) && (
          <div className="mt-4 space-y-4">
            <ColorPanel
              value={nome.outlineColor}
              onChange={(c) => both({ outlineColor: c })}
              label="Cor do contorno"
            />
            <SliderRow
              label="Espessura do contorno"
              value={nome.outlineWidth}
              min={1} max={8} step={1} suffix="px"
              onChange={(v) => both({ outlineWidth: v })}
            />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#888]">Nome</p>
        <SliderRow
          label="Tamanho do nome"
          value={Math.round((nome.sizeScale ?? 1) * 100)}
          min={60} max={160} step={5} suffix="%"
          onChange={(v) => onChange({ nome: { ...nome, sizeScale: v / 100, touched: true }, numero })}
        />
        <SliderRow
          label="Posição vertical do nome"
          value={nome.yOffset ?? 0}
          min={-150} max={150} step={2}
          onChange={(v) => onChange({ nome: { ...nome, yOffset: v, touched: true }, numero })}
        />
      </div>

      <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#888]">Número</p>
        <SliderRow
          label="Tamanho do número"
          value={Math.round((numero.sizeScale ?? 1) * 100)}
          min={60} max={160} step={5} suffix="%"
          onChange={(v) => onChange({ nome, numero: { ...numero, sizeScale: v / 100, touched: true } })}
        />
        <SliderRow
          label="Posição vertical do número (frente e verso)"
          value={numero.yOffset ?? 0}
          min={-150} max={150} step={2}
          onChange={(v) => onChange({ nome, numero: { ...numero, yOffset: v, touched: true } })}
        />
      </div>
    </div>
  );
}

function SliderRow({
  label, value, min, max, step, suffix, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  suffix?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-[#888]">
        <span>{label}</span>
        <span className="tabular-nums text-white">{value}{suffix ?? ""}</span>
      </div>
      <Slider
        value={[value]} min={min} max={max} step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}