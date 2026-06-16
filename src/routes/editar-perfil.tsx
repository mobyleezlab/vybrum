import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import { z } from "zod";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useProfile, useAvatars, useUpdateProfile } from "@/lib/profile";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/editar-perfil")({
  ssr: false,
  head: () => ({ meta: [{ title: "Editar perfil · Vybrum" }] }),
  component: EditarPerfilPage,
});

const nameSchema = z.string().trim().min(1, "Informe seu nome").max(80, "Nome muito longo");

function EditarPerfilPage() {
  const { ready } = useRequireAuth();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: avatars, isLoading: loadingAvatars } = useAvatars();
  const update = useUpdateProfile();

  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

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

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+24px)]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-black/90 px-2 pt-1 backdrop-blur supports-[backdrop-filter]:bg-black/70">
        <Link to="/perfil" aria-label="Voltar" className="press grid h-10 w-10 place-items-center rounded-full text-white hover:bg-[#1a1a1a]">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-[12px] font-bold tracking-[0.22em] text-[#888]">EDITAR PERFIL</h1>
        <span className="w-10" />
      </header>

      {!ready || loadingProfile ? (
        <div className="mx-4 mt-4 h-40 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" />
      ) : (
        <>
          <section className="mx-4 mt-4 flex flex-col items-center">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border-2 border-[#68ed00] bg-[#0f0f0f]">
              {selectedAvatar ? (
                <img src={selectedAvatar.image_url} alt={selectedAvatar.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-[#68ed00]">{(name || profile?.full_name || user?.email || "U")[0]?.toUpperCase()}</span>
              )}
            </div>
            <p className="mt-2 text-xs text-[#888]">Escolha um avatar abaixo</p>
          </section>

          <section className="mx-4 mt-4">
            <label htmlFor="full_name" className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#888]">Nome</label>
            <input
              id="full_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="mt-1 h-12 w-full rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] px-4 text-sm text-white outline-none focus:border-[#68ed00]"
              placeholder="Como devemos te chamar?"
            />
          </section>

          <section className="mx-4 mt-5">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#888]">Avatares</h2>
            {loadingAvatars ? (
              <div className="h-32 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" />
            ) : !avatars || avatars.length === 0 ? (
              <div className="grid h-24 place-items-center rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0f0f0f] text-xs text-[#666]">
                Nenhum avatar disponível
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {avatars.map((a) => {
                  const selected = avatarId === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAvatarId(a.id)}
                      aria-label={a.name}
                      className={`press relative aspect-square overflow-hidden rounded-2xl border-2 bg-[#0f0f0f] transition ${
                        selected ? "border-[#68ed00]" : "border-[#2a2a2a]"
                      }`}
                    >
                      <img src={a.image_url} alt={a.name} className="h-full w-full object-cover" loading="lazy" />
                      {selected && (
                        <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-[#68ed00] text-black">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {error && <p className="mx-4 mt-3 text-xs text-[#ef4444]">{error}</p>}

          <section className="mx-4 mt-6">
            <button
              type="button"
              disabled={update.isPending}
              onClick={handleSave}
              className="press inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#68ed00] text-sm font-bold text-black disabled:opacity-60"
            >
              {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar alterações"}
            </button>
          </section>
        </>
      )}
    </div>
  );
}