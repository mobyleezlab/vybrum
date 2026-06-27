import { createFileRoute, Link, useNavigate, useBlocker } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, Save, Download, Undo2, Redo2,
  Shirt, Shield, Lock, Tag,
  ArrowLeftRight, ChevronsDown, Square,
  Type, SlidersHorizontal, Brush, Paintbrush, PaintBucket,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { KitCanvas } from "@/components/kit/KitCanvas";
import { KitSvg } from "@/components/kit/KitSvg";
import { KitTabs } from "@/components/kit/KitTabs";
import { useQuery } from "@tanstack/react-query";
import { useModels, canUseModel, type ModelRow } from "@/lib/models";
import { ColorPanel } from "@/components/kit/panels/ColorPanel";
import { TextsPanel } from "@/components/kit/panels/TextsPanel";
import { AdjustsPanel } from "@/components/kit/panels/AdjustsPanel";
import { BadgePanel } from "@/components/kit/panels/BadgePanel";
import { SponsorPanel } from "@/components/kit/panels/SponsorPanel";
import {
  INITIAL_STATE, COLOR_LABELS,
  FRONT_TABS, BACK_TABS,
  type KitState, type TabId,
} from "@/lib/kit-state";
import { useHistory } from "@/lib/kit-history";
import { exportComposite, exportCompositePdf, exportCompositeSvg } from "@/lib/kit-export";
import { useSaveKit, useKit, kitStateFromRow } from "@/lib/kits";
import { useAuth } from "@/lib/auth-context";
import { toast as sonner } from "sonner";
import { CreditBadge } from "@/components/CreditBadge";
import { UnlockSheet } from "@/components/UnlockSheet";
import { useDialogA11y } from "@/hooks/use-dialog-a11y";
import { useUnlockModel } from "@/lib/unlock";
import { useCurrentUserShield } from "@/lib/shields";
import { useExportUnlocked } from "@/lib/export-unlock";
import { ExportUnlockModal } from "@/components/ExportUnlockModal";

type ExportKind = "png-low" | "png-hd" | "pdf" | "svg";

export const Route = createFileRoute("/editor")({
  validateSearch: (s: Record<string, unknown>) => ({
    model: typeof s.model === "string" ? s.model : undefined,
    kit: typeof s.kit === "string" ? s.kit : undefined,
  }),
  head: () => ({
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Anton&family=Teko:wght@400;600;700&family=Oswald:wght@400;600;700&family=Russo+One&family=Rajdhani:wght@500;600;700&family=Orbitron:wght@500;700&family=Michroma&family=Black+Ops+One&family=Bowlby+One&family=Audiowide&family=Barlow+Condensed:wght@500;700&family=Saira+Condensed:wght@500;700&family=Staatliches&family=Monoton&display=swap",
      },
    ],
  }),
  component: Index,
});

type Tab = { id: TabId; label: string; icon: React.ReactNode };

const TAB_META: Record<TabId, { label: string; icon: React.ReactNode }> = {
  camisa:        { label: "Camisa",         icon: <Shirt className="h-5 w-5" /> },
  mangas:        { label: "Mangas",         icon: <ArrowLeftRight className="h-5 w-5" /> },
  gola:          { label: "Gola",           icon: <ChevronsDown className="h-5 w-5" /> },
  short:         { label: "Short",          icon: <Square className="h-5 w-5" /> },
  estampaCamisa: { label: "Estampa Camisa", icon: <Brush className="h-5 w-5" /> },
  estampaMangas: { label: "Estampa Mangas", icon: <Paintbrush className="h-5 w-5" /> },
  estampaShort:  { label: "Estampa Short",  icon: <PaintBucket className="h-5 w-5" /> },
  textos:        { label: "Nome/Nº",        icon: <Type className="h-5 w-5" /> },
  fontes:        { label: "Fontes",         icon: <Type className="h-5 w-5" /> },
  ajustes:       { label: "Ajustes",        icon: <SlidersHorizontal className="h-5 w-5" /> },
  escudo:        { label: "Escudo",         icon: <Shield className="h-5 w-5" /> },
  patrocinador:  { label: "Patrocin.",      icon: <Tag className="h-5 w-5" /> },
};

// Tabs com painel "simples" (sem rolagem necessária)
const SHORT_PANEL_TABS = new Set<TabId>(["gola"]);

