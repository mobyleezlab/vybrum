import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Diamond, Flame, Package, Sparkles, ArrowRight, Shirt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { categoryBadge, type ModelRow } from "@/lib/models";
import { listModelsHomeSections, type HomeSectionKey } from "@/lib/catalog.functions";
import { usePacks, type Pack } from "@/lib/credits";
import { SITE_URL } from "@/lib/site";

const HOME_DESCRIPTION =
  "Vybrum é o app para criar, personalizar e exportar uniformes esportivos direto do celular.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vybrum" },
      { name: "description", content: HOME_DESCRIPTION },
      { property: "og:title", content: "Vybrum" },
      { property: "og:description", content: HOME_DESCRIPTION },
      { property: "og:url", content: `${SITE_URL}/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),
  component: HomePage,
});

type SectionKey = HomeSectionKey;

const SECTIONS: { key: SectionKey; label: string; isRare?: boolean }[] = [
  { key: "free", label: "Free" },
  { key: "pro", label: "Pro" },
  { key: "premium", label: "Premium" },
  { key: "elite", label: "Elite" },
  { key: "rare", label: "Rare — Tempo limitado", isRare: true },
];

const MAX_PER_SECTION = 6;

function ModelCard({ m }: { m: ModelRow }) {
  const badge = categoryBadge(m.category);
  const isRare = (m.category ?? "").toLowerCase() === "rare" || m.is_limited;
  const expired = !!m.is_expired;

  return (
    <Link
      to="/editor"
      search={{ model: m.code }}
      className="press group block w-[150px] shrink-0"
    >
      <div className="relative overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]">
        {/* 4:5 thumbnail */}
        <div className="relative" style={{ aspectRatio: "4 / 5" }}>
          {m.thumbnail_url ? (
            <img
              src={m.thumbnail_url}
              alt={m.name}
              loading="lazy"
              className="h-full w-full object-contain p-3"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-[#222]">
              <Diamond className="h-8 w-8" />
            </div>
          )}
          <span
            className={`absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${badge.className}`}
          >
            {badge.label}
          </span>
          {isRare && m.days_remaining != null && m.days_remaining > 0 && !expired && (
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
              <span className="vy-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
              {m.days_remaining}d
            </span>
          )}
          {expired && (
            <div className="absolute inset-0 grid place-items-center bg-black/70">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Esgotado
              </span>
            </div>
          )}
        </div>
        <div className="border-t border-[#2a2a2a] px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#666]">{m.code}</div>
          <div className="mt-0.5 truncate text-[12px] font-semibold text-white">{m.name}</div>
        </div>
      </div>
    </Link>
  );
}

function PackCard({ pack }: { pack: Pack }) {
  return (
    <Link
      to="/creditos"
      className="press block w-[280px] shrink-0 overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]"
    >
      <div className="relative" style={{ aspectRatio: "16 / 9" }}>
        {pack.thumbnail_url ? (
          <img src={pack.thumbnail_url} alt={pack.name} className="h-full w-full object-cover" />
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
      <div className="border-t border-[#2a2a2a] px-3 py-2.5">
        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">
          <Package className="h-3 w-3" /> Pack
        </div>
        <div className="mt-0.5 truncate text-[13px] font-semibold text-white">{pack.name}</div>
        <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#68ed00]">
          <Diamond className="h-3 w-3" /> {pack.cost_credits} cr
        </div>
      </div>
    </Link>
  );
}

function SectionRow({
  label,
  isRare,
  items,
  loading,
}: {
  label: string;
  isRare?: boolean;
  items: ModelRow[];
  loading: boolean;
}) {
  if (!loading && items.length === 0) return null;
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between px-4">
        <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-white">
          {isRare && (
            <span className="vy-dot inline-block h-2 w-2 rounded-full bg-red-500" aria-hidden />
          )}
          {label}
        </h2>
        <Link to="/explorar" className="text-[12px] font-semibold text-[#68ed00] press">
          Ver todos
        </Link>
      </div>
      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-[150px] shrink-0 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]"
                style={{ aspectRatio: "4 / 5.6" }}
              />
            ))
          : items.slice(0, MAX_PER_SECTION).map((m) => <ModelCard key={m.code} m={m} />)}
      </div>
    </section>
  );
}

function PacksRow({ packs, loading }: { packs: Pack[]; loading: boolean }) {
  if (!loading && packs.length === 0) return null;
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between px-4">
        <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-white">
          <Flame className="h-4 w-4 text-[#68ed00]" /> Packs
        </h2>
        <Link to="/creditos" className="text-[12px] font-semibold text-[#68ed00] press">
          Ver todos
        </Link>
      </div>
      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="w-[280px] shrink-0 animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]"
                style={{ aspectRatio: "16 / 11" }}
              />
            ))
          : packs.map((p) => <PackCard key={p.id} pack={p} />)}
      </div>
    </section>
  );
}

function HomePage() {
  return <HomeContent />;
}

function FeaturedHero() {
  return (
    <section className="px-4 pt-1">
      <Link
        to="/editor"
        className="press relative block overflow-hidden rounded-3xl bg-[#68ed00]"
      >
        <div className="relative grid gap-3 p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#68ed00]">
              <Sparkles className="h-3 w-3" /> Em destaque
            </span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-black">
              MODELO VY001
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <div>
              <h2 className="text-[26px] font-black leading-[1.05] tracking-tight text-black">
                Crie seu uniforme<br />em segundos
              </h2>
              <p className="mt-2 max-w-[200px] text-[12px] font-semibold text-black/70">
                Personalize cores, escudo, nomes e número direto no app.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-[12px] font-bold text-[#68ed00]">
                Abrir editor <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="grid h-24 w-24 place-items-center rounded-2xl bg-black/85 text-[#68ed00] shadow-lg">
              <Shirt className="h-12 w-12" />
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

function HomeContent() {
  const fetchSections = useServerFn(listModelsHomeSections);
  const { data: grouped, isLoading: loadingModels } = useQuery({
    queryKey: ["models", "home-sections"],
    queryFn: () => fetchSections({ data: { perSection: MAX_PER_SECTION } }),
    staleTime: 60_000,
  });
  const { data: packs, isLoading: loadingPacks } = usePacks();
  const totalModels =
    (grouped?.free.length ?? 0) +
    (grouped?.pro.length ?? 0) +
    (grouped?.premium.length ?? 0) +
    (grouped?.elite.length ?? 0) +
    (grouped?.rare.length ?? 0);

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+12px)]">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-black/90 px-4 pt-2 pb-3 backdrop-blur supports-[backdrop-filter]:bg-black/70">
        <Link to="/" className="text-[22px] font-extrabold tracking-tight text-white">
          VYBRUM
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/creditos"
            aria-label="Meus créditos: 0"
            className="press flex h-9 items-center gap-1.5 rounded-full bg-[#1a1a1a] px-3 text-[12px] font-semibold text-white border border-[#2a2a2a]"
          >
            <Diamond aria-hidden="true" className="h-3.5 w-3.5 text-[#68ed00]" /> 0
          </Link>
          <button
            aria-label="Notificações"
            className="press grid h-9 w-9 place-items-center rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-white"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </header>

      <FeaturedHero />

      {SECTIONS.map((s) => (
        <SectionRow
          key={s.key}
          label={s.label}
          isRare={s.isRare}
          items={grouped?.[s.key] ?? []}
          loading={loadingModels}
        />
      ))}

      <PacksRow packs={packs ?? []} loading={loadingPacks} />

      {!loadingModels && totalModels === 0 && (
        <div className="mx-4 mt-10 rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0f0f0f] p-6 text-center">
          <p className="text-sm font-semibold text-white">Nenhum modelo disponível ainda</p>
          <p className="mt-1 text-xs text-[#888]">
            O catálogo aparecerá aqui assim que estiver pronto.
          </p>
        </div>
      )}
    </div>
  );
}
