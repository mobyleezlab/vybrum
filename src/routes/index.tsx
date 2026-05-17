import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  ChevronLeft, Save, Download, Undo2, Redo2,
  Shirt, Type as TypeIcon, Shield, Sparkles, Hash, Minus,
} from "lucide-react";
import { KitCanvas } from "@/components/kit/KitCanvas";
import { KitTabs } from "@/components/kit/KitTabs";
import { ColorPanel } from "@/components/kit/panels/ColorPanel";
import { TextPanel } from "@/components/kit/panels/TextPanel";
import { BadgePanel } from "@/components/kit/panels/BadgePanel";
import {
  INITIAL_STATE, PART_LABELS, TEXT_LABELS,
  type KitState, type TabId, type PartId, type TextId, type BadgeId,
} from "@/lib/kit-state";
import { useHistory } from "@/lib/kit-history";
import { exportKitPng, exportKitSvg } from "@/lib/kit-export";
import { saveDesign } from "@/lib/kit-storage";

export const Route = createFileRoute("/")({ component: Index });

type Tab = { id: TabId; label: string; icon: React.ReactNode; view: "front" | "back" };

const TABS: Tab[] = [
  // FRENTE — peças
  { id: "camisa_frente",   label: "Camisa Frente",  icon: <Shirt className="h-5 w-5" />,    view: "front" },
  { id: "mangas_frente",   label: "Mangas Frente",  icon: <Shirt className="h-5 w-5" />,    view: "front" },
  { id: "gola_frente",     label: "Gola Frente",    icon: <Minus className="h-5 w-5" />,    view: "front" },
  { id: "short_frente",    label: "Short Frente",   icon: <Shirt className="h-5 w-5" />,    view: "front" },
  // FRENTE — estampas
  { id: "estampa_camisa_frente", label: "Estampa Camisa F", icon: <Sparkles className="h-5 w-5" />, view: "front" },
  { id: "estampa_mangas_frente", label: "Estampa Mangas F", icon: <Sparkles className="h-5 w-5" />, view: "front" },
  { id: "estampa_short_frente",  label: "Estampa Short F",  icon: <Sparkles className="h-5 w-5" />, view: "front" },
  // FRENTE — números / escudos
  { id: "numero_camisa_frente", label: "Número Frente",   icon: <Hash className="h-5 w-5" />,   view: "front" },
  { id: "numero_short_frente",  label: "Número Short",    icon: <Hash className="h-5 w-5" />,   view: "front" },
  { id: "escudo_camisa_frente", label: "Escudo Camisa",   icon: <Shield className="h-5 w-5" />, view: "front" },
  { id: "escudo_short_frente",  label: "Escudo Short",    icon: <Shield className="h-5 w-5" />, view: "front" },
  { id: "costuras_frente",      label: "Costuras Frente", icon: <Minus className="h-5 w-5" />,  view: "front" },
  // VERSO — peças
  { id: "camisa_verso",   label: "Camisa Verso",  icon: <Shirt className="h-5 w-5" />, view: "back" },
  { id: "mangas_verso",   label: "Mangas Verso",  icon: <Shirt className="h-5 w-5" />, view: "back" },
  { id: "gola_verso",     label: "Gola Verso",    icon: <Minus className="h-5 w-5" />, view: "back" },
  { id: "short_verso",    label: "Short Verso",   icon: <Shirt className="h-5 w-5" />, view: "back" },
  // VERSO — estampas
  { id: "estampa_camisa_verso", label: "Estampa Camisa V", icon: <Sparkles className="h-5 w-5" />, view: "back" },
  { id: "estampa_mangas_verso", label: "Estampa Mangas V", icon: <Sparkles className="h-5 w-5" />, view: "back" },
  { id: "estampa_short_verso",  label: "Estampa Short V",  icon: <Sparkles className="h-5 w-5" />, view: "back" },
  // VERSO — texto
  { id: "nome_camisa_verso",    label: "Nome Jogador",     icon: <TypeIcon className="h-5 w-5" />, view: "back" },
  { id: "numero_camisa_verso",  label: "Número Verso",     icon: <Hash className="h-5 w-5" />,    view: "back" },
  { id: "costuras_verso",       label: "Costuras Verso",   icon: <Minus className="h-5 w-5" />,   view: "back" },
];

