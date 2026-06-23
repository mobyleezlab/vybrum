import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade · Vybrum" },
      { name: "description", content: "Política de Privacidade do Vybrum." },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <div className="min-h-dvh bg-black pt-safe">
      <div className="mx-auto max-w-[720px] px-5 pb-16 pt-3">
        <header className="flex h-12 items-center">
          <Link to="/" className="press grid h-10 w-10 place-items-center rounded-full hover:bg-[#1a1a1a]">
            <ChevronLeft className="h-6 w-6 text-white" />
          </Link>
        </header>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Política de Privacidade</h1>
        <p className="mt-3 text-sm text-[#888]">Versão 1.0</p>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-[#cfcfcf]">
          <p>Conteúdo será adicionado em breve.</p>
        </div>
      </div>
    </div>
  );
}