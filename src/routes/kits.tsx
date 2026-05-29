import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/kits")({
  head: () => ({ meta: [{ title: "Meus Kits · Vybrum" }] }),
  component: KitsPage,
});

function KitsPage() {
  const { user, loading } = useAuth();

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+24px)]">
      <header className="px-4 pt-3 pb-2">
        <h1 className="text-[22px] font-extrabold tracking-tight text-white">Meus Kits</h1>
      </header>

      {loading ? null : !user ? (
        <div className="mx-4 mt-4 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-6 text-center">
          <FolderOpen className="mx-auto h-8 w-8 text-[#444]" />
          <p className="mt-3 text-sm font-semibold text-white">Entre para ver seus kits salvos</p>
          <Link
            to="/login" search={{ redirect: "/kits" }}
            className="press mt-4 inline-flex h-[52px] items-center justify-center rounded-2xl bg-[#68ed00] px-6 text-sm font-bold text-black"
          >
            Entrar
          </Link>
        </div>
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
