import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Diamond, TrendingDown, TrendingUp, Plus, History as HistoryIcon } from "lucide-react";
import { useCreditBalance } from "@/lib/credits";
import { useCreditLedger, ledgerLabel } from "@/lib/history";
import { useRequireAuth } from "@/lib/use-require-auth";

export const Route = createFileRoute("/meus-creditos")({
  ssr: false,
  head: () => ({ meta: [{ title: "Meus créditos · Vybrum" }] }),
  component: MeusCreditosPage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function MeusCreditosPage() {
  const { ready } = useRequireAuth();
  const { data: balance, isLoading } = useCreditBalance();
  const { data: ledger, isLoading: loadingLedger } = useCreditLedger(8);

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+24px)]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-black/90 px-2 pt-1 backdrop-blur supports-[backdrop-filter]:bg-black/70">
        <Link to="/perfil" aria-label="Voltar" className="press grid h-10 w-10 place-items-center rounded-full text-white hover:bg-[#1a1a1a]">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-[12px] font-bold tracking-[0.22em] text-[#888]">MEUS CRÉDITOS</h1>
        <span className="w-10" />
      </header>

      {!ready ? (
        <div className="mx-4 mt-4 h-40 animate-pulse rounded-3xl border border-[#2a2a2a] bg-[#0f0f0f]" />
      ) : (
        <>
          <section className="px-4">
            <div className="relative overflow-hidden rounded-3xl border border-[#2a2a2a] bg-gradient-to-br from-[#68ed00] via-[#a8d109] to-[#0f0f0f] p-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/70">Saldo atual</div>
              <div className="mt-1 flex items-baseline gap-2">
                <Diamond className="h-7 w-7 text-black" />
                <span className="text-4xl font-black tabular-nums text-black">
                  {isLoading ? "—" : balance?.balance ?? 0}
                </span>
                <span className="text-sm font-bold text-black/70">créditos</span>
              </div>
            </div>
          </section>

          <section className="mx-4 mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#68ed00]">
                <TrendingUp className="h-3.5 w-3.5" /> Recebidos
              </div>
              <div className="mt-1 text-2xl font-extrabold tabular-nums text-white">{balance?.total_earned ?? 0}</div>
            </div>
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#ef4444]">
                <TrendingDown className="h-3.5 w-3.5" /> Usados
              </div>
              <div className="mt-1 text-2xl font-extrabold tabular-nums text-white">{balance?.total_spent ?? 0}</div>
            </div>
          </section>

          <section className="mx-4 mt-4">
            <Link
              to="/comprar-creditos"
              className="press flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#68ed00] text-sm font-bold text-black hover:opacity-90"
            >
              <Plus className="h-5 w-5" /> Comprar mais créditos
            </Link>
          </section>

          <section className="mx-4 mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#888]">Movimentações</h2>
              <Link to="/historico" className="flex items-center gap-1 text-[11px] font-semibold text-[#68ed00]">
                Ver tudo <HistoryIcon className="h-3 w-3" />
              </Link>
            </div>
            {loadingLedger ? (
              <div className="h-32 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" />
            ) : !ledger || ledger.length === 0 ? (
              <div className="grid h-32 place-items-center rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0f0f0f] text-xs text-[#666]">
                Nenhuma movimentação ainda
              </div>
            ) : (
              <ul className="divide-y divide-[#1a1a1a] overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]">
                {ledger.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className={`grid h-9 w-9 place-items-center rounded-full ${e.amount >= 0 ? "bg-[#68ed00]/15 text-[#68ed00]" : "bg-[#ef4444]/15 text-[#ef4444]"}`}>
                      {e.amount >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-white">{ledgerLabel(e.type)}</div>
                      <div className="text-[10px] text-[#666]">{formatDate(e.created_at)}</div>
                    </div>
                    <div className={`text-sm font-bold tabular-nums ${e.amount >= 0 ? "text-[#68ed00]" : "text-white"}`}>
                      {e.amount >= 0 ? "+" : ""}{e.amount}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}