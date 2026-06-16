import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/auth-errors";

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(255),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres.").max(128),
});

export const Route = createFileRoute("/cadastro")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/",
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/cadastro" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErr(null); setMsg(null);
    const parsed = signupSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Verifique os campos.");
      return;
    }
    setLoading(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signUp({
      ...parsed.data,
      options: { emailRedirectTo: origin },
    });
    setLoading(false);
    if (error) return setErr(friendlyAuthError(error));
    setMsg("Conta criada! Verifique seu e-mail para confirmar e depois faça login.");
    setTimeout(() => navigate({ to: "/login", search: { redirect } }), 1800);
  };

  return (
    <div className="min-h-dvh bg-black pt-safe">
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-5 pb-8 pt-3">
        <header className="flex h-12 items-center">
          <Link to="/login" search={{ redirect }} className="press grid h-10 w-10 place-items-center rounded-full hover:bg-[#1a1a1a]">
            <ChevronLeft className="h-6 w-6 text-white" />
          </Link>
        </header>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white">Criar conta</h1>
        <p className="mt-2 text-sm text-[#888]">Salve, exporte e desbloqueie kits premium.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <input
            type="email" required placeholder="E-mail" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-[52px] w-full rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 text-sm text-white placeholder:text-[#444] outline-none focus:border-[#68ed00]"
          />
          <input
            type="password" required minLength={6} placeholder="Senha (mín. 6 caracteres)" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-[52px] w-full rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 text-sm text-white placeholder:text-[#444] outline-none focus:border-[#68ed00]"
          />
          {err && <p className="text-xs text-red-400">{err}</p>}
          {msg && <p className="text-xs text-[#68ed00]">{msg}</p>}
          <button
            type="submit" disabled={loading}
            className="press h-[52px] w-full rounded-2xl bg-[#68ed00] text-sm font-bold text-black disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#888]">
          Já tem conta?{" "}
          <Link to="/login" search={{ redirect }} className="font-semibold text-[#68ed00]">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