const TEXT_ID_SET = new Set<TabId>([
  "numero_camisa_frente", "numero_camisa_verso", "numero_short_frente", "nome_camisa_verso",
]);
const BADGE_ID_SET = new Set<TabId>(["escudo_camisa_frente", "escudo_short_frente"]);

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

  const visibleTabs = useMemo(() => TABS.filter((t) => t.view === state.view), [state.view]);

  const handleTab = (id: TabId) => {
    set((s) => {
      const isPart = !TEXT_ID_SET.has(id) && !BADGE_ID_SET.has(id);
      return { ...s, activeTab: id, selectedPart: isPart ? (id as PartId) : s.selectedPart };
    }, false);
  };

  const handleFlip = () =>
    set((s) => {
      const next = s.view === "front" ? "back" : "front";
      // garante uma aba válida para a nova view
      const firstTab = TABS.find((t) => t.view === next)!;
      return { ...s, view: next, activeTab: firstTab.id, selectedPart: firstTab.id as PartId };
    }, false);

  const applyColor = (color: string) => {
    if (TEXT_ID_SET.has(state.activeTab) || BADGE_ID_SET.has(state.activeTab)) return;
    const id = state.activeTab as PartId;
    set((s) => ({ ...s, partColors: { ...s.partColors, [id]: color } }));
  };

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
    const id = state.activeTab;
    if (TEXT_ID_SET.has(id)) {
      const tid = id as TextId;
      const isNumber = tid !== "nome_camisa_verso";
      return (
        <TextPanel
          label={TEXT_LABELS[tid]}
          layer={state.texts[tid]}
          numeric={isNumber}
          onChange={(l) => set((s) => ({ ...s, texts: { ...s.texts, [tid]: l } }))}
        />
      );
    }
    if (BADGE_ID_SET.has(id)) {
      const bid = id as BadgeId;
      return (
        <>
          <BadgePanel
            label={PART_LABELS[bid]}
            layer={state.badges[bid]}
            onChange={(l) => set((s) => ({ ...s, badges: { ...s.badges, [bid]: l } }))}
          />
          <div className="mt-4">
            <ColorPanel
              value={state.partColors[bid]}
              onChange={applyColor}
              label="Cor do escudo (placeholder)"
            />
          </div>
        </>
      );
    }
    const pid = id as PartId;
    return (
      <ColorPanel
        value={state.partColors[pid]}
        onChange={applyColor}
        label={`Cor — ${PART_LABELS[pid]}`}
      />
    );
  };

  return (
    <div className="min-h-screen bg-neutral-100 md:py-6">
      <div className="mx-auto flex min-h-screen max-w-[460px] flex-col bg-white px-4 pb-6 pt-3 md:min-h-0 md:rounded-3xl md:shadow-xl md:ring-1 md:ring-neutral-200">
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
          state={state} onFlip={handleFlip}
          zoom={zoom} setZoom={setZoom} pan={pan} setPan={setPan}
          exportRef={exportRef} svgRef={svgRef}
        />

        <KitTabs tabs={visibleTabs} activeId={state.activeTab} onChange={(id) => handleTab(id as TabId)} />

        <div key={state.activeTab} className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {renderPanel()}
        </div>
      </div>

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

      {downloadOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-6" onClick={() => setDownloadOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-neutral-900">Baixar uniforme</h2>
            <p className="mt-1 text-sm text-neutral-500">Escolha o formato.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={downloadPng} className="rounded-xl border border-neutral-200 p-4 text-left transition hover:border-[#2196F3] hover:bg-[#2196F3]/5">
                <div className="text-sm font-semibold">PNG</div>
                <div className="mt-1 text-xs text-neutral-500">Alta resolução</div>
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
