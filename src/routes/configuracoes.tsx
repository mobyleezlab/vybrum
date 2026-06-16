import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, FileText, ShieldCheck, Info } from "lucide-react";
import { useState } from "react";
import { useRequireAuth } from "@/lib/use-require-auth";

export const Route = createFileRoute("/configuracoes")({
  ssr: false,
  head: () => ({ meta: [{ title: "Configurações · Vybrum" }] }),
  component: ConfiguracoesPage,
});

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="press flex w-full items-center justify-between gap-3 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-3"
    >
      <div className="min-w-0 text-left">
        <div className="text-sm font-semibold text-white">{label}</div>
        {desc && <div className="text-[11px] text-[#888]">{desc}</div>}
      </div>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-[#68ed00]" : "bg-[#2a2a2a]"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

function ConfiguracoesPage() {
  const { ready } = useRequireAuth();

  // Preferências locais (preparadas para persistência futura)
  const [notif, setNotif] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+24px)]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-black/90 px-2 pt-1 backdrop-blur supports-[backdrop-filter]:bg-black/70">
        <Link to="/perfil" aria-label="Voltar" className="press grid h-10 w-10 place-items-center rounded-full text-white hover:bg-[#1a1a1a]">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-[12px] font-bold tracking-[0.22em] text-[#888]">CONFIGURAÇÕES</h1>
        <span className="w-10" />
      </header>

      {!ready ? (
        <div className="mx-4 mt-4 h-40 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" />
      ) : (
        <>
          <section className="mx-4 mt-4">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#888]">Preferências</h2>
            <div className="space-y-2">
              <Toggle checked={notif} onChange={setNotif} label="Notificações" desc="Avisos sobre desbloqueios e drops" />
              <Toggle checked={reduceMotion} onChange={setReduceMotion} label="Reduzir animações" desc="Menos efeitos visuais" />
            </div>
          </section>

          <section className="mx-4 mt-5">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#888]">Sobre</h2>
            <div className="space-y-2">
              <div className="flex h-14 items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4">
                <Info className="h-5 w-5 text-[#68ed00]" />
                <div className="flex-1 text-sm font-semibold text-white">Versão</div>
                <div className="text-[12px] text-[#888]">1.0.0</div>
              </div>
              <a
                href="#"
                className="press flex h-14 items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4"
              >
                <FileText className="h-5 w-5 text-[#68ed00]" />
                <div className="flex-1 text-sm font-semibold text-white">Termos de uso</div>
                <span className="text-[#444]">›</span>
              </a>
              <a
                href="#"
                className="press flex h-14 items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4"
              >
                <ShieldCheck className="h-5 w-5 text-[#68ed00]" />
                <div className="flex-1 text-sm font-semibold text-white">Privacidade</div>
                <span className="text-[#444]">›</span>
              </a>
            </div>
          </section>
        </>
      )}
    </div>
  );
}