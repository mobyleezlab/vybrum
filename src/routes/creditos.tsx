import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Diamond, Flame, Star, Shirt, Package, Check, Sparkles } from "lucide-react";
import { useCreditBalance, useCreditPackages, usePacks, useUnlockedPacks, formatBRL, type Pack } from "@/lib/credits";
import { useAuth } from "@/lib/auth-context";
import { useUnlockPack } from "@/lib/unlock";

export const Route = createFileRoute("/creditos")({
  head: () => ({ meta: [{ title: "Créditos · Vybrum" }] }),
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
    <div
      className={[
        "relative rounded-2xl border bg-[#0f0f0f] p-4 transition",
        highlight === "best"
          ? "border-[#68ed00] ring-2 ring-[#68ed00]/30"
          : highlight === "popular"
          ? "border-[#68ed00]/60"
          : "border-[#2a2a2a]",
      ].join(" ")}
    >
      {highlight === "best" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#68ed00] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
          <Star className="mr-1 inline h-3 w-3" />
          Melhor custo-benefício
        </div>
      )}
      {highlight === "popular" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1a1a1a] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#68ed00] border border-[#68ed00]/40">
          <Flame className="mr-1 inline h-3 w-3" />
          Popular
        </div>
      )}
      <h3 className="text-sm font-semibold text-white">{pkg.name}</h3>
      <div className="mt-2 flex items-baseline gap-1.5">
        <Diamond className="h-5 w-5 text-[#68ed00]" />
        <span className="text-2xl font-extrabold text-white tabular-nums">{total}</span>
        <span className="text-xs text-[#888]">créditos</span>
      </div>
      {pkg.bonus_credits > 0 && (
        <div className="text-[11px] font-semibold text-[#68ed00]">+{pkg.bonus_credits} bônus</div>
      )}
      <div className="mt-3 text-lg font-extrabold text-white">{formatBRL(Number(pkg.price_brl))}</div>
      <div className="text-[11px] text-[#666]">{formatBRL(perCredit)} / crédito</div>
      <button
        onClick={() => alert("Compra em breve!")}
        className="press mt-4 w-full rounded-xl bg-[#68ed00] py-2.5 text-sm font-bold text-black hover:opacity-90"
      >
        Comprar
      </button>
    </div>
  );
}

function PackCard({ pack, unlocked }: { pack: Pack; unlocked: boolean }) {
  const unlock = useUnlockPack();
  const isPending = unlock.isPending;
  return (
    <div className="overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]">
      <div className="relative" style={{ aspectRatio: "16 / 9" }}>
        {pack.thumbnail_url ? (
          <img src={pack.thumbnail_url} alt={pack.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[#0f0f0f] text-[#333]">
            <Package className="h-10 w-10" />
          </div>
        )}
        {pack.discount_pct ? (
          <span className="absolute right-2 top-2 rounded-full bg-[#68ed00] px-2 py-0.5 text-[10px] font-bold text-black">
            {pack.discount_pct}% OFF
          </span>
        ) : null}
      </div>
      <div className="border-t border-[#2a2a2a] p-3">
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#888]">
          <Package className="h-3 w-3" /> Pack
        </div>
        <div className="mt-0.5 truncate text-[13px] font-semibold text-white">{pack.name}</div>
        {pack.description && (
          <p className="mt-1 line-clamp-2 text-[11px] text-[#888]">{pack.description}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[12px] font-bold text-[#68ed00]">
            <Diamond className="h-3.5 w-3.5" /> {pack.cost_credits}
          </div>
          <button
            onClick={() => { if (!unlocked && !isPending) unlock.mutate(pack.id); }}
            disabled={unlocked || isPending}
            className="press rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {unlocked ? "Desbloqueado" : isPending ? "Processando…" : "Desbloquear"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreditosPage() {
  const { user } = useAuth();
  const { data: balance } = useCreditBalance();
  const { data: packages, isLoading: loadingPackages } = useCreditPackages();
  const { data: packs, isLoading: loadingPacks } = usePacks();
  const { data: unlockedPackIds } = useUnlockedPacks();

  const bestId = packages?.[Math.floor((packages.length - 1) / 2) + 1]?.id;
  const popularId = packages?.[1]?.id;

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+12px)]">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-black/90 px-2 pt-1 backdrop-blur supports-[backdrop-filter]:bg-black/70">
        <Link
          to="/"
          aria-label="Voltar"
          className="press grid h-10 w-10 place-items-center rounded-full text-white hover:bg-[#1a1a1a]"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-[12px] font-bold tracking-[0.22em] text-[#888]">CRÉDITOS</h1>
        <span className="w-10" />
      </header>

      {/* Balance card */}
      <section className="px-4">
        <div className="relative overflow-hidden rounded-3xl bg-[#68ed00] p-5">
          <div className="relative">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/70">
              Seu saldo
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <Diamond className="h-7 w-7 text-black" />
              <span className="text-4xl font-black tabular-nums text-black">
                {user ? balance?.balance ?? 0 : 0}
              </span>
              <span className="text-sm font-semibold text-black/70">créditos</span>
            </div>
            {!user && (
              <Link
                to="/login"
                className="press mt-3 inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-[12px] font-bold text-[#68ed00]"
              >
                Entrar para ver saldo
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mt-5 px-4">
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#68ed00]">
            <Sparkles className="h-3.5 w-3.5" /> O que você desbloqueia
          </div>
          <ul className="mt-3 grid gap-2 text-[13px] text-white">
            {[
              "Exportar SVG / PDF / PNG HD (modelos free)",
              "Desbloquear modelos Pro, Premium, Elite e Rare",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#68ed00]" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Packages */}
      <section className="mt-6 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold tracking-tight text-white">Pacotes</h2>
          <span className="text-[11px] font-semibold text-[#666]">Pague uma vez, use sempre</span>
        </div>
        {loadingPackages ? (
          <div className="mt-3 grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]"
              />
            ))}
          </div>
        ) : (packages?.length ?? 0) === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0f0f0f] p-6 text-center">
            <p className="text-sm font-semibold text-white">Pacotes em breve</p>
            <p className="mt-1 text-xs text-[#888]">Em breve novos pacotes estarão disponíveis.</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {(packages ?? []).map((p) => {
              const highlight =
                Number(p.price_brl) === 19.9 || p.id === bestId
                  ? ("best" as const)
                  : Number(p.price_brl) === 9.9 || p.id === popularId
                  ? ("popular" as const)
                  : undefined;
              return <PackageCard key={p.id} pkg={p} highlight={highlight} />;
            })}
          </div>
        )}
      </section>

      {/* Packs */}
      <section className="mt-8 px-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-white">
            <Flame className="h-4 w-4 text-[#68ed00]" /> Packs
          </h2>
          <span className="text-[11px] font-semibold text-[#666]">Combos com desconto</span>
        </div>
        {loadingPacks ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]"
              />
            ))}
          </div>
        ) : (packs?.length ?? 0) === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0f0f0f] p-6 text-center">
            <p className="text-sm font-semibold text-white">Nenhum pack disponível</p>
            <p className="mt-1 text-xs text-[#888]">Volte em breve para conferir novidades.</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(packs ?? []).map((p) => (
              <PackCard key={p.id} pack={p} unlocked={(unlockedPackIds ?? []).includes(p.id)} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 px-4">
        <Link
          to="/"
          className="press flex w-full items-center justify-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] py-3 text-sm font-semibold text-white hover:border-[#68ed00] hover:text-[#68ed00]"
        >
          <Shirt className="h-4 w-4" /> Ver catálogo
        </Link>
      </div>
    </div>
  );
}