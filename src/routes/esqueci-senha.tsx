import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/esqueci-senha")({ component: ForgotPage });

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null); setErr(null); setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: SITE_URL + "/reset-password",
    });
    setLoading(false);
    if (error) setErr(error.message);
    else setMsg("Se o e-mail existir, enviamos um link para redefinir a senha.");
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto flex min-h-screen max-w-[460px] flex-col bg-white px-5 pb-8 pt-3">
        <header className="flex h-12 items-center">
          <Link to="/login" className="grid h-10 w-10 place-items-center rounded-full hover:bg-neutral-100">
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </header>
        <h1 className="mt-4 text-2xl font-semibold">Recuperar senha</h1>
        <p className="mt-1 text-sm text-neutral-500">Informe seu e-mail para receber o link.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#2196F3]" />
          {err && <p className="text-xs text-red-600">{err}</p>}
          {msg && <p className="text-xs text-emerald-600">{msg}</p>}
          <button type="submit" disabled={loading}
            className="h-11 w-full rounded-xl bg-[#2196F3] text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Enviando..." : "Enviar link"}
          </button>
        </form>
      </div>
    </div>
  );
}