import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/auth-errors";

const emailSchema = z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(255);

export const Route = createFileRoute("/esqueci-senha")({ component: ForgotPage });

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErr(null); setMsg(null); setLoading(true);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setLoading(false);
      setErr(parsed.error.issues[0]?.message ?? "E-mail inválido.");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${origin}/reset-password`,
    });
    setLoading(false);
    if (error) return setErr(friendlyAuthError(error));
    setMsg("Se o e-mail existir, enviamos um link para redefinir a senha.");
  };

  return (
    <div className="min-h-dvh bg-black pt-safe">
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-5 pb-8 pt-3">
        <header className="flex h-12 items-center">
          <Link to="/login" search={{ redirect: "/" }} className="press grid h-10 w-10 place-items-center rounded-full hover:bg-[#1a1a1a]">
            <ChevronLeft className="h-6 w-6 text-white" />
          </Link>
        </header>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white">Recuperar senha</h1>
        <p className="mt-2 text-sm text-[#888]">Enviaremos um link para o seu e-mail.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <input
            type="email" required placeholder="E-mail" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-[52px] w-full rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 text-sm text-white placeholder:text-[#444] outline-none focus:border-[#68ed00]"
          />
          {err && <p className="text-xs text-red-400">{err}</p>}
          {msg && <p className="text-xs text-[#68ed00]">{msg}</p>}
          <button
            type="submit" disabled={loading}
            className="press h-[52px] w-full rounded-2xl bg-[#68ed00] text-sm font-bold text-black disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar link"}
          </button>
        </form>
      </div>
    </div>
  );
}
