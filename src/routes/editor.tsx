import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, Save, Download, Undo2, Redo2,
  Shirt, Type as TypeIcon, Shield, Minus, Lock, Handshake, Palette,
  ChevronUp, ChevronDown, Tag,
} from "lucide-react";
import { KitCanvas } from "@/components/kit/KitCanvas";
import { KitTabs } from "@/components/kit/KitTabs";
import { useQuery } from "@tanstack/react-query";
import { useModels, canUseModel, type ModelRow } from "@/lib/models";
import { ColorPanel } from "@/components/kit/panels/ColorPanel";
import { TextsPanel } from "@/components/kit/panels/TextsPanel";
import { FontsPanel } from "@/components/kit/panels/FontsPanel";
import { AdjustsPanel } from "@/components/kit/panels/AdjustsPanel";
import { BadgePanel } from "@/components/kit/panels/BadgePanel";
import { SponsorPanel } from "@/components/kit/panels/SponsorPanel";
import {
  INITIAL_STATE, COLOR_LABELS,
  FRONT_TABS, BACK_TABS,
  type KitState, type TabId,
} from "@/lib/kit-state";
import { useHistory } from "@/lib/kit-history";
import { exportKitPng, exportKitSvg } from "@/lib/kit-export";
import { saveDesign } from "@/lib/kit-storage";
import { CreditBadge } from "@/components/CreditBadge";
import { UnlockSheet } from "@/components/UnlockSheet";

export const Route = createFileRoute("/editor")({
  validateSearch: (s: Record<string, unknown>) => ({
    model: typeof s.model === "string" ? s.model : undefined,
  }),
  component: Index,
});

type Tab = { id: TabId; label: string; icon: React.ReactNode };

const TAB_META: Record<TabId, { label: string; icon: React.ReactNode }> = {
  camisa:        { label: "Camisa",       icon: <Shirt className="h-5 w-5" /> },
  mangas:        { label: "Mangas",       icon: <Shirt className="h-5 w-5" /> },
  gola:          { label: "Gola",         icon: <Minus className="h-5 w-5" /> },
  short:         { label: "Short",        icon: <Shirt className="h-5 w-5" /> },
  estampaCamisa: { label: "Estampa Camisa", icon: <Shirt className="h-5 w-5" /> },
  estampaMangas: { label: "Estampa Mangas", icon: <Shirt className="h-5 w-5" /> },
  estampaShort:  { label: "Estampa Short",  icon: <Shirt className="h-5 w-5" /> },
  textos:        { label: "Nome/Nº",      icon: <Tag className="h-5 w-5" /> },
  fontes:        { label: "Fontes",       icon: <TypeIcon className="h-5 w-5" /> },
  ajustes:       { label: "Cor Texto",    icon: <Palette className="h-5 w-5" /> },
  escudo:        { label: "Escudo",       icon: <Shield className="h-5 w-5" /> },
  patrocinador:  { label: "Patrocin.",    icon: <Handshake className="h-5 w-5" /> },
};

// Tabs com painel "simples" (sem rolagem necessária)
const SHORT_PANEL_TABS = new Set<TabId>(["gola"]);

