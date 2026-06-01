import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function ColorPickerModal({
  open, value, onClose, onConfirm,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (hex: string) => void;
}) {
  const [hex, setHex] = useState(value);

  useEffect(() => { if (open) setHex(value); }, [open, value]);

  if (!open) return null;

  const safe = /^#([0-9a-f]{6})$/i.test(hex) ? hex : value;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/70 px-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">
            Cor personalizada
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="press grid h-8 w-8 place-items-center rounded-full text-[#888] hover:bg-[#1a1a1a] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 grid place-items-center">
          <label className="relative h-32 w-32 cursor-pointer overflow-hidden rounded-2xl border border-[#2a2a2a] shadow-inner">
            <div className="absolute inset-0" style={{ backgroundColor: safe }} />
            <input
              type="color"
              value={safe}
              onChange={(e) => setHex(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>

        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-[#888]">
          Código HEX
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 focus-within:border-[#68ed00]">
          <span className="text-sm text-[#888]">#</span>
          <input
            value={hex.replace(/^#/, "")}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
              setHex("#" + v);
            }}
            className="w-full bg-transparent text-sm uppercase tracking-widest text-white outline-none"
            placeholder="FFFFFF"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-[#888] hover:bg-[#1a1a1a]"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm(/^#([0-9a-f]{6})$/i.test(hex) ? hex : value);
              onClose();
            }}
            className="rounded-lg bg-[#68ed00] px-4 py-2 text-sm font-bold text-black hover:opacity-90"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}