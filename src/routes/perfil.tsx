import { createFileRoute, Link } from "@tanstack/react-router";
import { Diamond, ShoppingBag, History, Settings, LogOut, ShieldCheck, Pencil } from "lucide-react";
import { useAuth, getInitials } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useEntitlements } from "@/lib/entitlements";
import { useProfile, useAvatarById } from "@/lib/profile";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil · Vybrum" }] }),
  component: PerfilPage,
});

type RowTo = "/meus-creditos" | "/comprar-creditos" | "/historico" | "/configuracoes" | "/admin";
function Row({ icon, label, to, onClick }: { icon: React.ReactNode; label: string; to?: RowTo; onClick?: () => void }) {
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
  const { ready } = useRequireAuth();
  const { user, signOut } = useAuth();
  const { data: ent } = useEntitlements();
  const { data: profile } = useProfile();
  const avatar = useAvatarById(profile?.avatar_id);

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+24px)]">
      <header className="sticky top-0 z-30 bg-black/90 px-4 pt-3 pb-2 backdrop-blur supports-[backdrop-filter]:bg-black/70">
        <h1 className="text-[22px] font-extrabold tracking-tight text-white">Perfil</h1>
      </header>

      {!ready || !user ? (
        <div className="mx-4 mt-4 h-32 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" />
      ) : (
        <>
          <Link
            to="/editar-perfil"
            className="press mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4"
            aria-label="Editar perfil"
          >
            <div className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-[#68ed00] text-sm font-bold text-black">
              {avatar ? (
                <img src={avatar.image_url} alt={avatar.name} className="h-full w-full object-cover" />
              ) : (
                getInitials(user)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-white">
                {profile?.full_name ?? user.user_metadata?.full_name ?? "Usuário"}
              </div>
              <div className="truncate text-xs text-[#888]">{user.email}</div>
            </div>
            <Pencil className="h-4 w-4 text-[#888]" />
          </Link>

          <div className="mx-4 mt-4 space-y-2">
            <Row icon={<Diamond className="h-5 w-5" />} label="Meus créditos" to="/meus-creditos" />
            <Row icon={<ShoppingBag className="h-5 w-5" />} label="Comprar créditos" to="/comprar-creditos" />
            <Row icon={<History className="h-5 w-5" />} label="Histórico" to="/historico" />
            <Row icon={<Settings className="h-5 w-5" />} label="Configurações" to="/configuracoes" />
            {ent?.isAdmin && (
              <Row icon={<ShieldCheck className="h-5 w-5" />} label="Admin · Modelos" to="/admin" />
            )}
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
