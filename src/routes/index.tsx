import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ChevronLeft, Save, Download, Undo2, Redo2,
  Shirt, Type as TypeIcon, Shield, Palette, Sparkles,
} from "lucide-react";
import { KitCanvas } from "@/components/kit/KitCanvas";
import { KitTabs } from "@/components/kit/KitTabs";
import { ColorPanel } from "@/components/kit/panels/ColorPanel";
import { TextPanel } from "@/components/kit/panels/TextPanel";
import { BadgePanel } from "@/components/kit/panels/BadgePanel";
import {
  INITIAL_STATE, TAB_TO_PART, type KitState, type PartId, type TabId,
} from "@/lib/kit-state";
import { useHistory } from "@/lib/kit-history";
import { exportKitPng, exportKitSvg } from "@/lib/kit-export";
import { saveDesign } from "@/lib/kit-storage";

export const Route = createFileRoute("/")({ component: Index });

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "body", label: "Camisa", icon: <Shirt className="h-5 w-5" /> },
  { id: "sleeves", label: "Mangas", icon: <ShirtSleeves /> },
  { id: "collar", label: "Gola", icon: <CollarIcon /> },
  { id: "shorts", label: "Calção", icon: <ShortsIcon /> },
  { id: "name", label: "Nome", icon: <TypeIcon className="h-5 w-5" /> },
  { id: "number", label: "Número", icon: <NumberIcon /> },
  { id: "badge", label: "Escudo", icon: <Shield className="h-5 w-5" /> },
];

function ShirtSleeves() {
  return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M4 6l4-2 1 3h6l1-3 4 2-2 4-2-1v9H8v-9l-2 1z"/></svg>);
}
function CollarIcon() {
  return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M6 4l6 5 6-5M9 7l3 4 3-4"/></svg>);
}
function ShortsIcon() {
  return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M4 4h16l-1 13h-6l-1-7-1 7H5z"/></svg>);
}
function NumberIcon() {
  return (<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><text x="12" y="18" textAnchor="middle" fontFamily="Bebas Neue, sans-serif" fontSize="16" fill="currentColor" stroke="none">10</text></svg>);
}

