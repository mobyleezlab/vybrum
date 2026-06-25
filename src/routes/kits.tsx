import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FolderOpen, Trash2, Shirt } from "lucide-react";
import { useState } from "react";
import { toast as sonner } from "sonner";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useKits, useDeleteKit, type KitRow } from "@/lib/kits";
import { useModels, categoryBadge } from "@/lib/models";

export const Route = createFileRoute("/kits")({
  head: () => ({ meta: [{ title: "Meus Kits · Vybrum" }] }),
  component: KitsPage,
});

function KitsPage() {
  const { ready } = useRequireAuth();
  const { data: kits, isLoading } = useKits();
  const { data: models } = useModels();
  const deleteKit = useDeleteKit();
  const navigate = useNavigate();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleOpen = (k: KitRow) => {
    navigate({ to: "/editor", search: { model: k.model_code, kit: k.id } });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteKit.mutateAsync(id);
      sonner.success("Kit excluído.");
    } catch {
      sonner.error("Não foi possível excluir o kit.");
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+24px)]">
      <header className="sticky top-0 z-30 bg-black/90 px-4 pt-3 pb-2 backdrop-blur supports-[backdrop-filter]:bg-black/70">
        <h1 className="text-[22px] font-extrabold tracking-tight text-white">Meus Kits</h1>
      </header>

      {!ready ? (
        <div className="mx-4 mt-4 h-32 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" />
      ) : isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" style={{ aspectRatio: "4 / 5.6" }} />
          ))}
        </div>
      ) : !kits || kits.length === 0 ? (
        <div className="mx-4 mt-4 rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0f0f0f] p-6 text-center">
          <FolderOpen className="mx-auto h-8 w-8 text-[#444]" />
          <p className="mt-3 text-sm font-semibold text-white">Nenhum kit salvo ainda</p>
          <p className="mt-1 text-xs text-[#888]">Crie um no editor e salve para vê-lo aqui.</p>
          <Link to="/" className="press mt-4 inline-block rounded-full bg-[#68ed00] px-4 py-2 text-xs font-bold text-black">
            Explorar modelos
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 px-4">
          {kits.map((k) => {
            const model = models?.find((m) => m.code === k.model_code);
            const badge = categoryBadge(model?.category ?? (k.is_premium_model ? "premium" : "free"));
            return (
              <div key={k.id} className="relative overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]">
                <button onClick={() => handleOpen(k)} className="press block w-full text-left">
                  <div className="relative" style={{ aspectRatio: "4 / 5" }}>
                    {model?.thumbnail_url ? (
                      <img src={model.thumbnail_url} alt={k.name} className="h-full w-full object-contain p-3" loading="lazy" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-[#0a0a0a]">
                        <Shirt className="h-10 w-10 text-[#333]" />
                      </div>
                    )}
                    <span className={`absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${badge.className}`}>{badge.label}</span>
                  </div>
                  <div className="border-t border-[#2a2a2a] px-3 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#666]">{k.model_code}</div>
                    <div className="mt-0.5 truncate text-[12px] font-semibold text-white">{k.name}</div>
                    <div className="mt-0.5 truncate text-[10px] text-[#888]">{k.player_name || "—"} #{k.player_number || "0"}</div>
                  </div>
                </button>
                <button
                  aria-label="Excluir kit"
                  onClick={() => setConfirmId(k.id)}
                  className="press absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {confirmId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6"
          onClick={() => setConfirmId(null)}
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-white">Excluir kit?</h2>
            <p className="mt-1 text-sm text-[#888]">Essa ação não pode ser desfeita.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmId(null)} disabled={deleteKit.isPending} className="rounded-lg px-4 py-2 text-sm font-medium text-[#888] hover:bg-[#1a1a1a] disabled:opacity-50">Cancelar</button>
              <button onClick={() => handleDelete(confirmId)} disabled={deleteKit.isPending} className="rounded-lg bg-[#E52222] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
                {deleteKit.isPending ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
