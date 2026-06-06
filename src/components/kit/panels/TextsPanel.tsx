import { SPORT_FONTS, type TextLayer } from "@/lib/kit-state";

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

      <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#888]">
          Fonte do nome e número
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SPORT_FONTS.map((f) => {
            const sel = nome.font === f && numero.font === f;
            return (
              <button
                key={f}
                onClick={() =>
                  onChange({
                    nome: { ...nome, font: f, touched: true },
                    numero: { ...numero, font: f, touched: true },
                  })
                }
                className={[
                  "rounded-lg border px-3 py-3 text-left transition",
                  sel
                    ? "border-[#68ed00] bg-[#68ed00]/10 text-white"
                    : "border-[#2a2a2a] bg-[#1a1a1a] text-[#bbb] hover:border-[#3a3a3a]",
                ].join(" ")}
              >
                <div style={{ fontFamily: f }} className="text-lg leading-none">{f}</div>
                <div style={{ fontFamily: f }} className="mt-1 text-xs text-[#888]">ABC 10</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}