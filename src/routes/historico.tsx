import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Diamond, Shirt, ShoppingBag, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useCreditLedger, useUnlockedTemplates, ledgerLabel } from "@/lib/history";
import { useRequireAuth } from "@/lib/use-require-auth";

export const Route = createFileRoute("/historico")({
  ssr: false,
  head: () => ({ meta: [{ title: "Histórico · Vybrum" }] }),
  component: HistoricoPage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

type Tab = "movimentacoes" | "desbloqueios";

function HistoricoPage() {
  const { ready } = useRequireAuth();
  const [tab, setTab] = useState<Tab>("movimentacoes");
  const { data: ledger, isLoading: loadingLedger } = useCreditLedger(100);
  const { data: unlocks, isLoading: loadingUnlocks } = useUnlockedTemplates();

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+24px)]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-black/90 px-2 pt-1 backdrop-blur supports-[backdrop-filter]:bg-black/70">
        <Link to="/perfil" aria-label="Voltar" className="press grid h-10 w-10 place-items-center rounded-full text-white hover:bg-[#1a1a1a]">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-[12px] font-bold tracking-[0.22em] text-[#888]">HISTÓRICO</h1>
        <span className="w-10" />
      </header>

      <div className="mx-4 mt-2 flex gap-1 rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-1">
        {([
          { id: "movimentacoes", label: "Créditos" },
          { id: "desbloqueios", label: "Desbloqueios" },
        ] as const).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`press flex-1 rounded-xl py-2 text-xs font-bold transition ${
              tab === t.id ? "bg-[#68ed00] text-black" : "text-[#888]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!ready ? (
        <div className="mx-4 mt-4 h-40 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" />
      ) : tab === "movimentacoes" ? (
        <section className="mx-4 mt-4">
          {loadingLedger ? (
            <div className="h-40 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" />
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
                    {e.description && <div className="truncate text-[11px] text-[#888]">{e.description}</div>}
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
      ) : (
        <section className="mx-4 mt-4">
          {loadingUnlocks ? (
            <div className="h-40 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" />
          ) : !unlocks || unlocks.length === 0 ? (
            <div className="grid h-32 place-items-center rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0f0f0f] text-xs text-[#666]">
              Você ainda não desbloqueou templates
            </div>
          ) : (
            <ul className="divide-y divide-[#1a1a1a] overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]">
              {unlocks.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#68ed00]/15 text-[#68ed00]">
                    {u.unlock_type === "purchased" ? <ShoppingBag className="h-4 w-4" /> : <Shirt className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-white">{u.model_code}</div>
                    <div className="text-[10px] text-[#666]">{formatDate(u.created_at)} · {u.unlock_type}</div>
                  </div>
                  {u.credits_spent > 0 && (
                    <div className="flex items-center gap-1 text-xs font-bold text-white">
                      <Diamond className="h-3.5 w-3.5 text-[#68ed00]" /> {u.credits_spent}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}