function Index() {
  const { state, set, undo, redo, canUndo, canRedo } = useHistory<KitState>(INITIAL_STATE);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [saveName, setSaveName] = useState("Modelo BR041");
  const exportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleTab = (id: TabId) => {
    set((s) => ({ ...s, activeTab: id, selectedPart: TAB_TO_PART[id] ?? s.selectedPart }), false);
  };

  const handlePartClick = (part: PartId) => {
    set((s) => ({ ...s, selectedPart: part, partColors: { ...s.partColors, [part]: s.selectedColor } }));
  };

  const applyColor = (color: string) => {
    set((s) => ({
      ...s, selectedColor: color,
      partColors: { ...s.partColors, [s.selectedPart]: color },
    }));
  };

  const handleReset = () => {
    set(INITIAL_STATE);
    setZoom(1); setPan({ x: 0, y: 0 });
  };

  const handleFlip = () => set((s) => ({ ...s, view: s.view === "front" ? "back" : "front" }), false);

  const toast = (msg: string) => { setSavedToast(msg); setTimeout(() => setSavedToast(null), 1800); };

  const handleSave = () => {
    saveDesign(saveName.trim() || "Sem nome", state);
    setSaveOpen(false);
    toast("Modelo salvo!");
  };

  const downloadPng = async () => {
    if (!exportRef.current) return;
    setDownloadOpen(false);
    await exportKitPng(exportRef.current, `kit-${state.view}.png`);
  };
  const downloadSvg = () => {
    if (!svgRef.current) return;
    setDownloadOpen(false);
    exportKitSvg(svgRef.current, `kit-${state.view}.svg`);
  };

  const renderPanel = () => {
    switch (state.activeTab) {
      case "body":
      case "sleeves":
      case "collar":
      case "shorts":
        return <ColorPanel value={state.partColors[state.selectedPart]} onChange={applyColor} />;
      case "name":
        return <TextPanel label="Nome do jogador" layer={state.playerName} sizeRange={[40, 140]}
          onChange={(l) => set((s) => ({ ...s, playerName: l }))} />;
      case "number":
        return <TextPanel label="Número" numeric layer={state.playerNumberBack} sizeRange={[80, 320]}
          onChange={(l) => set((s) => ({ ...s, playerNumberBack: l, playerNumberFront: { ...s.playerNumberFront, value: l.value, font: l.font, color: l.color } }))} />;
      case "badge":
        return <BadgePanel layer={state.badgeChest} onChange={(l) => set((s) => ({ ...s, badgeChest: l }))} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 md:py-6">
      <div className="mx-auto flex min-h-screen max-w-[420px] flex-col bg-white px-4 pb-6 pt-3 md:min-h-0 md:rounded-3xl md:shadow-xl md:ring-1 md:ring-neutral-200">
        {/* Header */}
        <header className="flex h-12 items-center justify-between">
          <button aria-label="Voltar" className="grid h-10 w-10 place-items-center rounded-full text-neutral-700 transition hover:bg-neutral-100">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-[13px] font-medium tracking-[0.18em] text-neutral-500">MODELO #BR041</h1>
          <div className="flex items-center gap-1">
            <button aria-label="Desfazer" onClick={undo} disabled={!canUndo}
              className="grid h-9 w-9 place-items-center rounded-full text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-30">
              <Undo2 className="h-4 w-4" />
            </button>
            <button aria-label="Refazer" onClick={redo} disabled={!canRedo}
              className="grid h-9 w-9 place-items-center rounded-full text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-30">
              <Redo2 className="h-4 w-4" />
            </button>
            <button aria-label="Salvar" onClick={() => setSaveOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full text-neutral-700 transition hover:bg-neutral-100">
              <Save className="h-4 w-4" />
            </button>
            <button aria-label="Baixar" onClick={() => setDownloadOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full text-neutral-700 transition hover:bg-neutral-100">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </header>

        <KitCanvas
          state={state} onPartClick={handlePartClick} onFlip={handleFlip}
          zoom={zoom} setZoom={setZoom} pan={pan} setPan={setPan}
          exportRef={exportRef} svgRef={svgRef}
        />

        <KitTabs tabs={TABS} activeId={state.activeTab} onChange={(id) => handleTab(id as TabId)} />

        {/* Panel */}
        <div key={state.activeTab} className="mt-4 max-h-[40vh] overflow-y-auto pr-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {renderPanel()}
        </div>
      </div>

      {/* Save dialog */}
      {saveOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-neutral-900">Salvar modelo</h2>
            <p className="mt-1 text-sm text-neutral-500">Dê um nome ao seu design.</p>
            <input autoFocus value={saveName} onChange={(e) => setSaveName(e.target.value)}
              className="mt-4 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#2196F3]" />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setSaveOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100">Cancelar</button>
              <button onClick={handleSave} className="rounded-lg bg-[#2196F3] px-4 py-2 text-sm font-medium text-white hover:opacity-90">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Download dialog */}
      {downloadOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-6" onClick={() => setDownloadOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-neutral-900">Baixar uniforme</h2>
            <p className="mt-1 text-sm text-neutral-500">Escolha o formato.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={downloadPng} className="rounded-xl border border-neutral-200 p-4 text-left transition hover:border-[#2196F3] hover:bg-[#2196F3]/5">
                <div className="text-sm font-semibold">PNG</div>
                <div className="mt-1 text-xs text-neutral-500">Alta resolução, fundo transparente</div>
              </button>
              <button onClick={downloadSvg} className="rounded-xl border border-neutral-200 p-4 text-left transition hover:border-[#2196F3] hover:bg-[#2196F3]/5">
                <div className="text-sm font-semibold">SVG</div>
                <div className="mt-1 text-xs text-neutral-500">Vetor editável</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {savedToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white shadow-lg">
          {savedToast}
        </div>
      )}
    </div>
  );
}
