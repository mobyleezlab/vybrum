import { useRef, useState } from "react";
import { Upload, Trash2, X, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { BADGE_PRESETS, type BadgeLayer } from "@/lib/kit-state";
import {
  useUserShields, useUploadShield, useDeleteShield,
  MAX_SHIELD_BYTES, ACCEPTED_SHIELD_MIME,
} from "@/lib/shields";

export function BadgePanel({
  layer, onChange, label,
}: {
  layer: BadgeLayer;
  onChange: (l: BadgeLayer) => void;
  label: string;
}) {
  const { data: shields } = useUserShields();
  const upload = useUploadShield();
  const removeShield = useDeleteShield();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const shieldCount = shields?.length ?? 0;
  const limit = 10;

  const onFile = (f: File | null) => {
    if (!f) return;
    setError(null);
    if (!ACCEPTED_SHIELD_MIME.includes(f.type)) { setError("Use PNG, JPG ou SVG."); return; }
    if (f.size > MAX_SHIELD_BYTES) { setError("Máximo 2MB."); return; }
    upload.mutate(f, {
      onSuccess: (s) => onChange({ ...layer, src: s.image_url }),
      onError: (e) => setError(e instanceof Error ? e.message : "Falha no upload."),
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#888]">
          {label}
        </p>
        <div className="grid h-40 place-items-center overflow-hidden rounded-xl border border-dashed border-[#2a2a2a] bg-[#1a1a1a]">
          {layer.src ? (
            <img src={layer.src} alt="Escudo" className="h-full w-full object-contain p-3" />
          ) : (
            <span className="text-[11px] text-[#666]">Escudo padrão do uniforme</span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
            className="press flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#68ed00] px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
          >
            {upload.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Upload className="h-4 w-4" />} Carregar
          </button>
          <button
            onClick={() => onChange({ ...layer, src: null })}
            disabled={!layer.src}
            className="press flex items-center justify-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-xs font-medium text-[#bbb] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Remover do uniforme"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>
        {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      </div>

      {(shields?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#888]">
              Meus escudos
            </p>
            <span className="text-[10px] text-[#666]">{shieldCount}/{limit}</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {(shields ?? []).map((s) => {
              const sel = layer.src === s.image_url;
              return (
                <div key={s.id} className="relative">
                  <button
                    onClick={() => onChange({ ...layer, src: s.image_url })}
                    className={[
                      "aspect-square w-full rounded-lg border bg-[#1a1a1a] p-1 transition",
                      sel
                        ? "border-[#68ed00] ring-2 ring-[#68ed00]/30"
                        : "border-[#2a2a2a] hover:border-[#3a3a3a]",
                    ].join(" ")}
                  >
                    <img src={s.image_url} alt={s.name} className="h-full w-full object-contain" />
                  </button>
                  <button
                    onClick={() => removeShield.mutate(s)}
                    className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-black text-white shadow"
                    aria-label="Excluir escudo"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#888]">
          Biblioteca
        </p>
        <div className="grid grid-cols-6 gap-2">
          {BADGE_PRESETS.map((b) => {
            const sel = layer.src === b.src;
            return (
              <button
                key={b.id}
                onClick={() => onChange({ ...layer, src: b.src })}
                className={[
                  "aspect-square rounded-lg border bg-[#1a1a1a] p-1 transition",
                  sel
                    ? "border-[#68ed00] ring-2 ring-[#68ed00]/30"
                    : "border-[#2a2a2a] hover:border-[#3a3a3a]",
                ].join(" ")}
              >
                <img src={b.src} alt={b.name} className="h-full w-full object-contain" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-[#888]">
          <span>Tamanho</span>
          <span className="tabular-nums text-white">{Math.round(layer.size * 100)}%</span>
        </div>
        <Slider
          value={[layer.size * 100]} min={50} max={250} step={5}
          onValueChange={(v) => onChange({ ...layer, size: v[0] / 100 })}
        />
      </div>
    </div>
  );
}