import { createFileRoute, Link } from "@tanstack/react-router";
import { Diamond, ShoppingBag, History, Settings, ShieldCheck, ChevronRight } from "lucide-react";
import { useAuth, getInitials } from "@/lib/auth-context";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useEntitlements } from "@/lib/entitlements";
import { useProfile, useAvatarById } from "@/lib/profile";
import { useCreditBalance } from "@/lib/credits";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil · Vybrum" }] }),
  component: PerfilPage,
});

type RowTo = "/meus-creditos" | "/creditos" | "/historico" | "/configuracoes" | "/admin";
function Row({
  icon,
  label,
  hint,
  to,
  onClick,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  to?: RowTo;
  onClick?: () => void;
  last?: boolean;
}) {
  const inner = (
    <div
      className={`press flex min-h-[60px] items-center gap-4 px-5 ${
        last ? "" : "border-b border-white/[0.06]"
      }`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#68ed00]/10 text-[#68ed00]">
        {icon}
      </span>
      <span className="flex-1 text-[15px] font-medium text-white">{label}</span>
      {hint && (
        <span className="text-[13px] font-semibold tabular-nums text-[#888]">{hint}</span>
      )}
      <ChevronRight className="h-4 w-4 text-[#3a3a3a]" />
    </div>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {inner}
    </button>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 px-5">
      {title && (
        <h2 className="mb-2 pl-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#666]">
          {title}
        </h2>
      )}
      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0c0c]">
        {children}
      </div>
    </section>
  );
}

function PerfilPage() {
  const { ready } = useRequireAuth();
  const { user } = useAuth();
  const { data: ent } = useEntitlements();
  const { data: profile } = useProfile();
  const { data: balance } = useCreditBalance();
  const avatar = useAvatarById(profile?.avatar_id);

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+32px)]">
      <header className="px-5 pb-1 pt-6">
        <h1 className="text-[28px] font-black tracking-tight text-white">Perfil</h1>
      </header>

      {!ready || !user ? (
        <div className="mx-5 mt-6 h-44 animate-pulse rounded-3xl bg-[#0c0c0c]" />
      ) : (
        <>
          {/* Hero card */}
          <section className="px-5 pt-5">
            <Link
              to="/editar-perfil"
              aria-label="Editar perfil"
              className="press relative block overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0c0c0c] p-6"
            >
              <div className="flex items-center gap-4">
                <div className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-[#68ed00] text-xl font-black text-black ring-2 ring-[#68ed00]/30 ring-offset-4 ring-offset-[#0c0c0c]">
                  {avatar ? (
                    <img src={avatar.image_url} alt={avatar.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    getInitials(user)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[18px] font-extrabold tracking-tight text-white">
                    {profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? "Usuário"}
                  </div>
                  <div className="mt-0.5 truncate text-[13px] text-[#888]">{user.email}</div>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white">
                    <Diamond className="h-3 w-3 text-[#68ed00]" />
                    {balance?.balance ?? 0} créditos
                  </span>
                </div>
              </div>
              <span className="absolute right-5 top-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#68ed00]">
                Editar
              </span>
            </Link>
          </section>

          <Section title="Carteira">
            <Row
              icon={<Diamond className="h-[18px] w-[18px]" />}
              label="Meus créditos"
              to="/meus-creditos"
            />
            <Row
              icon={<ShoppingBag className="h-[18px] w-[18px]" />}
              label="Comprar créditos"
              to="/creditos"
            />
            <Row
              icon={<History className="h-[18px] w-[18px]" />}
              label="Histórico"
              to="/historico"
              last
            />
          </Section>

          <Section title="App">
            <Row
              icon={<Settings className="h-[18px] w-[18px]" />}
              label="Configurações"
              to="/configuracoes"
              last={!ent?.isAdmin}
            />
            {ent?.isAdmin && (
              <Row
                icon={<ShieldCheck className="h-[18px] w-[18px]" />}
                label="Admin · Modelos"
                to="/admin"
                last
              />
            )}
          </Section>

          <p className="mt-10 text-center text-[11px] font-medium tracking-[0.2em] text-[#3a3a3a]">
            VYBRUM · v1.0.0
          </p>
        </>
      )}
    </div>
  );
}
