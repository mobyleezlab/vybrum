import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FolderOpen, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { toast as sonner } from "sonner";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useKits, useDeleteKit, type KitRow } from "@/lib/kits";

export const Route = createFileRoute("/kits")({
  head: () => ({ meta: [{ title: "Meus Kits · Vybrum" }] }),
  component: KitsPage,
});

function KitsPage() {
  const { ready } = useRequireAuth();
  const { data: kits, isLoading } = useKits();
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
        <div className="mx-4 mt-4 h-32 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" />
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
        <ul className="mx-4 mt-4 space-y-2">
          {kits.map((k) => (
            <li key={k.id} className="flex items-center gap-3 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-3">
              <button
                onClick={() => handleOpen(k)}
                className="press flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1a1a1a] text-[#68ed00]">
                  <Pencil className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{k.name}</span>
                  <span className="block truncate text-[11px] text-[#888]">
                    {k.model_code} · {k.player_name || "—"} #{k.player_number || "0"}
                  </span>
                </span>
              </button>
              <button
                aria-label="Excluir kit"
                onClick={() => setConfirmId(k.id)}
                className="press grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#888] hover:bg-[#1a1a1a] hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
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
