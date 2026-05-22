import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  ChevronLeft, Save, Download, Undo2, Redo2,
  Shirt, Type as TypeIcon, Shield, Sparkles, Hash, Minus,
} from "lucide-react";
import { KitCanvas } from "@/components/kit/KitCanvas";
import { KitTabs } from "@/components/kit/KitTabs";
import { ModelSelector } from "@/components/kit/ModelSelector";
import { useQuery } from "@tanstack/react-query";
import type { ModelRow } from "@/lib/models";
import { ColorPanel } from "@/components/kit/panels/ColorPanel";
import { TextPanel } from "@/components/kit/panels/TextPanel";
import { BadgePanel } from "@/components/kit/panels/BadgePanel";
import {
  INITIAL_STATE, COLOR_LABELS, TEXT_LABELS, COLOR_GROUP_IDS, TEXT_GROUP_IDS,
  FRONT_TABS, BACK_TABS,
  type KitState, type TabId, type ColorGroup, type TextGroup,
} from "@/lib/kit-state";
import { useHistory } from "@/lib/kit-history";
import { exportKitPng, exportKitSvg } from "@/lib/kit-export";
import { saveDesign } from "@/lib/kit-storage";
import { useAuth, getInitials } from "@/lib/auth-context";
import { CreditBadge } from "@/components/CreditBadge";

export const Route = createFileRoute("/")({ component: Index });

type Tab = { id: TabId; label: string; icon: React.ReactNode };

const TAB_META: Record<TabId, { label: string; icon: React.ReactNode }> = {
  camisa:        { label: "Camisa",         icon: <Shirt className="h-5 w-5" /> },
  mangas:        { label: "Mangas",         icon: <Shirt className="h-5 w-5" /> },
  gola:          { label: "Gola",           icon: <Minus className="h-5 w-5" /> },
  short:         { label: "Short",          icon: <Shirt className="h-5 w-5" /> },
  estampaCamisa: { label: "Estampa Camisa", icon: <Sparkles className="h-5 w-5" /> },
  estampaMangas: { label: "Estampa Mangas", icon: <Sparkles className="h-5 w-5" /> },
  estampaShort:  { label: "Estampa Short",  icon: <Sparkles className="h-5 w-5" /> },
  costuras:      { label: "Costuras",       icon: <Minus className="h-5 w-5" /> },
  numeroCamisa:  { label: "Número Camisa",  icon: <Hash className="h-5 w-5" /> },
  numeroShort:   { label: "Número Short",   icon: <Hash className="h-5 w-5" /> },
  nome:          { label: "Nome",           icon: <TypeIcon className="h-5 w-5" /> },
  escudo:        { label: "Escudo",         icon: <Shield className="h-5 w-5" /> },
};

const COLOR_GROUP_SET = new Set<TabId>(Object.keys(COLOR_GROUP_IDS) as TabId[]);
const TEXT_GROUP_SET = new Set<TabId>(Object.keys(TEXT_GROUP_IDS) as TabId[]);

function Index() {
  const { state, set, undo, redo, canUndo, canRedo } = useHistory<KitState>(INITIAL_STATE);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [saveName, setSaveName] = useState("Modelo BR041");
  const [selectedModel, setSelectedModel] = useState<ModelRow | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const frontUrl = selectedModel?.svg_frente_url ?? null;
  const backUrl = selectedModel?.svg_costas_url ?? null;

  const { data: frontRaw } = useQuery({
    queryKey: ["svg", frontUrl],
    enabled: !!frontUrl,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const r = await fetch(frontUrl!);
      if (!r.ok) throw new Error("Falha ao carregar SVG");
      return r.text();
    },
  });
  const { data: backRaw } = useQuery({
    queryKey: ["svg", backUrl],
    enabled: !!backUrl,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const r = await fetch(backUrl!);
      if (!r.ok) throw new Error("Falha ao carregar SVG");
      return r.text();
    },
  });

  const visibleTabs: Tab[] = useMemo(() => {
    const ids = state.view === "front" ? FRONT_TABS : BACK_TABS;
    return ids.map((id) => ({ id, ...TAB_META[id] }));
  }, [state.view]);

  const handleTab = (id: TabId) => set((s) => ({ ...s, activeTab: id }), false);

  const handleFlip = () =>
    set((s) => {
      const next = s.view === "front" ? "back" : "front";
      const allowed = next === "front" ? FRONT_TABS : BACK_TABS;
      const activeTab = allowed.includes(s.activeTab) ? s.activeTab : allowed[0];
      return { ...s, view: next, activeTab };
    }, false);

  const toast = (msg: string) => { setSavedToast(msg); setTimeout(() => setSavedToast(null), 1800); };

  const requireAuth = () => {
    if (!user) {
      navigate({ to: "/login", search: { redirect: "/" } });
      return false;
    }
    return true;
  };

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
    if (COLOR_GROUP_SET.has(id)) {
      const g = id as ColorGroup;
      return (
        <ColorPanel
          value={state.colors[g]}
          onChange={(c) => set((s) => ({ ...s, colors: { ...s.colors, [g]: c } }))}
          label={COLOR_LABELS[g]}
        />
      );
    }
    if (TEXT_GROUP_SET.has(id)) {
      const g = id as TextGroup;
      return (
        <TextPanel
          label={TEXT_LABELS[g]}
          layer={state.texts[g]}
          numeric={g !== "nome"}
          onChange={(l) => set((s) => ({ ...s, texts: { ...s.texts, [g]: l } }))}
        />
      );
    }
    // escudo
    return (
      <BadgePanel
        label="Escudo (peito + calção)"
        layer={state.escudo}
        onChange={(l) => set((s) => ({ ...s, escudo: l }))}
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
            <button aria-label="Salvar" onClick={() => { if (requireAuth()) setSaveOpen(true); }}
              className="grid h-9 w-9 place-items-center rounded-full text-neutral-700 transition hover:bg-neutral-100">
              <Save className="h-4 w-4" />
            </button>
            <button aria-label="Baixar" onClick={() => setDownloadOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full text-neutral-700 transition hover:bg-neutral-100">
              <Download className="h-4 w-4" />
            </button>
            <CreditBadge />
            {user ? (
              <div className="relative">
                <button aria-label="Conta" onClick={() => setUserMenuOpen((v) => !v)}
                  className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-[#2196F3] text-[11px] font-semibold text-white">
                  {getInitials(user)}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-11 z-40 w-44 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg">
                    <div className="px-3 py-2 text-[11px] text-neutral-500 truncate">{user.email}</div>
                    <button onClick={async () => { setUserMenuOpen(false); await signOut(); }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-100">
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" search={{ redirect: "/" }}
                className="ml-1 rounded-full bg-[#2196F3] px-3 py-1.5 text-xs font-semibold text-white">
                Entrar
              </Link>
            )}
          </div>
        </header>

        <KitCanvas
          state={state} onFlip={handleFlip}
          zoom={zoom} setZoom={setZoom} pan={pan} setPan={setPan}
          exportRef={exportRef} svgRef={svgRef}
          frontRaw={frontRaw}
          backRaw={backRaw}
        />

        <ModelSelector
          selectedCode={selectedModel?.code ?? null}
          onSelect={(m) => setSelectedModel(m)}
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
