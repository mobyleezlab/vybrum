import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Coins, Flame, Star, Lock, Shirt } from "lucide-react";
import { useCreditBalance, useCreditPackages, formatBRL } from "@/lib/credits";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/creditos")({
  head: () => ({ meta: [{ title: "Créditos · Onzee Lab" }] }),
  component: CreditosPage,
});

function PackageCard({
  pkg, highlight,
}: {
  pkg: { id: string; name: string; credits: number; bonus_credits: number; total_credits: number | null; price_brl: number };
  highlight?: "best" | "popular";
}) {
  const total = pkg.total_credits ?? pkg.credits + pkg.bonus_credits;
  const perCredit = pkg.price_brl / Math.max(1, total);
  return (
    <div className={[
      "relative rounded-2xl border bg-white p-4 shadow-sm transition",
      highlight === "best" ? "border-[#2196F3] ring-2 ring-[#2196F3]/30" :
      highlight === "popular" ? "border-amber-400 ring-2 ring-amber-300/40" :
      "border-neutral-200",
    ].join(" ")}>
      {highlight === "best" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2196F3] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
          <Star className="mr-1 inline h-3 w-3" />Melhor custo-benefício
        </div>
      )}
      {highlight === "popular" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
          <Flame className="mr-1 inline h-3 w-3" />Popular
        </div>
      )}
      <h3 className="text-sm font-semibold text-neutral-900">{pkg.name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <Coins className="h-5 w-5 text-amber-500" />
        <span className="text-2xl font-bold text-neutral-900 tabular-nums">{total}</span>
        <span className="text-xs text-neutral-500">créditos</span>
      </div>
      {pkg.bonus_credits > 0 && (
        <div className="text-[11px] font-medium text-emerald-600">+{pkg.bonus_credits} bônus</div>
      )}
      <div className="mt-3 text-lg font-bold text-neutral-900">{formatBRL(Number(pkg.price_brl))}</div>
      <div className="text-[11px] text-neutral-500">
        {formatBRL(perCredit)} / crédito
      </div>
      <button
        onClick={() => alert("Compra em breve!")}
        className="mt-4 w-full rounded-xl bg-[#2196F3] py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        Comprar
      </button>
    </div>
  );
}

function CreditosPage() {
  const { user, loading } = useAuth();
  const { data: balance } = useCreditBalance();
  const { data: packages, isLoading: loadingPackages } = useCreditPackages();

  if (!loading && !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-100 px-6 text-center">
        <div>
          <Lock className="mx-auto h-8 w-8 text-neutral-400" />
          <h1 className="mt-3 text-lg font-semibold">Entre para ver seus créditos</h1>
          <Link to="/login" search={{ redirect: "/creditos" }}
            className="mt-4 inline-block rounded-xl bg-[#2196F3] px-5 py-2.5 text-sm font-semibold text-white">
            Fazer login
          </Link>
        </div>
      </div>
    );
  }

  const bestId = packages?.[Math.floor((packages.length - 1) / 2) + 1]?.id;
  const popularId = packages?.[1]?.id;

  return (
    <div className="min-h-screen bg-neutral-100 pb-12 md:py-6">
      <div className="mx-auto max-w-[460px] bg-white px-4 pb-10 pt-3 md:rounded-3xl md:shadow-xl md:ring-1 md:ring-neutral-200">
        <header className="flex h-12 items-center justify-between">
          <Link to="/" aria-label="Voltar" className="grid h-10 w-10 place-items-center rounded-full hover:bg-neutral-100">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-[13px] font-medium tracking-[0.18em] text-neutral-500">CRÉDITOS</h1>
          <span className="w-10" />
        </header>

        <div className="mt-2 rounded-2xl bg-gradient-to-br from-[#2196F3] to-[#8B00E8] p-5 text-white shadow-lg">
          <div className="text-xs uppercase tracking-widest opacity-80">Seu saldo</div>
          <div className="mt-1 flex items-baseline gap-2">
            <Coins className="h-7 w-7" />
            <span className="text-4xl font-bold tabular-nums">{balance?.balance ?? 0}</span>
            <span className="text-sm opacity-80">créditos</span>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Pacotes</h2>
          {loadingPackages ? (
            <div className="mt-3 grid gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-neutral-200" />
              ))}
            </div>
          ) : (
            <div className="mt-3 grid gap-4">
              {(packages ?? []).map((p) => {
                const highlight =
                  Number(p.price_brl) === 19.9 || p.id === bestId ? "best" as const :
                  Number(p.price_brl) === 9.9 || p.id === popularId ? "popular" as const :
                  undefined;
                return <PackageCard key={p.id} pkg={p} highlight={highlight} />;
              })}
            </div>
          )}
        </section>

        <Link
          to="/"
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-700 hover:border-[#2196F3] hover:text-[#2196F3]"
        >
          <Shirt className="h-4 w-4" /> Ver catálogo
        </Link>
      </div>
    </div>
  );
}