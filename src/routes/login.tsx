import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErr(error.message);
    navigate({ to: redirect });
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto flex min-h-screen max-w-[460px] flex-col bg-white px-5 pb-8 pt-3">
        <header className="flex h-12 items-center">
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-full hover:bg-neutral-100">
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </header>
        <h1 className="mt-4 text-2xl font-semibold">Entrar</h1>
        <p className="mt-1 text-sm text-neutral-500">Acesse para salvar e exportar seus kits.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input type="email" required placeholder="E-mail" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#2196F3]" />
          <input type="password" required placeholder="Senha" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#2196F3]" />
          {err && <p className="text-xs text-red-600">{err}</p>}
          <button type="submit" disabled={loading}
            className="h-11 w-full rounded-xl bg-[#2196F3] text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/esqueci-senha" className="text-[#2196F3]">Esqueci a senha</Link>
          <Link to="/cadastro" className="text-[#2196F3]">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}