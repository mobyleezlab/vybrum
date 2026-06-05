import { SPORT_FONTS, type TextLayer } from "@/lib/kit-state";

export function FontsPanel({
  nome, numero, onChange,
}: {
  nome: TextLayer;
  numero: TextLayer;
  onChange: (next: { nome: TextLayer; numero: TextLayer }) => void;
}) {
  const setFont = (f: string) =>
    onChange({
      nome: { ...nome, font: f, touched: true },
      numero: { ...numero, font: f, touched: true },
    });

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#888]">
        Fonte do nome e número
      </p>
      <div className="grid grid-cols-2 gap-2">
        {SPORT_FONTS.map((f) => {
          const sel = nome.font === f && numero.font === f;
          return (
            <button
              key={f}
              onClick={() => setFont(f)}
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
  );
}