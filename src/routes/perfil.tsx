import { createFileRoute, Link } from "@tanstack/react-router";
import { Diamond, ShoppingBag, History, Settings, LogOut } from "lucide-react";
import { useAuth, getInitials } from "@/lib/auth-context";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil · Vybrum" }] }),
  component: PerfilPage,
});

function Row({ icon, label, to, onClick }: { icon: React.ReactNode; label: string; to?: "/creditos"; onClick?: () => void }) {
  const inner = (
    <div className="press flex h-14 items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4">
      <span className="text-[#68ed00]">{icon}</span>
      <span className="flex-1 text-sm font-semibold text-white">{label}</span>
      <span className="text-[#444]">›</span>
    </div>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  return <button type="button" onClick={onClick} className="w-full text-left">{inner}</button>;
}

function PerfilPage() {
  const { user, loading, signOut } = useAuth();

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+24px)]">
      <header className="px-4 pt-3 pb-2">
        <h1 className="text-[22px] font-extrabold tracking-tight text-white">Perfil</h1>
      </header>

      {loading ? (
        <div className="mx-4 mt-4 h-32 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" />
      ) : !user ? (
        <div className="mx-4 mt-4 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-6 text-center">
          <p className="text-sm font-semibold text-white">Faça login para salvar seus kits</p>
          <p className="mt-1 text-xs text-[#888]">e acessar recursos premium.</p>
          <div className="mt-5 flex gap-2">
            <Link
              to="/login" search={{ redirect: "/perfil" }}
              className="press h-[52px] flex-1 rounded-2xl bg-[#68ed00] text-sm font-bold text-black inline-flex items-center justify-center"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro" search={{ redirect: "/perfil" }}
              className="press h-[52px] flex-1 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] text-sm font-semibold text-white inline-flex items-center justify-center"
            >
              Cadastrar
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#68ed00] text-sm font-bold text-black">
              {getInitials(user)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">{user.user_metadata?.full_name ?? "Usuário"}</div>
              <div className="truncate text-xs text-[#888]">{user.email}</div>
            </div>
          </div>

          <div className="mx-4 mt-4 space-y-2">
            <Row icon={<Diamond className="h-5 w-5" />} label="Meus créditos" to="/creditos" />
            <Row icon={<ShoppingBag className="h-5 w-5" />} label="Comprar créditos" to="/creditos" />
            <Row icon={<History className="h-5 w-5" />} label="Histórico" onClick={() => {}} />
            <Row icon={<Settings className="h-5 w-5" />} label="Configurações" onClick={() => {}} />
          </div>

          <div className="mx-4 mt-8">
            <button
              type="button"
              onClick={() => { void signOut(); }}
              className="press inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium text-[#888] transition hover:bg-[#1a1a1a] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </button>
          </div>
        </>
      )}
    </div>
  );
}
