import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
      // Sessão expirou/encerrou: limpa caches de dados privados.
      if (_e === "SIGNED_OUT" || _e === "TOKEN_REFRESHED" && !s) {
        qc.clear();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [qc]);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signOut: async () => {
          // Logout higiênico: cancela queries em voo (evita 401 storm),
          // limpa cache de dados privados e redireciona para /login (REPLACE).
          try { await qc.cancelQueries(); } catch { /* noop */ }
          qc.clear();
          try { await supabase.auth.signOut(); } catch { /* noop */ }
          navigate({ to: "/login", replace: true, search: { redirect: "/" } });
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

export function getInitials(user: User | null): string {
  if (!user) return "?";
  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";
  const parts = name.split(/[\s@]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}
