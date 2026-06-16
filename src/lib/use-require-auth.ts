import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

/**
 * Redireciona para /login (com ?redirect=path atual) quando não houver sessão.
 * Retorna { user, loading, ready } onde `ready` indica que o usuário
 * está autenticado e é seguro renderizar conteúdo privado.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", replace: true, search: { redirect: pathname } });
    }
  }, [loading, user, navigate, pathname]);

  return { user, loading, ready: !loading && !!user };
}