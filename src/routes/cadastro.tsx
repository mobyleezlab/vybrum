import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/cadastro")({ component: SignupPage });

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null); setInfo(null);
    if (password !== confirm) return setErr("As senhas não coincidem.");
    if (password.length < 6) return setErr("Senha deve ter ao menos 6 caracteres.");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: SITE_URL,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) return setErr(error.message);
    if (data.session) navigate({ to: "/" });
    else setInfo("Enviamos um e-mail de confirmação. Verifique sua caixa de entrada.");
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto flex min-h-screen max-w-[460px] flex-col bg-white px-5 pb-8 pt-3">
        <header className="flex h-12 items-center">
          <Link to="/login" className="grid h-10 w-10 place-items-center rounded-full hover:bg-neutral-100">
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </header>
        <h1 className="mt-4 text-2xl font-semibold">Criar conta</h1>
        <p className="mt-1 text-sm text-neutral-500">É grátis. Leva menos de 1 minuto.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input required placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#2196F3]" />
          <input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#2196F3]" />
          <input type="password" required placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#2196F3]" />
          <input type="password" required placeholder="Confirmar senha" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#2196F3]" />
          {err && <p className="text-xs text-red-600">{err}</p>}
          {info && <p className="text-xs text-emerald-600">{info}</p>}
          <button type="submit" disabled={loading}
            className="h-11 w-full rounded-xl bg-[#2196F3] text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-500">
          Já tem conta? <Link to="/login" className="text-[#2196F3]">Entrar</Link>
        </p>
      </div>
    </div>
  );
}