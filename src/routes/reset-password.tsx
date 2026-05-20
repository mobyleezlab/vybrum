import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({ component: ResetPage });

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password !== confirm) return setErr("As senhas não coincidem.");
    if (password.length < 6) return setErr("Senha deve ter ao menos 6 caracteres.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setErr(error.message);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="mx-auto flex min-h-screen max-w-[460px] flex-col bg-white px-5 pb-8 pt-3">
        <h1 className="mt-12 text-2xl font-semibold">Nova senha</h1>
        <p className="mt-1 text-sm text-neutral-500">Defina uma nova senha para sua conta.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input type="password" required placeholder="Nova senha" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#2196F3]" />
          <input type="password" required placeholder="Confirmar senha" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-[#2196F3]" />
          {err && <p className="text-xs text-red-600">{err}</p>}
          <button type="submit" disabled={loading}
            className="h-11 w-full rounded-xl bg-[#2196F3] text-sm font-semibold text-white disabled:opacity-60">
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </div>
    </div>
  );
}