import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Diamond, Loader2, Sparkles } from "lucide-react";
import { useCreditBalance, useCreditPackages, formatBRL } from "@/lib/credits";
import { useRequireAuth } from "@/lib/use-require-auth";

export const Route = createFileRoute("/comprar-creditos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Comprar créditos · Vybrum" }] }),
  component: ComprarCreditosPage,
});

function ComprarCreditosPage() {
  const { ready } = useRequireAuth();
  const { data: balance } = useCreditBalance();
  const { data: packages, isLoading } = useCreditPackages();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleBuy = async (id: string) => {
    if (pendingId) return; // proteção contra cliques duplos
    setPendingId(id);
    try {
      // Integração de pagamento será conectada aqui. Por ora exibe aviso.
      await new Promise((r) => setTimeout(r, 400));
      alert("Pagamento ainda não disponível — em breve!");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+24px)]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-black/90 px-2 pt-1 backdrop-blur supports-[backdrop-filter]:bg-black/70">
        <Link to="/perfil" aria-label="Voltar" className="press grid h-10 w-10 place-items-center rounded-full text-white hover:bg-[#1a1a1a]">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-[12px] font-bold tracking-[0.22em] text-[#888]">COMPRAR CRÉDITOS</h1>
        <span className="w-10" />
      </header>

      {!ready ? (
        <div className="mx-4 mt-4 h-40 animate-pulse rounded-3xl border border-[#2a2a2a] bg-[#0f0f0f]" />
      ) : (
        <>
          <section className="px-4">
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888]">Seu saldo</div>
              <div className="mt-1 flex items-baseline gap-2">
                <Diamond className="h-5 w-5 text-[#68ed00]" />
                <span className="text-2xl font-extrabold tabular-nums text-white">{balance?.balance ?? 0}</span>
                <span className="text-xs text-[#888]">créditos</span>
              </div>
            </div>
          </section>

          <section className="mx-4 mt-4">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#888]">Planos disponíveis</h2>
            {isLoading ? (
              <div className="h-40 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" />
            ) : !packages || packages.length === 0 ? (
              <div className="grid h-32 place-items-center rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0f0f0f] text-xs text-[#666]">
                Nenhum plano disponível no momento
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {packages.map((p) => {
                  const total = p.total_credits ?? p.credits + p.bonus_credits;
                  const isPending = pendingId === p.id;
                  return (
                    <div key={p.id} className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
                      <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1.5">
                        <Diamond className="h-5 w-5 text-[#68ed00]" />
                        <span className="text-2xl font-extrabold tabular-nums text-white">{total}</span>
                      </div>
                      {p.bonus_credits > 0 && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#68ed00]">
                          <Sparkles className="h-3 w-3" /> +{p.bonus_credits} bônus
                        </div>
                      )}
                      <div className="mt-3 text-lg font-extrabold text-white">{formatBRL(Number(p.price_brl))}</div>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleBuy(p.id)}
                        className="press mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#68ed00] py-2.5 text-sm font-bold text-black disabled:opacity-60"
                      >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comprar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-3 text-[11px] text-[#666]">
              O pagamento real será processado pelo gateway integrado. Estamos preparando a integração.
            </p>
          </section>
        </>
      )}
    </div>
  );
}