function Index() {
  const { state, set, undo, redo, canUndo, canRedo } = useHistory<KitState>(INITIAL_STATE);
  const { model: modelCode, kit: kitId } = Route.useSearch();
  const { data: models } = useModels();
  const { user } = useAuth();
  const navigate = useNavigate();
  const saveKit = useSaveKit();
  const { data: loadedKit } = useKit(kitId);
  const { data: currentShield } = useCurrentUserShield();
  const [currentKitId, setCurrentKitId] = useState<string | undefined>(kitId);
  const hydratedKitRef = useRef<string | null>(null);
  const skipDirtyRef = useRef(true);
  const [isDirty, setIsDirty] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [saveName, setSaveName] = useState("Modelo VY001");
  const [selectedModel, setSelectedModel] = useState<ModelRow | null>(null);
  const [sponsorUnlockOpen, setSponsorUnlockOpen] = useState(false);
  const [exportUnlockOpen, setExportUnlockOpen] = useState(false);
  const [pendingExport, setPendingExport] = useState<ExportKind | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const composeRef = useRef<HTMLDivElement>(null);
  const composeFrontRef = useRef<SVGSVGElement>(null);
  const composeBackRef = useRef<SVGSVGElement>(null);
  const [exporting, setExporting] = useState(false);
  useDialogA11y(saveOpen, () => setSaveOpen(false));
  useDialogA11y(downloadOpen, () => setDownloadOpen(false));
  const [unsavedOpen, setUnsavedOpen] = useState(false);

  // Bloqueia navegação interna do router quando há alterações não salvas.
  const blocker = useBlocker({
    shouldBlockFn: () => isDirty && !saveKit.isPending,
    withResolver: true,
    enableBeforeUnload: () => isDirty,
  });

  useEffect(() => {
    if (blocker.status === "blocked") {
      setUnsavedOpen(true);
    }
  }, [blocker.status, blocker.proceed]);

  useEffect(() => {
    if (!models || !modelCode) return;
    const m = models.find((x) => x.code === modelCode);
    if (m && m.code !== selectedModel?.code) setSelectedModel(m);
  }, [models, modelCode, selectedModel?.code]);

  // Hidrata o editor a partir do kit salvo (uma única vez por kit)
  useEffect(() => {
    if (!loadedKit || hydratedKitRef.current === loadedKit.id) return;
    const next = kitStateFromRow(loadedKit);
    if (!next) return;
    hydratedKitRef.current = loadedKit.id;
    setCurrentKitId(loadedKit.id);
    setSaveName(loadedKit.name);
    skipDirtyRef.current = true;
    set(() => next, true);
    if (models && loadedKit.model_code) {
      const m = models.find((x) => x.code === loadedKit.model_code);
      if (m) setSelectedModel(m);
    }
  }, [loadedKit, models, set]);

  // Marca dirty em qualquer mudança de state, exceto logo após hidratação/salvamento.
  useEffect(() => {
    if (skipDirtyRef.current) {
      skipDirtyRef.current = false;
      setIsDirty(false);
      return;
    }
    setIsDirty(true);
  }, [state]);

  // Pre-load the user's global custom shield into any model they open.
  // Only applies when the kit hasn't explicitly touched the badge layer —
  // a saved kit with a customized shield keeps its own value.
  useEffect(() => {
    if (!currentShield?.image_url) return;
    if (state.escudo.touched) return;
    if (state.escudo.src === currentShield.image_url) return;
    set(
      (s) => ({ ...s, escudo: { ...s.escudo, src: currentShield.image_url, touched: true } }),
      true,
    );
  }, [currentShield?.image_url, state.escudo.touched, state.escudo.src, set]);

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

  const requireAuth = () => {
    if (!user) {
      navigate({ to: "/login", search: { redirect: `/editor${modelCode ? `?model=${modelCode}` : ""}` } });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!user || !selectedModel) return;
    try {
      const saved = await saveKit.mutateAsync({
        id: currentKitId,
        name: saveName.trim() || "Sem nome",
        model_code: selectedModel.code,
        state,
        is_premium_model: (selectedModel.category ?? "free") !== "free",
      });
      setCurrentKitId(saved.id);
      setSaveOpen(false);
      setIsDirty(false);
      sonner.success("Kit salvo!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "kit_limit_reached" || msg.includes("kit_limit_exceeded")) {
        sonner.error("Limite de kits atingido. Exclua um kit para continuar.");
      } else if (msg === "not_authenticated") {
        sonner.error("Faça login para salvar.");
        navigate({ to: "/login", search: { redirect: "/editor" } });
      } else {
        sonner.error("Não foi possível salvar o kit. Tente novamente.");
      }
    }
  };

  const baseName = selectedModel ? `kit-${selectedModel.code}` : "kit";
  const { data: exportStatus } = useExportUnlocked(selectedModel?.code, selectedModel?.category);
  const exportUnlocked = exportStatus?.exportUnlocked ?? false;

  const runExport = async (kind: ExportKind) => {
    if (!composeRef.current) return;
    setExporting(true);
    // aguarda o KitSvg compor (dois rAF para garantir layout)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      if (kind === "png-low") {
        await exportComposite(composeRef.current, "png", 720, `${baseName}-720p.png`);
      } else if (kind === "png-hd") {
        await exportComposite(composeRef.current, "png", 2160, `${baseName}-4k.png`);
      } else if (kind === "pdf") {
        if (composeFrontRef.current && composeBackRef.current) {
          await exportCompositePdf(composeFrontRef.current, composeBackRef.current, `${baseName}.pdf`);
        }
      } else if (kind === "svg") {
        if (composeFrontRef.current && composeBackRef.current) {
          await exportCompositeSvg(composeFrontRef.current, composeBackRef.current, `${baseName}.svg`);
        }
      }
    } finally {
      setExporting(false);
      setDownloadOpen(false);
    }
  };

  const handleExportClick = (kind: ExportKind) => {
    if (kind !== "png-low" && !exportUnlocked) {
      setPendingExport(kind);
      setExportUnlockOpen(true);
      return;
    }
    void runExport(kind);
  };

  const handleExportUnlocked = () => {
    const k = pendingExport;
    setPendingExport(null);
    if (k) void runExport(k);
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
  const unlockModel = useUnlockModel();

  return (
    <div className="h-[100dvh] overflow-hidden bg-black pt-safe">
      <div className="mx-auto flex h-full max-w-[460px] flex-col bg-black px-4 pt-3">
        <header className="-mx-4 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-[#1a1a1a] bg-black/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-black/70">
          <BackButton
            fallback="/"
            ariaLabel="Voltar ao catálogo"
            className="press grid h-10 w-10 place-items-center rounded-full border border-[#2a2a2a] bg-[#1a1a1a] text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </BackButton>
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
            <button
              aria-label="Salvar"
              onClick={() => {
                if (!requireAuth()) return;
                if (currentKitId) {
                  handleSave();
                } else {
                  setSaveOpen(true);
                }
              }}
              disabled={isLocked || saveKit.isPending || !isDirty}
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
            <button
              type="button"
              disabled={unlockModel.isPending || !selectedModel}
              onClick={() => { if (selectedModel) unlockModel.mutate(selectedModel.code); }}
              className="press shrink-0 rounded-full bg-[#68ed00] px-4 py-2 text-[12px] font-bold text-black disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {unlockModel.isPending ? "Processando…" : `Desbloquear · ${unlockCost} cr`}
            </button>
          </div>
        </div>
      )}

      {saveOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-dialog-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6"
          onClick={() => setSaveOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="save-dialog-title" className="text-base font-semibold text-white">Salvar modelo</h2>
            <p className="mt-1 text-sm text-[#888]">Dê um nome ao seu design.</p>
            <label htmlFor="save-name" className="sr-only">Nome do modelo</label>
            <input id="save-name" autoFocus value={saveName} onChange={(e) => setSaveName(e.target.value)}
              className="mt-4 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none focus:border-[#68ed00]" />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setSaveOpen(false)} disabled={saveKit.isPending} className="rounded-lg px-4 py-2 text-sm font-medium text-[#888] hover:bg-[#1a1a1a] disabled:opacity-50">Cancelar</button>
              <button onClick={handleSave} disabled={saveKit.isPending} className="rounded-lg bg-[#68ed00] px-4 py-2 text-sm font-bold text-black hover:opacity-90 disabled:opacity-60">
                {saveKit.isPending ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {downloadOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-dialog-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6"
          onClick={() => setDownloadOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="download-dialog-title" className="text-base font-semibold text-white">Baixar uniforme</h2>
            <p className="mt-1 text-sm text-[#888]">Frente e verso lado a lado · 16:9</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ExportTile
                disabled={exporting}
                onClick={() => handleExportClick("png-low")}
                title="PNG"
                subtitle="1280×720"
                locked={false}
              />
              <ExportTile
                disabled={exporting}
                onClick={() => handleExportClick("png-hd")}
                title="PNG HD"
                subtitle="4K · 3840×2160"
                locked={!exportUnlocked}
              />
              <ExportTile
                disabled={exporting}
                onClick={() => handleExportClick("svg")}
                title="SVG"
                subtitle="Vetor editável"
                locked={!exportUnlocked}
              />
              <ExportTile
                disabled={exporting}
                onClick={() => handleExportClick("pdf")}
                title="PDF"
                subtitle="A4 paisagem · 300dpi"
                locked={!exportUnlocked}
              />
            </div>
            {!exportUnlocked && (
              <p className="mt-3 text-center text-[11px] text-[#888]">
                Desbloqueie HD, SVG e PDF por 5 créditos · válido para sempre neste modelo.
              </p>
            )}
            {exporting && <p role="status" aria-live="polite" className="mt-3 text-center text-xs text-[#68ed00]">Gerando arquivo…</p>}
          </div>
        </div>
      )}

      {savedToast && (
        <div role="status" aria-live="polite" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#68ed00] px-4 py-2 text-sm font-bold text-black shadow-lg">
          {savedToast}
        </div>
      )}

      <UnlockSheet open={sponsorUnlockOpen} onClose={() => setSponsorUnlockOpen(false)} feature="sponsors" />
      <ExportUnlockModal
        open={exportUnlockOpen}
        onClose={() => { setExportUnlockOpen(false); setPendingExport(null); }}
        modelCode={selectedModel?.code}
        onUnlocked={handleExportUnlocked}
      />

      {unsavedOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-dialog-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6"
          onClick={() => { setUnsavedOpen(false); blocker.reset?.(); }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="unsaved-dialog-title" className="text-base font-semibold text-white">Alterações não salvas</h2>
            <p className="mt-1 text-sm text-[#888]">Você fez alterações neste kit. Deseja salvar antes de sair?</p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={async () => {
                  if (currentKitId) {
                    await handleSave();
                    setUnsavedOpen(false);
                    blocker.proceed?.();
                  } else {
                    // Kit novo: precisa de nome. Cancela bloqueio e abre modal de nome.
                    setUnsavedOpen(false);
                    blocker.reset?.();
                    setSaveOpen(true);
                  }
                }}
                disabled={saveKit.isPending}
                className="press rounded-lg bg-[#68ed00] px-4 py-3 text-sm font-bold text-black disabled:opacity-60"
              >
                {saveKit.isPending ? "Salvando…" : "Salvar e sair"}
              </button>
              <button
                onClick={() => {
                  setUnsavedOpen(false);
                  setIsDirty(false);
                  blocker.proceed?.();
                }}
                className="press rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-sm font-semibold text-white"
              >
                Sair sem salvar
              </button>
              <button
                onClick={() => { setUnsavedOpen(false); blocker.reset?.(); }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#888] hover:bg-[#1a1a1a]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Composição oculta para exportar frente + verso lado a lado em 16:9 */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: -100000,
          top: 0,
          width: 1920,
          height: 1080,
          pointerEvents: "none",
        }}
      >
        <div
          ref={composeRef}
          style={{
            width: 1920,
            height: 1080,
            display: "flex",
            backgroundColor: "#ffffff",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              flex: "1 1 0",
              minWidth: 0,
              height: "100%",
              padding: 40,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "stretch",
              justifyContent: "stretch",
            }}
          >
            <KitSvg
              ref={composeFrontRef}
              state={{ ...state, view: "front" }}
              frontRaw={frontRaw}
              backRaw={backRaw}
              display="full"
            />
          </div>
          <div
            style={{
              flex: "1 1 0",
              minWidth: 0,
              height: "100%",
              padding: 40,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "stretch",
              justifyContent: "stretch",
            }}
          >
            <KitSvg
              ref={composeBackRef}
              state={{ ...state, view: "back" }}
              frontRaw={frontRaw}
              backRaw={backRaw}
              display="full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Painel rolável com scrollbar verde do design system. */
function ScrollPanel({ children, fixed }: { children: React.ReactNode; fixed?: boolean }) {
  return (
    <div className="relative mt-4 min-h-0 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div
        className={
          "vy-scroll h-full pb-[calc(72px+env(safe-area-inset-bottom))] pr-2 " +
          (fixed ? "overflow-hidden" : "overflow-y-auto")
        }
      >
        {children}
      </div>
    </div>
  );
}

function ExportTile({
  title,
  subtitle,
  locked,
  disabled,
  onClick,
}: {
  title: string;
  subtitle: string;
  locked: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="relative rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 text-left transition hover:border-[#68ed00] disabled:opacity-50"
    >
      <div className="flex items-center gap-1.5">
        <div className="text-sm font-semibold text-white">{title}</div>
        {locked && <Lock className="h-3 w-3 text-[#68ed00]" aria-label="Bloqueado" />}
      </div>
      <div className="mt-1 text-xs text-[#888]">{subtitle}</div>
    </button>
  );
}
