import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, ShieldCheck, Info, Download, Trash2 } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuth } from "@/lib/auth-context";

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
  const { user, signOut } = useAuth();

  // Preferências locais (preparadas para persistência futura)
  const [notif, setNotif] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { data, error } = await (supabase as any).rpc("export_user_data");
      if (error) throw new Error(error.message);
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vybrum-meus-dados.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Seus dados foram exportados com sucesso.");
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível exportar seus dados.");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleteErr(null);
    if (confirmEmail.trim().toLowerCase() !== (user?.email ?? "").toLowerCase()) {
      setDeleteErr("O e-mail digitado não confere.");
      return;
    }
    setDeleting(true);
    try {
      const { data, error } = await (supabase as any).rpc("delete_user_account");
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(String(data.error));
      const shieldUrl: string | undefined = data?.shield_url;
      if (shieldUrl) {
        const marker = "/user-shields/";
        const idx = shieldUrl.indexOf(marker);
        if (idx >= 0) {
          const path = shieldUrl.substring(idx + marker.length).split("?")[0];
          try { await supabase.storage.from("user-shields").remove([path]); } catch { /* noop */ }
        }
      }
      toast.success("Sua conta foi excluída.");
      await signOut();
    } catch (e: any) {
      setDeleteErr(e?.message ?? "Não foi possível excluir sua conta.");
      setDeleting(false);
    }
  };

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+24px)]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-black/90 px-2 pt-1 backdrop-blur supports-[backdrop-filter]:bg-black/70">
        <BackButton fallback="/perfil" />
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
              <Link
                to="/termos"
                className="press flex h-14 items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4"
              >
                <FileText className="h-5 w-5 text-[#68ed00]" />
                <div className="flex-1 text-sm font-semibold text-white">Termos de uso</div>
                <span className="text-[#444]">›</span>
              </Link>
              <Link
                to="/privacidade"
                className="press flex h-14 items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4"
              >
                <ShieldCheck className="h-5 w-5 text-[#68ed00]" />
                <div className="flex-1 text-sm font-semibold text-white">Privacidade</div>
                <span className="text-[#444]">›</span>
              </Link>
            </div>
          </section>

          <section className="mx-4 mt-5">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#888]">Meus dados (LGPD)</h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="press flex h-14 w-full items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4 disabled:opacity-60"
              >
                <Download className="h-5 w-5 text-[#68ed00]" />
                <div className="flex-1 text-left text-sm font-semibold text-white">
                  {exporting ? "Exportando..." : "Exportar meus dados"}
                </div>
                <span className="text-[#444]">›</span>
              </button>
              <button
                type="button"
                onClick={() => { setShowDelete(true); setConfirmEmail(""); setDeleteErr(null); }}
                className="press flex h-14 w-full items-center gap-3 rounded-2xl border border-red-500/30 bg-[#1a0a0a] px-4"
              >
                <Trash2 className="h-5 w-5 text-red-400" />
                <div className="flex-1 text-left text-sm font-semibold text-red-400">Excluir conta</div>
                <span className="text-[#5a2a2a]">›</span>
              </button>
            </div>
          </section>
        </>
      )}

      {showDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-5"
          onClick={() => !deleting && setShowDelete(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5"
          >
            <h3 className="text-lg font-extrabold text-white">Excluir conta</h3>
            <p className="mt-2 text-sm text-[#bbb]">
              Esta ação é irreversível. Todos os seus dados, kits, créditos e histórico serão permanentemente deletados.
            </p>
            <p className="mt-4 text-xs text-[#888]">
              Para confirmar, digite seu e-mail: <span className="font-semibold text-white">{user?.email}</span>
            </p>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="seu@email.com"
              className="mt-2 h-11 w-full rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-3 text-sm text-white placeholder:text-[#444] outline-none focus:border-red-500"
            />
            {deleteErr && <p className="mt-2 text-xs text-red-400">{deleteErr}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDelete(false)}
                className="press h-11 flex-1 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] text-sm font-semibold text-white disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="press h-11 flex-1 rounded-xl bg-red-500 text-sm font-bold text-white disabled:opacity-60"
              >
                {deleting ? "Excluindo..." : "Excluir conta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}