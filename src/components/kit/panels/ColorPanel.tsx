import { Pipette } from "lucide-react";
import { PALETTE } from "@/lib/kit-state";

export function ColorPanel({
  value,
  onChange,
  label,
}: { value: string; onChange: (c: string) => void; label?: string }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-neutral-400">
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
                "h-9 w-9 rounded-full border border-neutral-200 transition",
                sel ? "ring-2 ring-[#2196F3] ring-offset-2" : "hover:scale-105",
              ].join(" ")}
              style={{ backgroundColor: c }}
            />
          );
        })}
        <label className="relative grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50">
          <Pipette className="h-4 w-4" />
          <input
            type="color"
            value={value}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