function Index() {
  const { state, set, undo, redo, canUndo, canRedo } = useHistory<KitState>(INITIAL_STATE);
  const { model: modelCode } = Route.useSearch();
  const { data: models } = useModels();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [saveName, setSaveName] = useState("Modelo VY001");
  const [selectedModel, setSelectedModel] = useState<ModelRow | null>(null);
  const [sponsorUnlockOpen, setSponsorUnlockOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!models || !modelCode) return;
    const m = models.find((x) => x.code === modelCode);
    if (m && m.code !== selectedModel?.code) setSelectedModel(m);
  }, [models, modelCode, selectedModel?.code]);

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

  const handleTab = (id: TabId) =>
    set((s) => ({ ...s, activeTab: id }), false);

  const handleFlip = () =>
    set((s) => {
      const next = s.view === "front" ? "back" : "front";
      const allowed = next === "front" ? FRONT_TABS : BACK_TABS;
      const activeTab = allowed.includes(s.activeTab) ? s.activeTab : allowed[0];
      return { ...s, view: next, activeTab };
    }, false);

  const toast = (msg: string) => { setSavedToast(msg); setTimeout(() => setSavedToast(null), 1800); };

  const requireAuth = () => true;

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
    const setColor = (g: keyof KitState["colors"]) => (c: string) =>
      set((s) => ({
        ...s,
        colors: { ...s.colors, [g]: c },
        colorsTouched: { ...s.colorsTouched, [g]: true },
      }));
    if (id === "camisa") {
      return (
        <div className="space-y-4">
          <ColorPanel value={state.colors.camisa} onChange={setColor("camisa")} label={COLOR_LABELS.camisa} />
          <ColorPanel value={state.colors.estampaCamisa} onChange={setColor("estampaCamisa")} label={COLOR_LABELS.estampaCamisa} />
        </div>
      );
    }
    if (id === "mangas") {
      return (
        <div className="space-y-4">
          <ColorPanel value={state.colors.mangas} onChange={setColor("mangas")} label={COLOR_LABELS.mangas} />
          <ColorPanel value={state.colors.estampaMangas} onChange={setColor("estampaMangas")} label={COLOR_LABELS.estampaMangas} />
        </div>
      );
    }
    if (id === "short") {
      return (
        <div className="space-y-4">
          <ColorPanel value={state.colors.short} onChange={setColor("short")} label={COLOR_LABELS.short} />
          <ColorPanel value={state.colors.estampaShort} onChange={setColor("estampaShort")} label={COLOR_LABELS.estampaShort} />
        </div>
      );
    }
    if (id === "gola") {
      return <ColorPanel value={state.colors.gola} onChange={setColor("gola")} label={COLOR_LABELS.gola} />;
    }
    if (id === "textos") {
      return (
        <TextsPanel
          nome={state.texts.nome}
          numero={state.texts.numero}
          onChange={(t) => set((s) => ({ ...s, texts: { nome: t.nome, numero: t.numero } }))}
        />
      );
    }
    if (id === "fontes") {
      return (
        <FontsPanel
          nome={state.texts.nome}
          numero={state.texts.numero}
          onChange={(t) => set((s) => ({ ...s, texts: { nome: t.nome, numero: t.numero } }))}
        />
      );
    }
    if (id === "ajustes") {
      return (
        <AdjustsPanel
          nome={state.texts.nome}
          numero={state.texts.numero}
          onChange={(t) => set((s) => ({ ...s, texts: { nome: t.nome, numero: t.numero } }))}
        />
      );
    }
    if (id === "patrocinador") {
      if (isLocked) {
        // Acessível mas bloqueada: abrir unlock sheet ao tentar usar
        return (
          <button
            onClick={() => setSponsorUnlockOpen(true)}
            className="press flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0f0f0f] px-4 py-10 text-sm font-semibold text-[#bbb] hover:text-white"
          >
            <Lock className="h-4 w-4" /> Desbloquear patrocinador
          </button>
        );
      }
      return (
        <SponsorPanel
          value={state.sponsor}
          onChange={(v) => set((s) => ({ ...s, sponsor: v }))}
        />
      );
    }
    // escudo
    return (
      <BadgePanel
        label="Escudo (peito + calção)"
        layer={state.escudo}
        onChange={(l) => set((s) => ({ ...s, escudo: { ...l, touched: true } }))}
      />
    );
  };

  const isLocked = selectedModel ? !canUseModel(selectedModel) : false;
  const unlockCost = selectedModel?.unlock_cost ?? 0;

  return (
    <div className="h-[100dvh] overflow-hidden bg-black pt-safe">
      <div className="mx-auto flex h-full max-w-[460px] flex-col bg-black px-4 pt-3">
        <header className="-mx-4 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-[#1a1a1a] bg-black/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-black/70">
          <Link to="/" aria-label="Voltar ao catálogo" className="press grid h-10 w-10 place-items-center rounded-full border border-[#2a2a2a] bg-[#1a1a1a] text-white">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-center text-[11px] font-bold tracking-[0.18em] text-[#888]">
            {selectedModel ? `MODELO ${selectedModel.code}` : "EDITOR"}
          </h1>
          <div className="flex items-center gap-1">
            <button aria-label="Desfazer" onClick={undo} disabled={!canUndo}
              className="press grid h-9 w-9 place-items-center rounded-full text-white transition hover:bg-[#1a1a1a] disabled:opacity-30">
              <Undo2 className="h-4 w-4" />
            </button>
            <button aria-label="Refazer" onClick={redo} disabled={!canRedo}
              className="press grid h-9 w-9 place-items-center rounded-full text-white transition hover:bg-[#1a1a1a] disabled:opacity-30">
              <Redo2 className="h-4 w-4" />
            </button>
            <button aria-label="Salvar" onClick={() => { if (requireAuth()) setSaveOpen(true); }} disabled={isLocked}
              className="press grid h-9 w-9 place-items-center rounded-full text-white transition hover:bg-[#1a1a1a] disabled:opacity-30">
              <Save className="h-4 w-4" />
            </button>
            <button aria-label="Baixar" onClick={() => setDownloadOpen(true)} disabled={isLocked}
              className="press grid h-9 w-9 place-items-center rounded-full text-white transition hover:bg-[#1a1a1a] disabled:opacity-30">
              <Download className="h-4 w-4" />
            </button>
            <CreditBadge />
          </div>
        </header>

        <KitCanvas
          state={state} onFlip={handleFlip}
          zoom={zoom} setZoom={setZoom} pan={pan} setPan={setPan}
          exportRef={exportRef} svgRef={svgRef}
          frontRaw={frontRaw}
          backRaw={backRaw}
        />

        <div
          aria-disabled={isLocked && state.activeTab !== "patrocinador"}
          className={
            "flex min-h-0 flex-1 flex-col " +
            (isLocked && state.activeTab !== "patrocinador" ? "pointer-events-none opacity-[0.35]" : "")
          }
        >
          <KitTabs tabs={visibleTabs} activeId={state.activeTab} onChange={(id) => handleTab(id as TabId)} />

          <ScrollPanel key={state.activeTab} fixed={SHORT_PANEL_TABS.has(state.activeTab)}>
            {renderPanel()}
          </ScrollPanel>
        </div>
      </div>

      {isLocked && selectedModel && (
        <div
          className="fixed inset-x-0 z-40 border-t border-[#2a2a2a] bg-[#0f0f0f] px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3"
          style={{ bottom: 0 }}
        >
          <div className="mx-auto flex max-w-[460px] items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1a1a1a] text-[#68ed00]">
                <Lock className="h-4 w-4" />
              </span>
              <span className="truncate text-[13px] font-semibold text-white">
                Desbloqueie para personalizar
              </span>
            </div>
            <Link
              to="/creditos"
              className="press shrink-0 rounded-full px-3 py-2 text-[12px] font-semibold text-[#888] hover:text-white"
            >
              Ver planos
            </Link>
            <Link
              to="/creditos"
              className="press shrink-0 rounded-full bg-[#68ed00] px-4 py-2 text-[12px] font-bold text-black"
            >
              Desbloquear · {unlockCost} cr
            </Link>
          </div>
        </div>
      )}

      {saveOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 shadow-xl">
            <h2 className="text-base font-semibold text-white">Salvar modelo</h2>
            <p className="mt-1 text-sm text-[#888]">Dê um nome ao seu design.</p>
            <input autoFocus value={saveName} onChange={(e) => setSaveName(e.target.value)}
              className="mt-4 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none focus:border-[#68ed00]" />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setSaveOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-[#888] hover:bg-[#1a1a1a]">Cancelar</button>
              <button onClick={handleSave} className="rounded-lg bg-[#68ed00] px-4 py-2 text-sm font-bold text-black hover:opacity-90">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {downloadOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6" onClick={() => setDownloadOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-white">Baixar uniforme</h2>
            <p className="mt-1 text-sm text-[#888]">Escolha o formato.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={downloadPng} className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 text-left transition hover:border-[#68ed00]">
                <div className="text-sm font-semibold text-white">PNG</div>
                <div className="mt-1 text-xs text-[#888]">Alta resolução</div>
              </button>
              <button onClick={downloadSvg} className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 text-left transition hover:border-[#68ed00]">
                <div className="text-sm font-semibold text-white">SVG</div>
                <div className="mt-1 text-xs text-[#888]">Vetor editável</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {savedToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#68ed00] px-4 py-2 text-sm font-bold text-black shadow-lg">
          {savedToast}
        </div>
      )}

      <UnlockSheet open={sponsorUnlockOpen} onClose={() => setSponsorUnlockOpen(false)} feature="sponsors" />
    </div>
  );
}

/** Painel rolável com indicadores verdes nas extremidades. */
function ScrollPanel({ children, fixed }: { children: React.ReactNode; fixed?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const top = el.scrollTop > 4;
      const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 4;
      setEdges({ top, bottom });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, []);

  const scrollBy = (n: number) => ref.current?.scrollBy({ top: n, behavior: "smooth" });

  return (
    <div className="relative mt-4 min-h-0 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div
        ref={ref}
        className={
          "vy-scroll h-full pb-[calc(72px+env(safe-area-inset-bottom))] pr-2 " +
          (fixed ? "overflow-hidden" : "overflow-y-auto")
        }
      >
        {children}
      </div>
      {!fixed && edges.top && (
        <button
          aria-label="Rolar para cima"
          onClick={() => scrollBy(-160)}
          className="press absolute right-0 top-1 grid h-6 w-6 place-items-center rounded-full bg-[#68ed00] text-black shadow-md ring-1 ring-black/20"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      )}
      {!fixed && edges.bottom && (
        <button
          aria-label="Rolar para baixo"
          onClick={() => scrollBy(160)}
          className="press absolute right-0 grid h-6 w-6 place-items-center rounded-full bg-[#68ed00] text-black shadow-md ring-1 ring-black/20"
          style={{ bottom: "calc(72px + env(safe-area-inset-bottom) + 4px)" }}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
