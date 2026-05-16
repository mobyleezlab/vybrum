import { Eye, EyeOff, ChevronUp, ChevronDown, X, Layers as LayersIcon } from "lucide-react";
import type { Layer } from "@/lib/kit-state";

interface Props {
  open: boolean;
  layers: Layer[];
  onClose: () => void;
  onToggle: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  playerNumber: string;
  playerName: string;
  onNumberChange: (v: string) => void;
  onNameChange: (v: string) => void;
}

export function LayersPanel({
  open, layers, onClose, onToggle, onMove,
  playerNumber, playerName, onNumberChange, onNameChange,
}: Props) {
  if (!open) return null;
  // Display top → bottom (reverse paint order)
  const display = [...layers].reverse();
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[420px] rounded-t-2xl bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayersIcon className="h-5 w-5 text-neutral-700" />
            <h2 className="text-base font-semibold text-neutral-900">Camadas</h2>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-neutral-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <label className="flex flex-col text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            Número
            <input
              value={playerNumber}
              onChange={(e) => onNumberChange(e.target.value)}
              maxLength={3}
              className="mt-1 rounded-md border border-neutral-200 px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-[#2196F3]"
            />
          </label>
          <label className="flex flex-col text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            Nome
            <input
              value={playerName}
              onChange={(e) => onNameChange(e.target.value.toUpperCase())}
              maxLength={14}
              className="mt-1 rounded-md border border-neutral-200 px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-[#2196F3]"
            />
          </label>
        </div>

        <ul className="max-h-[50vh] divide-y divide-neutral-100 overflow-y-auto rounded-lg border border-neutral-100">
          {display.map((l, idx) => {
            const isFirst = idx === 0; // top
            const isLast = idx === display.length - 1; // bottom
            return (
              <li key={l.id} className="flex items-center gap-2 px-3 py-2.5">
                <button
                  onClick={() => onToggle(l.id)}
                  aria-label={l.visible ? "Ocultar" : "Mostrar"}
                  className="grid h-8 w-8 place-items-center rounded-md text-neutral-600 hover:bg-neutral-100"
                >
                  {l.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 opacity-50" />}
                </button>
                <span className={`flex-1 text-sm ${l.visible ? "text-neutral-900" : "text-neutral-400 line-through"}`}>
                  {l.label}
                </span>
                <button
                  disabled={isFirst}
                  onClick={() => onMove(l.id, 1)}
                  aria-label="Mover para cima"
                  className="grid h-8 w-8 place-items-center rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  disabled={isLast}
                  onClick={() => onMove(l.id, -1)}
                  aria-label="Mover para baixo"
                  className="grid h-8 w-8 place-items-center rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 text-[11px] text-neutral-400">
          A camada no topo da lista aparece à frente no uniforme.
        </p>
      </div>
    </div>
  );
}
