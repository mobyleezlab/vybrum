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
    <div className="min-h-screen bg-black pt-safe">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col px-5 pb-8 pt-3">
        <header className="flex h-12 items-center">
          <Link to="/" className="press grid h-10 w-10 place-items-center rounded-full hover:bg-[#1a1a1a]">
            <ChevronLeft className="h-6 w-6 text-white" />
          </Link>
        </header>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white">Entrar</h1>
        <p className="mt-2 text-sm text-[#888]">Acesse para salvar e exportar seus kits.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <input
            type="email" required placeholder="E-mail" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-[52px] w-full rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 text-sm text-white placeholder:text-[#444] outline-none focus:border-[#cffc0b]"
          />
          <input
            type="password" required placeholder="Senha" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-[52px] w-full rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 text-sm text-white placeholder:text-[#444] outline-none focus:border-[#cffc0b]"
          />
          {err && <p className="text-xs text-red-400">{err}</p>}
          <button
            type="submit" disabled={loading}
            className="press h-[52px] w-full rounded-2xl bg-[#cffc0b] text-sm font-bold text-black disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link to="/esqueci-senha" className="text-[#cffc0b] font-semibold">Esqueci a senha</Link>
          <Link to="/cadastro" search={{ redirect }} className="text-[#cffc0b] font-semibold">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}
