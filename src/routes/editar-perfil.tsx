import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Check, Loader2, KeyRound, Mail, LogOut, Trash2, ChevronRight } from "lucide-react";
import { z } from "zod";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useProfile, useAvatars, useUpdateProfile } from "@/lib/profile";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/editar-perfil")({
  ssr: false,
  head: () => ({ meta: [{ title: "Editar perfil · Vybrum" }] }),
  component: EditarPerfilPage,
});

const nameSchema = z.string().trim().min(1, "Informe seu nome").max(80, "Nome muito longo");

function EditarPerfilPage() {
  const { ready } = useRequireAuth();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: avatars, isLoading: loadingAvatars } = useAvatars();
  const update = useUpdateProfile();

  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [pwSending, setPwSending] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated) return;
    if (loadingProfile) return;
    setName(profile?.full_name ?? (user?.user_metadata?.full_name as string) ?? "");
    setAvatarId(profile?.avatar_id ?? null);
    setHydrated(true);
  }, [profile, loadingProfile, user, hydrated]);

  const handleSave = async () => {
    setError(null);
    const parsed = nameSchema.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Nome inválido");
      return;
    }
    try {
      await update.mutateAsync({ full_name: parsed.data, avatar_id: avatarId });
      navigate({ to: "/perfil" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    }
  };

  const selectedAvatar = avatars?.find((a) => a.id === avatarId) ?? avatars?.[0];

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    setPwSending(true);
    setPwMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setPwMessage("Enviamos um link para o seu e-mail.");
    } catch (e) {
      setPwMessage(e instanceof Error ? e.message : "Erro ao enviar o link.");
    } finally {
      setPwSending(false);
    }
  };

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+32px)]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-black/85 px-3 pt-1 backdrop-blur supports-[backdrop-filter]:bg-black/65">
        <Link to="/perfil" aria-label="Voltar" className="press grid h-10 w-10 place-items-center rounded-full text-white">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-[13px] font-semibold tracking-[0.18em] text-white/80">EDITAR PERFIL</h1>
        <button
          type="button"
          disabled={update.isPending}
          onClick={handleSave}
          className="press rounded-full px-3 py-1.5 text-[13px] font-bold text-[#68ed00] disabled:opacity-50"
        >
          {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
        </button>
      </header>

      {!ready || loadingProfile ? (
        <div className="mx-5 mt-6 h-44 animate-pulse rounded-3xl bg-[#0c0c0c]" />
      ) : (
        <>
          {/* Avatar hero */}
          <section className="flex flex-col items-center px-5 pt-6">
            <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-[#0c0c0c] ring-2 ring-[#68ed00]/50 ring-offset-[6px] ring-offset-black">
              {selectedAvatar ? (
                <img src={selectedAvatar.image_url} alt={selectedAvatar.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-[#68ed00]">
                  {(name || profile?.full_name || user?.email || "U")[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <p className="mt-3 text-[12px] font-medium text-[#666]">Toque em um avatar abaixo para trocar</p>
          </section>

          {/* Name field — grouped card */}
          <section className="mt-7 px-5">
            <h2 className="mb-2 pl-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#666]">Identidade</h2>
            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0c0c]">
              <label htmlFor="full_name" className="flex items-center gap-4 px-5 py-3.5">
                <span className="w-20 shrink-0 text-[13px] font-medium text-[#888]">Nome</span>
                <input
                  id="full_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  className="flex-1 bg-transparent text-[15px] font-medium text-white outline-none placeholder:text-[#444]"
                  placeholder="Como devemos te chamar?"
                />
              </label>
            </div>
          </section>

          {/* Avatares */}
          <section className="mt-7 px-5">
            <h2 className="mb-2 pl-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#666]">Avatares</h2>
            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0c0c] p-4">
              {loadingAvatars ? (
                <div className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />
              ) : !avatars || avatars.length === 0 ? (
                <div className="grid h-24 place-items-center text-xs text-[#666]">
                  Nenhum avatar disponível
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  {avatars.map((a) => {
                    const selected = avatarId === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAvatarId(a.id)}
                        aria-label={a.name}
                        className={`press relative aspect-square overflow-hidden rounded-2xl bg-black transition ${
                          selected ? "ring-2 ring-[#68ed00] ring-offset-2 ring-offset-[#0c0c0c]" : "ring-1 ring-white/[0.06]"
                        }`}
                      >
                        <img src={a.image_url} alt={a.name} className="h-full w-full object-cover" loading="lazy" />
                        {selected && (
                          <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#68ed00] text-black">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Conta */}
          <section className="mt-7 px-5">
            <h2 className="mb-2 pl-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#666]">Conta</h2>
            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0c0c]">
              <div className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.06]">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#68ed00]/10 text-[#68ed00]">
                  <Mail className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-[#888]">E-mail</div>
                  <div className="truncate text-[14px] font-semibold text-white">{user?.email}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendPasswordReset}
                disabled={pwSending || !user?.email}
                className="press flex w-full items-center gap-4 px-5 py-3.5 text-left disabled:opacity-60"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#68ed00]/10 text-[#68ed00]">
                  <KeyRound className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-medium text-white">Alterar senha</div>
                  <div className="text-[12px] text-[#888]">
                    {pwMessage ?? "Enviamos um link para o seu e-mail"}
                  </div>
                </div>
                {pwSending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#888]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[#3a3a3a]" />
                )}
              </button>
            </div>
          </section>

          {/* Sessão — ações destrutivas em baixo destaque */}
          <section className="mt-10 mb-2 flex flex-col items-center gap-3 px-5">
            <button
              type="button"
              onClick={() => { void signOut(); }}
              className="press inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-[#888] transition hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </button>
            <button
              type="button"
              onClick={() => alert("Para excluir sua conta entre em contato com o suporte.")}
              className="press inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-medium text-[#666] underline-offset-4 transition hover:text-[#ef4444] hover:underline"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir conta
            </button>
          </section>

          {error && <p className="mx-5 mt-4 text-[12px] font-medium text-[#ef4444]">{error}</p>}
        </>
      )}
    </div>
  );
}