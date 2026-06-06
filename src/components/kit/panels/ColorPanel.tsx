import { useState } from "react";
import { Pipette } from "lucide-react";
import { PALETTE } from "@/lib/kit-state";
import { ColorPickerModal } from "./ColorPickerModal";

export function ColorPanel({
  value,
  onChange,
  label,
}: { value: string; onChange: (c: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#888]">
        {label ?? "Selecione a cor"}
      </p>
      <div className="grid grid-cols-8 gap-3">
        {PALETTE.map((c) => {
          const sel = value.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              onClick={() => onChange(c)}
              aria-label={c}
              className={[
                "h-9 w-9 rounded-full border border-[#2a2a2a] transition",
                sel ? "ring-2 ring-[#68ed00] ring-offset-2 ring-offset-[#0f0f0f]" : "hover:scale-105",
              ].join(" ")}
              style={{ backgroundColor: c }}
            />
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Escolher cor personalizada"
          className="relative grid h-9 w-9 place-items-center rounded-full border border-[#68ed00] bg-[#0f0f0f] text-[#68ed00] transition hover:bg-[#68ed00]/10"
        >
          <Pipette className="h-4 w-4" />
        </button>
      </div>
      <ColorPickerModal
        open={open}
        value={value}
        onClose={() => setOpen(false)}
        onConfirm={onChange}
      />
    </div>
  );
}
