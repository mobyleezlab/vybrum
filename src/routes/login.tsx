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

  const onGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + redirect },
    });
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

        <button onClick={onGoogle}
          className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 text-sm font-medium hover:bg-neutral-50">
          <GoogleIcon /> Entrar com Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
          <div className="h-px flex-1 bg-neutral-200" /> ou <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.9 0 19.5-8.6 19.5-19.5 0-1.2-.1-2.3-.3-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-4.9c-2 1.4-4.4 2.4-6.9 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.1 16.2 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.3 5.4l6 4.9C40.7 35 43.5 29.9 43.5 24c0-1.2-.1-2.3-.3-3.5z"/>
    </svg>
  );
}