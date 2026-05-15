import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ChevronLeft,
  Save,
  Download,
  RotateCcw,
  ZoomIn,
  RefreshCw,
  Shirt,
  Type as TypeIcon,
  Shield,
  Pipette,
} from "lucide-react";
import { UniformFrente } from "@/components/kit/UniformFrente";
import { UniformCostas } from "@/components/kit/UniformCostas";
import {
  INITIAL_STATE,
  PALETTE,
  TAB_TO_PART,
  DEFAULT_COLORS,
  type KitState,
  type PartId,
  type TabId,
} from "@/lib/kit-state";
import { exportKitPng } from "@/lib/kit-export";
import { saveDesign } from "@/lib/kit-storage";

export const Route = createFileRoute("/")({
  component: Index,
});

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  premium?: boolean;
}

const TABS: TabDef[] = [
  { id: "jersey", label: "Camisa", icon: <Shirt className="h-6 w-6" /> },
  { id: "jerseyStriped", label: "Camisa listrada", icon: <StripedShirt /> },
  { id: "shortsLong", label: "Calção longo", icon: <ShortsIcon long /> },
  { id: "shortsShort", label: "Calção curto", icon: <ShortsIcon /> },
  { id: "text", label: "Número", icon: <TypeIcon className="h-6 w-6" /> },
  { id: "badge", label: "Escudo", icon: <Shield className="h-6 w-6" /> },
];

function StripedShirt() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6l3-2 3 1h4l3-1 3 2-2 3-2-1v11H8V8L6 9z" />
      <line x1="10" y1="9" x2="10" y2="20" />
      <line x1="14" y1="9" x2="14" y2="20" />
    </svg>
  );
}

function ShortsIcon({ long = false }: { long?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={long ? "M4 4h16l-1 16h-6l-1-9-1 9H5z" : "M4 4h16l-1 11h-6l-1-6-1 6H5z"} />
      <line x1="12" y1="4" x2="12" y2="9" />
    </svg>
  );
}

function Index() {
  const [state, setState] = useState<KitState>(INITIAL_STATE);
  const [zoom, setZoom] = useState(1);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("Modelo BR041");
  const canvasRef = useRef<HTMLDivElement>(null);

  const applyColor = (color: string, partOverride?: PartId) => {
    const part = partOverride ?? TAB_TO_PART[state.activeTab];
    setState((s) => ({
      ...s,
      selectedColor: color,
      partColors: part ? { ...s.partColors, [part]: color } : s.partColors,
    }));
  };

  const handlePartClick = (part: PartId) => {
    setState((s) => ({ ...s, partColors: { ...s.partColors, [part]: s.selectedColor } }));
  };

  const handleTab = (id: TabId) => {
    setState((s) => ({ ...s, activeTab: id }));
  };

  const handleReset = () => {
    setState((s) => ({ ...s, partColors: { ...DEFAULT_COLORS } }));
    setZoom(1);
  };

  const handleFlip = () => {
    setState((s) => ({ ...s, view: s.view === "front" ? "back" : "front" }));
  };

  const handleZoom = () => setZoom((z) => (z >= 1.6 ? 1 : +(z + 0.2).toFixed(2)));

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    await exportKitPng(canvasRef.current, `kit-BR041-${state.view}.png`);
  };

  const handleSave = () => {
    saveDesign(saveName.trim() || "Sem nome", state);
    setSaveOpen(false);
    setSavedToast("Modelo salvo!");
    setTimeout(() => setSavedToast(null), 1800);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen max-w-[420px] flex-col px-4 pb-6 pt-3">
        {/* Header */}
        <header className="flex h-14 items-center justify-between">
          <button
            aria-label="Voltar"
            className="grid h-10 w-10 place-items-center rounded-full text-neutral-700 transition hover:bg-neutral-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-[13px] font-medium tracking-[0.18em] text-neutral-500">
            MODELO #BR041
          </h1>
          <div className="flex items-center gap-1">
            <button
              aria-label="Salvar"
              onClick={() => setSaveOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full text-neutral-700 transition hover:bg-neutral-100"
            >
              <Save className="h-5 w-5" />
            </button>
            <button
              aria-label="Baixar"
              onClick={handleDownload}
              className="grid h-10 w-10 place-items-center rounded-full text-neutral-700 transition hover:bg-neutral-100"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Canvas */}
        <div className="relative mt-2 rounded-2xl bg-[#ECECEC] p-3" style={{ height: 360 }}>
          <button
            onClick={handleFlip}
            aria-label="Frente / Costas"
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-neutral-700 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <div
            ref={canvasRef}
            className="flex h-full w-full items-center justify-center overflow-hidden"
          >
            <div
              className="h-full w-full transition-transform duration-300"
              style={{ transform: `scale(${zoom})` }}
            >
              {state.view === "front" ? (
                <UniformFrente colors={state.partColors} onPartClick={handlePartClick} />
              ) : (
                <UniformCostas colors={state.partColors} onPartClick={handlePartClick} />
              )}
            </div>
          </div>

          <button
            onClick={handleReset}
            aria-label="Reset"
            className="absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-neutral-700 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoom}
            aria-label="Zoom"
            className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-neutral-700 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => {
            const active = state.activeTab === t.id;
            return (
              <button
                key={t.id}
                title={t.label}
                onClick={() => handleTab(t.id)}
                className={[
                  "relative grid h-14 w-14 shrink-0 place-items-center rounded-[12px] bg-[#4A4A4A] text-white transition",
                  active ? "ring-2 ring-neutral-800 ring-offset-2" : "hover:opacity-90",
                ].join(" ")}
              >
                {t.icon}
              </button>
            );
          })}
        </div>

        {/* Palette */}
        <div className="mt-6">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-neutral-400">
            Selecione a cor
          </p>
          <div className="grid grid-cols-7 gap-3">
            {PALETTE.map((c) => {
              const sel = state.selectedColor.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  onClick={() => applyColor(c)}
                  aria-label={c}
                  className={[
                    "h-9 w-9 rounded-full transition",
                    sel ? "ring-2 ring-[#2196F3] ring-offset-2" : "hover:scale-105",
                  ].join(" ")}
                  style={{ backgroundColor: c }}
                />
              );
            })}
            <label className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-50">
              <Pipette className="h-4 w-4" />
              <input
                type="color"
                className="absolute h-0 w-0 opacity-0"
                onChange={(e) => applyColor(e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Save dialog */}
      {saveOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-neutral-900">Salvar modelo</h2>
            <p className="mt-1 text-sm text-neutral-500">Dê um nome ao seu design.</p>
            <input
              autoFocus
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="mt-4 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2196F3]"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setSaveOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-[#2196F3] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      {savedToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white shadow-lg">
          {savedToast}
        </div>
      )}
    </div>
  );
}
