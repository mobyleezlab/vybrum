import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useModels, categoryBadge, type ModelRow } from "@/lib/models";

export const Route = createFileRoute("/explorar")({
  head: () => ({ meta: [{ title: "Explorar · Vybrum" }] }),
  component: ExplorarPage,
});

const FILTERS = ["todos", "free", "pro", "premium", "elite", "rare"] as const;

function ExplorarPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("todos");
  const { data: models, isLoading } = useModels();

  const list = useMemo<ModelRow[]>(() => {
    let xs = models ?? [];
    if (filter !== "todos") xs = xs.filter((m) => (m.category ?? "free").toLowerCase() === filter);
    if (q.trim()) {
      const t = q.toLowerCase();
      xs = xs.filter((m) => m.name.toLowerCase().includes(t) || m.code.toLowerCase().includes(t));
    }
    return xs;
  }, [models, filter, q]);

  return (
    <div className="pt-safe pb-[calc(64px+env(safe-area-inset-bottom)+24px)]">
      <header className="px-4 pt-3 pb-2">
        <h1 className="text-[22px] font-extrabold tracking-tight text-white">Explorar</h1>
      </header>

      <div className="mx-4 mt-2 flex h-12 items-center gap-2 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] px-4">
        <Search className="h-4 w-4 text-[#666]" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar modelo..."
          className="flex-1 bg-transparent text-sm text-white placeholder:text-[#444] outline-none"
        />
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="press shrink-0 h-9 rounded-full px-4 text-[12px] font-semibold capitalize"
              style={{
                background: active ? "#cffc0b" : "#1a1a1a",
                color: active ? "#000" : "#888",
                border: active ? "none" : "1px solid #2a2a2a",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 px-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]" style={{ aspectRatio: "4 / 5.6" }} />
            ))
          : list.map((m) => {
              const badge = categoryBadge(m.category);
              return (
                <Link key={m.code} to="/editor" search={{ model: m.code }} className="press block overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f]">
                  <div className="relative" style={{ aspectRatio: "4 / 5" }}>
                    {m.thumbnail_url ? (
                      <img src={m.thumbnail_url} alt={m.name} className="h-full w-full object-contain p-3" loading="lazy" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-[#222]">—</div>
                    )}
                    <span className={`absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${badge.className}`}>{badge.label}</span>
                  </div>
                  <div className="border-t border-[#2a2a2a] px-3 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#666]">{m.code}</div>
                    <div className="mt-0.5 truncate text-[12px] font-semibold text-white">{m.name}</div>
                  </div>
                </Link>
              );
            })}
      </div>

      {!isLoading && list.length === 0 && (
        <p className="mt-10 text-center text-sm text-[#888]">Nenhum modelo encontrado.</p>
      )}
    </div>
  );
}
