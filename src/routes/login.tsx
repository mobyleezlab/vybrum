import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { BackButton } from "@/components/BackButton";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/auth-errors";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(255),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres.").max(128),
});

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
    if (loading) return; // anti double-submit
    setErr(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Verifique os campos.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) return setErr(friendlyAuthError(error));
    navigate({ to: redirect });
  };

  return (
    <div className="min-h-dvh bg-black pt-safe">
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-5 pb-8 pt-3">
        <header className="flex h-12 items-center">
          <BackButton fallback="/" />
        </header>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white">Entrar</h1>
        <p className="mt-2 text-sm text-[#888]">Acesse para salvar e exportar seus kits.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <input
            type="email" required placeholder="E-mail" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-[52px] w-full rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 text-sm text-white placeholder:text-[#444] outline-none focus:border-[#68ed00]"
          />
          <input
            type="password" required placeholder="Senha" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-[52px] w-full rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 text-sm text-white placeholder:text-[#444] outline-none focus:border-[#68ed00]"
          />
          {err && <p className="text-xs text-red-400">{err}</p>}
          <button
            type="submit" disabled={loading}
            className="press h-[52px] w-full rounded-2xl bg-[#68ed00] text-sm font-bold text-black disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link to="/esqueci-senha" className="text-[#68ed00] font-semibold">Esqueci a senha</Link>
          <Link to="/cadastro" search={{ redirect }} className="text-[#68ed00] font-semibold">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}
