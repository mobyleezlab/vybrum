import { useRef } from "react";
import { Upload, Trash2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { BADGE_PRESETS, type BadgeLayer } from "@/lib/kit-state";

export function BadgePanel({
  layer, onChange,
}: { layer: BadgeLayer; onChange: (l: BadgeLayer) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const onFile = (f: File | null) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => onChange({ ...layer, src: String(r.result) });
    r.readAsDataURL(f);
  };
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-neutral-400">Escolha um escudo</p>
        <div className="grid grid-cols-6 gap-2">
          {BADGE_PRESETS.map((b) => {
            const sel = layer.src === b.src;
            return (
              <button
                key={b.id}
                onClick={() => onChange({ ...layer, src: b.src })}
                className={[
                  "aspect-square rounded-lg border bg-white p-1 transition",
                  sel ? "border-[#2196F3] ring-2 ring-[#2196F3]/30" : "border-neutral-200 hover:border-neutral-300",
                ].join(" ")}
              >
                <img src={b.src} alt={b.name} className="h-full w-full object-contain" />
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          <Upload className="h-4 w-4" /> Enviar imagem
        </button>
        <button
          onClick={() => onChange({ ...layer, src: null })}
          className="grid h-10 w-10 place-items-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50"
          aria-label="Remover"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-neutral-400">
          <span>Tamanho</span><span className="tabular-nums">{layer.size}px</span>
        </div>
        <Slider value={[layer.size]} min={40} max={200} step={2} onValueChange={(v) => onChange({ ...layer, size: v[0] })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-neutral-400">
            <span>Posição X</span><span className="tabular-nums">{layer.x}</span>
          </div>
          <Slider value={[layer.x]} min={200} max={880} step={2} onValueChange={(v) => onChange({ ...layer, x: v[0] })} />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium uppercase tracking-widest text-neutral-400">
            <span>Posição Y</span><span className="tabular-nums">{layer.y}</span>
          </div>
          <Slider value={[layer.y]} min={80} max={1020} step={2} onValueChange={(v) => onChange({ ...layer, y: v[0] })} />
        </div>
      </div>
    </div>
  );
}
