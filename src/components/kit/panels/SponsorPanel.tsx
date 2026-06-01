import { useRef, useState } from "react";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import type { SponsorLayer } from "@/lib/kit-state";

const MAX = 2 * 1024 * 1024;
const ACCEPT = ["image/png", "image/jpeg", "image/svg+xml"];

function Slot({
  label, value, onChange,
}: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const onFile = (f: File | null) => {
    if (!f) return;
    setError(null);
    if (!ACCEPT.includes(f.type)) { setError("Use PNG, JPG ou SVG."); return; }
    if (f.size > MAX) { setError("Máximo 2MB."); return; }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.onerror = () => setError("Falha ao carregar a imagem.");
    reader.readAsDataURL(f);
  };

  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#888]">{label}</p>
      <div className="mb-3 grid h-40 place-items-center overflow-hidden rounded-xl border border-dashed border-[#2a2a2a] bg-[#1a1a1a]">
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-contain p-3" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-[11px] text-[#666]">
            <ImageIcon className="h-5 w-5 opacity-60" />
            Sem patrocinador
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => ref.current?.click()}
          className="press flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#68ed00] px-3 py-2 text-xs font-bold text-black"
        >
          <Upload className="h-4 w-4" /> Carregar
        </button>
        <button
          onClick={() => onChange(null)}
          disabled={!value}
          className="press flex items-center justify-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-xs font-medium text-[#bbb] transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

export function SponsorPanel({
  value, onChange,
}: { value: SponsorLayer; onChange: (v: SponsorLayer) => void }) {
  return (
    <div className="space-y-3">
      <Slot
        label="Frente"
        value={value.front}
        onChange={(v) =>
          onChange({ ...value, front: v, touched: { ...value.touched, front: true } })
        }
      />
      <Slot
        label="Verso"
        value={value.back}
        onChange={(v) =>
          onChange({ ...value, back: v, touched: { ...value.touched, back: true } })
        }
      />
    </div>
  );
}