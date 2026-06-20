import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Lock, Loader2, Shirt, Users, DollarSign, BarChart3, Package, Sparkles, ShieldAlert, Settings, Menu, Smile } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin · Vybrum" }] }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin/modelos", label: "Modelos", icon: Shirt },
  { to: "/admin/avatares", label: "Avatares", icon: Smile },
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
  const loc = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const check = useQuery({
    queryKey: ["admin", "check", user?.id],
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      try {
        // Client-side: chama RPC is_admin() direto via Supabase JS.
        // O token vai automaticamente no header Authorization, RLS + SECURITY DEFINER
        // garantem a segurança real. O check aqui é só para UX.
        const { data, error } = await supabase.rpc("is_admin");
        if (error) {
          console.error("[adminCheck] rpc error:", error);
          return { isAdmin: false, setupError: error.message };
        }
        return { isAdmin: data === true, setupError: null as string | null };
      } catch (err) {
        console.error("[adminCheck] falhou:", err);
        return { isAdmin: false, setupError: "Não foi possível validar o admin." };
      }
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", search: { redirect: "/admin" }, replace: true });
    }
  }, [loading, user, navigate]);

  if (loading || (user && check.isLoading)) {
    return (
      <div className="grid min-h-dvh place-items-center bg-black text-white">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
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
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="press grid h-9 w-9 place-items-center rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]"
                aria-label="Abrir menu do admin"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] border-[#1a1a1a] bg-black p-0 text-white">
              <SheetHeader className="border-b border-[#1a1a1a] p-4">
                <SheetTitle className="text-white">Admin</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  const active = loc.pathname.startsWith(t.to);
                  return (
                    <Link
                      key={t.to}
                      to={t.to}
                      onClick={() => setMenuOpen(false)}
                      className="press inline-flex h-11 items-center gap-3 rounded-lg border px-3 text-sm font-semibold"
                      style={{
                        borderColor: active ? "#68ed00" : "#2a2a2a",
                        background: active ? "#68ed0022" : "#0f0f0f",
                        color: active ? "#68ed00" : "#ddd",
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {t.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <div className="px-4 py-4 lg:px-6">
        <Outlet />
      </div>
    </div>
  );
}