import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/lib/auth-errors";

const pwSchema = z.string().min(6, "Senha deve ter pelo menos 6 caracteres.").max(128);

export const Route = createFileRoute("/reset-password")({ component: ResetPage });

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErr(null); setLoading(true);
    const parsed = pwSchema.safeParse(password);
    if (!parsed.success) {
      setLoading(false);
      setErr(parsed.error.issues[0]?.message ?? "Senha inválida.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setLoading(false);
    if (error) return setErr(friendlyAuthError(error));
    navigate({ to: "/perfil" });
  };

  return (
    <div className="min-h-dvh bg-black pt-safe">
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-5 pb-8 pt-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Nova senha</h1>
        <p className="mt-2 text-sm text-[#888]">Defina uma nova senha para sua conta.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <input
            type="password" required minLength={6} placeholder="Nova senha" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-[52px] w-full rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 text-sm text-white placeholder:text-[#444] outline-none focus:border-[#68ed00]"
          />
          {err && <p className="text-xs text-red-400">{err}</p>}
          <button
            type="submit" disabled={loading}
            className="press h-[52px] w-full rounded-2xl bg-[#68ed00] text-sm font-bold text-black disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
