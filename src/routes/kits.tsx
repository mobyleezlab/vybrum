import { createFileRoute } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import { useRequireAuth } from "@/lib/use-require-auth";

export const Route = createFileRoute("/kits")({
  head: () => ({ meta: [{ title: "Meus Kits · Vybrum" }] }),
  component: KitsPage,
});

function KitsPage() {
  const { ready } = useRequireAuth();

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+24px)]">
      <header className="sticky top-0 z-30 bg-black/90 px-4 pt-3 pb-2 backdrop-blur supports-[backdrop-filter]:bg-black/70">
        <h1 className="text-[22px] font-extrabold tracking-tight text-white">Meus Kits</h1>
      </header>

      {!ready ? (
        <div className="mx-4 mt-4 h-32 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" />
      ) : (
        <div className="mx-4 mt-4 rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0f0f0f] p-6 text-center">
          <FolderOpen className="mx-auto h-8 w-8 text-[#444]" />
          <p className="mt-3 text-sm font-semibold text-white">Nenhum kit salvo ainda</p>
          <p className="mt-1 text-xs text-[#888]">Crie um no editor e salve para vê-lo aqui.</p>
        </div>
      )}
    </div>
  );
}
