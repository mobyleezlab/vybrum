import type { TextLayer } from "@/lib/kit-state";
import { Slider } from "@/components/ui/slider";

export function TextsPanel({
  nome, numero, onChange,
}: {
  nome: TextLayer;
  numero: TextLayer;
  onChange: (next: { nome: TextLayer; numero: TextLayer }) => void;
}) {
  const setNome = (v: string) =>
    onChange({ nome: { ...nome, value: v.toUpperCase().slice(0, 14), touched: true }, numero });
  const setNumero = (v: string) =>
    onChange({ nome, numero: { ...numero, value: v.replace(/\D/g, "").slice(0, 2), touched: true } });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-[#888]">
            Nome
          </label>
          <input
            value={nome.value}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm uppercase text-white outline-none transition focus:border-[#68ed00]"
            placeholder="JOGADOR"
          />
        </div>
        <div className="w-24">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-[#888]">
            Número
          </label>
          <input
            value={numero.value}
            inputMode="numeric"
            onChange={(e) => setNumero(e.target.value)}
            className="w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-center text-sm text-white outline-none transition focus:border-[#68ed00]"
            placeholder="9"
          />
        </div>
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