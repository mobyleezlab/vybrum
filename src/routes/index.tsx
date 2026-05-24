import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Coins, Lock, Flame, Sparkles, Package } from "lucide-react";
import { useModels, categoryBadge, canUseModel, type ModelRow } from "@/lib/models";
import { usePacks } from "@/lib/credits";
import { useAuth, getInitials } from "@/lib/auth-context";
import { CreditBadge } from "@/components/CreditBadge";
import { UnlockSheet } from "@/components/UnlockSheet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Onzee Lab" },
      { name: "application-name", content: "Onzee Lab" },
      { name: "description", content: "Onzee Lab — crie e personalize uniformes esportivos direto do celular." },
    ],
  }),
  component: CatalogPage,
});

type FilterId = "todos" | "free" | "pro" | "premium" | "elite" | "rare" | "packs";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "free", label: "Free" },
  { id: "pro", label: "Pro" },
  { id: "premium", label: "Premium" },
  { id: "elite", label: "Elite" },
  { id: "rare", label: "Rare" },
  { id: "packs", label: "Packs" },
];

function ModelCard({ m, onLocked }: { m: ModelRow; onLocked: () => void }) {
  const badge = categoryBadge(m.category);
  const usable = canUseModel(m);
  const cat = (m.category ?? "free").toLowerCase();
  const expired = !!m.is_expired;
  const isRare = cat === "rare" || cat === "limited" || m.is_limited;

  const inner = (
    <div
      className={[
        "relative overflow-hidden rounded-xl border bg-white shadow-sm transition",
        expired ? "opacity-60 grayscale" : "hover:border-[#2196F3] hover:shadow-md",
        "border-neutral-200",
      ].join(" ")}
    >
      <div className="relative aspect-square w-full bg-neutral-100">
        {m.thumbnail_url ? (
          <img src={m.thumbnail_url} alt={m.name} className="h-full w-full object-contain" />
        ) : (
          <div className="grid h-full w-full place-items-center text-neutral-300">
            <Sparkles className="h-8 w-8" />
          </div>
        )}
        <span className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[9px] font-bold leading-none ${badge.className}`}>
          {badge.label}
        </span>
        {!usable && !expired && (
          <div className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/60">
            <Lock className="h-3 w-3 text-white" />
          </div>
        )}
        {isRare && m.days_remaining != null && m.days_remaining > 0 && !expired && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            <Flame className="h-3 w-3" /> {m.days_remaining}d
          </span>
        )}
        {expired && (
          <div className="absolute inset-0 grid place-items-center bg-black/50">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-900">
              Esgotado
            </span>
          </div>
        )}
      </div>
      <div className="px-2 py-2">
        <div className="truncate text-[11px] font-semibold text-neutral-800">{m.name}</div>
        {usable ? (
          <div className="text-[10px] font-medium text-emerald-600">Personalizar</div>
        ) : m.unlock_cost ? (
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700">
            <Coins className="h-3 w-3" /> {m.unlock_cost} cr
          </div>
        ) : (
          <div className="text-[10px] text-neutral-400">Bloqueado</div>
        )}
      </div>
    </div>
  );

  if (expired) {
    return <div className="block">{inner}</div>;
  }
  if (usable) {
    return (
      <Link to="/editor" search={{ model: m.code }} className="block">
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onLocked} className="block w-full text-left">
      {inner}
    </button>
  );
}

function PackCard({
  pack,
  onLocked,
}: {
  pack: ReturnType<typeof usePacks>["data"] extends Array<infer T> | undefined ? T : never;
  onLocked: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onLocked}
      className="col-span-2 overflow-hidden rounded-xl border border-neutral-200 bg-white p-3 text-left shadow-sm transition hover:border-[#2196F3] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-600">
            <Package className="h-3 w-3" /> Pack
          </div>
          <div className="mt-0.5 truncate text-sm font-semibold text-neutral-900">{pack.name}</div>
        </div>
        {pack.discount_pct ? (
          <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            {pack.discount_pct}% OFF
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1">
        {pack.pack_items.slice(0, 5).map((it) => (
          <div key={it.id} className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-neutral-100 text-[9px] font-semibold text-neutral-500">
            {it.model_code}
          </div>
        ))}
        {pack.pack_items.length > 5 && (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-neutral-100 text-[10px] font-semibold text-neutral-500">
            +{pack.pack_items.length - 5}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-[10px] text-neutral-400 line-through">{pack.original_value} cr</div>
        <div className="flex items-center gap-1 text-sm font-bold text-neutral-900">
          <Coins className="h-3.5 w-3.5 text-amber-500" /> {pack.cost_credits}
        </div>
      </div>
    </button>
  );
}

function CatalogPage() {
  const { user, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [filter, setFilter] = useState<FilterId>("todos");
  const [unlockOpen, setUnlockOpen] = useState(false);
  const { data: models, isLoading: loadingModels } = useModels();
  const { data: packs, isLoading: loadingPacks } = usePacks();

  const filteredModels = useMemo<ModelRow[]>(() => {
    if (!models) return [];
    let list = [...models];
    if (filter !== "todos" && filter !== "packs") {
      list = list.filter((m) => (m.category ?? "free").toLowerCase() === filter);
    }
    if (filter === "todos") {
      list.sort((a, b) => {
        const ar = (a.category ?? "").toLowerCase() === "rare" || a.is_limited;
        const br = (b.category ?? "").toLowerCase() === "rare" || b.is_limited;
        if (ar && !br) return -1;
        if (!ar && br) return 1;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });
    }
    return list;
  }, [models, filter]);

  const showPacks = filter === "todos" || filter === "packs";
  const showModels = filter !== "packs";

  return (
    <div className="min-h-screen bg-neutral-100 md:py-6">
      <div className="mx-auto max-w-[460px] bg-white px-4 pb-6 pt-3 md:rounded-3xl md:shadow-xl md:ring-1 md:ring-neutral-200">
        <header className="flex h-12 items-center justify-between">
          <Link to="/" className="text-base font-extrabold tracking-tight text-neutral-900">
            Onzee <span className="text-[#2196F3]">Lab</span>
          </Link>
          <div className="flex items-center gap-1">
            <CreditBadge />
            {user ? (
              <div className="relative">
                <button
                  aria-label="Conta"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-[#2196F3] text-[11px] font-semibold text-white"
                >
                  {getInitials(user)}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-11 z-40 w-44 rounded-xl border border-neutral-200 bg-white p-1 shadow-lg">
                    <div className="px-3 py-2 text-[11px] text-neutral-500 truncate">{user.email}</div>
                    <Link
                      to="/creditos"
                      onClick={() => setUserMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-neutral-100"
                    >
                      Meus créditos
                    </Link>
                    <button
                      onClick={async () => { setUserMenuOpen(false); await signOut(); }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-100"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                search={{ redirect: "/" }}
                className="ml-1 rounded-full bg-[#2196F3] px-3 py-1.5 text-xs font-semibold text-white"
              >
                Entrar
              </Link>
            )}
          </div>
        </header>

        <div className="mt-3 -mx-1 overflow-x-auto">
          <div className="flex gap-2 px-1">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={[
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {!user && (
          <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center">
            <p className="text-sm text-neutral-600">Entre para ver e personalizar os modelos.</p>
            <Link
              to="/login"
              search={{ redirect: "/" }}
              className="mt-2 inline-block rounded-full bg-[#2196F3] px-4 py-1.5 text-xs font-semibold text-white"
            >
              Fazer login
            </Link>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          {showPacks && !loadingPacks && (packs ?? []).map((p) => (
            <PackCard key={p.id} pack={p} onLocked={() => setUnlockOpen(true)} />
          ))}
          {showModels && loadingModels &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-neutral-200" />
            ))}
          {showModels && !loadingModels && filteredModels.map((m) => (
            <ModelCard key={m.code} m={m} onLocked={() => setUnlockOpen(true)} />
          ))}
          {!loadingModels && !loadingPacks && showModels && filteredModels.length === 0 && (!showPacks || (packs ?? []).length === 0) && (
            <div className="col-span-3 py-10 text-center text-sm text-neutral-400">
              Nenhum modelo nesta categoria.
            </div>
          )}
        </div>

        <footer className="mt-8 flex flex-col items-center gap-2 border-t border-neutral-100 pt-4 text-[11px] text-neutral-500">
          <div className="font-semibold text-neutral-700">Onzee Lab</div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <a href="/privacidade" className="underline hover:text-neutral-900">
              Política de Privacidade
            </a>
            <span className="text-neutral-300">·</span>
            <a href="/termos" className="underline hover:text-neutral-900">
              Termos de Uso
            </a>
          </div>
        </footer>
      </div>

      <UnlockSheet open={unlockOpen} onClose={() => setUnlockOpen(false)} />
    </div>
  );
}