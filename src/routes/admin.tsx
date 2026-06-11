import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Lock, Loader2, Shirt, Users, DollarSign, BarChart3, Package, Sparkles, ShieldAlert, Settings } from "lucide-react";
import { adminCheck } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin · Vybrum" }] }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin/modelos", label: "Modelos", icon: Shirt },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/faturamento", label: "Faturamento", icon: DollarSign },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/creditos", label: "Créditos & Pacotes", icon: Package },
  { to: "/admin/drops", label: "Drops", icon: Sparkles },
  { to: "/admin/moderacao", label: "Moderação", icon: ShieldAlert },
  { to: "/admin/config", label: "Configurações", icon: Settings },
] as const;

function AdminLayout() {
  const { user, loading } = useAuth();
  const checkFn = useServerFn(adminCheck);
  const loc = useLocation();

  const check = useQuery({
    queryKey: ["admin", "check", user?.id],
    enabled: !!user,
    queryFn: () => checkFn(),
  });

  if (loading || (user && check.isLoading)) {
    return (
      <div className="grid min-h-dvh place-items-center bg-black text-white">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-black px-4 text-center">
        <div>
          <Lock className="mx-auto h-10 w-10 text-[#666]" />
          <p className="mt-3 text-sm text-white">Entre para acessar o admin.</p>
          <Link to="/login" search={{ redirect: "/admin" }} className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#68ed00] px-5 text-sm font-bold text-black">Entrar</Link>
        </div>
      </div>
    );
  }

  if (!check.data?.isAdmin) {
    return (
      <div className="grid min-h-dvh place-items-center bg-black px-4 text-center">
        <div>
          <Lock className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-3 max-w-sm text-sm text-white">
            {check.data?.setupError ?? "Acesso restrito a administradores."}
          </p>
          <Link to="/" className="mt-4 inline-flex h-11 items-center rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-5 text-sm font-semibold text-white">Voltar</Link>
        </div>
      </div>
    );
  }

  const activeTab = TABS.find((t) => loc.pathname.startsWith(t.to)) ?? TABS[0];

  return (
    <div className="min-h-dvh bg-black text-white">
      <header className="sticky top-0 z-30 border-b border-[#1a1a1a] bg-black/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/perfil" className="press grid h-9 w-9 place-items-center rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="flex-1 text-base font-bold">Admin · {activeTab.label}</h1>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:px-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = loc.pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className="press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold uppercase tracking-wide"
                style={{
                  borderColor: active ? "#68ed00" : "#2a2a2a",
                  background: active ? "#68ed0022" : "#0f0f0f",
                  color: active ? "#68ed00" : "#bbb",
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="px-4 py-4 lg:px-6">
        <Outlet />
      </div>
    </div>
  );
}