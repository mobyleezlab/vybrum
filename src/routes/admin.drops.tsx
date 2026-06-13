import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Loader2,
  Search,
  Sparkles,
  Clock,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Diamond,
  Users,
  Package,
  Calendar,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminListDrops,
  adminUpdateDropLifecycle,
  type AdminDrop,
  type DropStatus,
} from "@/lib/admin-drops.functions";

export const Route = createFileRoute("/admin/drops")({
  ssr: false,
  component: Page,
});

type StatusFilter = "all" | DropStatus;
type SortKey = "recent" | "unlocks" | "revenue" | "ending";

const STATUS_META: Record<DropStatus, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  live: { label: "Ao vivo", color: "#68ed00", bg: "#68ed0014", border: "#68ed0044", icon: CheckCircle2 },
  scheduled: { label: "Agendado", color: "#60a5fa", bg: "#60a5fa14", border: "#60a5fa44", icon: Clock },
  ended: { label: "Encerrado", color: "#f59e0b", bg: "#f59e0b14", border: "#f59e0b44", icon: XCircle },
  inactive: { label: "Inativo", color: "#888", bg: "#1a1a1a", border: "#2a2a2a", icon: PauseCircle },
};

function Page() {
  const listFn = useServerFn(adminListDrops);
  const q = useQuery({ queryKey: ["admin", "drops"], queryFn: () => listFn() });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const filtered = useMemo(() => {
    let list = q.data?.drops ?? [];
    if (status !== "all") list = list.filter((d) => d.status === status);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(s) || d.category.toLowerCase().includes(s));
    }
    list = [...list];
    if (sort === "unlocks") list.sort((a, b) => b.unlocks_count - a.unlocks_count);
    else if (sort === "revenue") list.sort((a, b) => b.credits_revenue - a.credits_revenue);
    else if (sort === "ending") {
      list.sort((a, b) => {
        const ax = a.available_until ? new Date(a.available_until).getTime() : Number.POSITIVE_INFINITY;
        const bx = b.available_until ? new Date(b.available_until).getTime() : Number.POSITIVE_INFINITY;
        return ax - bx;
      });
    } else list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return list;
  }, [q.data, status, search, sort]);

  const totals = q.data?.totals;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <Kpi label="Total" value={totals?.total ?? 0} icon={Sparkles} />
        <Kpi label="Ao vivo" value={totals?.live ?? 0} icon={CheckCircle2} accent="#68ed00" />
        <Kpi label="Encerrados" value={totals?.ended ?? 0} icon={XCircle} accent="#f59e0b" />
        <Kpi label="Inativos" value={totals?.inactive ?? 0} icon={PauseCircle} />
        <Kpi label="Unlocks" value={totals?.unlocks ?? 0} icon={Users} />
        <Kpi label="Créditos" value={totals?.credits_revenue ?? 0} icon={Diamond} accent="#68ed00" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar campanha…"
            className="h-10 w-full rounded-lg border border-[#2a2a2a] bg-[#161616] pl-9 pr-3 text-sm text-white"
          />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="h-10 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 text-sm text-white">
          <option value="all">Todos status</option>
          <option value="live">Ao vivo</option>
          <option value="ended">Encerrado</option>
          <option value="inactive">Inativo</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-10 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 text-sm text-white">
          <option value="recent">Mais recentes</option>
          <option value="unlocks">Mais unlocks</option>
          <option value="revenue">Maior receita</option>
          <option value="ending">Encerrando antes</option>
        </select>
        <Link to="/admin/creditos"
          className="press inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 text-xs font-bold text-white">
          <Package className="h-3.5 w-3.5" /> Criar / editar drop
        </Link>
      </div>

      {q.isError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-100">
          <ShieldAlert className="mt-0.5 h-4 w-4 text-red-300" />
          <p>{q.error instanceof Error ? q.error.message : "Erro ao carregar drops."}</p>
        </div>
      )}

      {q.isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#888]" /></div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-[#2a2a2a] py-16 text-center">
          <Sparkles className="h-8 w-8 text-[#444]" />
          <p className="mt-2 text-sm text-[#888]">Nenhum drop encontrado.</p>
          <Link to="/admin/creditos" className="mt-3 text-xs font-bold text-[#68ed00] underline">Criar um drop</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => <DropCard key={d.id} drop={d} />)}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, icon: Icon, accent }: { label: string; value: number; icon: typeof Sparkles; accent?: string }) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase text-[#888]">
        <Icon className="h-3.5 w-3.5" style={accent ? { color: accent } : undefined} />
        {label}
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums text-white">{value.toLocaleString("pt-BR")}</div>
    </div>
  );
}

function DropCard({ drop }: { drop: AdminDrop }) {
  const qc = useQueryClient();
  const updateFn = useServerFn(adminUpdateDropLifecycle);
  const meta = STATUS_META[drop.status];
  const StatusIcon = meta.icon;

  const [openSchedule, setOpenSchedule] = useState(false);
  const [until, setUntil] = useState<string>(drop.available_until ? toLocalInput(drop.available_until) : "");

  const update = useMutation({
    mutationFn: (payload: { id: string; is_active?: boolean; available_until?: string | null; is_limited?: boolean; sort_order?: number | null }) => updateFn({ data: payload }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "drops"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = () => {
    update.mutate({ id: drop.id, is_active: !drop.is_active });
    toast.success(drop.is_active ? "Drop desativado." : "Drop ativado.");
  };

  const saveSchedule = () => {
    const iso = until ? new Date(until).toISOString() : null;
    update.mutate({ id: drop.id, available_until: iso, is_limited: !!iso });
    setOpenSchedule(false);
    toast.success(iso ? "Encerramento agendado." : "Sem prazo de encerramento.");
  };

  const clearSchedule = () => {
    setUntil("");
    update.mutate({ id: drop.id, available_until: null, is_limited: false });
    setOpenSchedule(false);
    toast.success("Prazo removido.");
  };

  const conversionEstimate = drop.original_value > 0 ? Math.round((1 - drop.cost_credits / drop.original_value) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0f0f0f]">
      <div className="relative aspect-[16/9] bg-[#161616]">
        {drop.thumbnail_url ? (
          <img src={drop.thumbnail_url} alt={drop.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full place-items-center text-[#333]"><Sparkles className="h-10 w-10" /></div>
        )}
        <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase"
          style={{ borderColor: meta.border, background: meta.bg, color: meta.color }}>
          <StatusIcon className="h-3 w-3" /> {meta.label}
        </div>
        {drop.discount_pct ? (
          <div className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
            -{drop.discount_pct}%
          </div>
        ) : conversionEstimate > 0 ? (
          <div className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
            -{conversionEstimate}%
          </div>
        ) : null}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">{drop.name}</div>
            <div className="text-[10px] uppercase text-[#666]">{drop.category}</div>
          </div>
          <div className="flex items-center gap-1 rounded-md bg-[#161616] px-2 py-1 text-[11px] font-bold text-[#68ed00]">
            <Diamond className="h-3 w-3" /> {drop.cost_credits}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
          <Mini label="Itens" value={drop.items_count} />
          <Mini label="Unlocks" value={drop.unlocks_count} />
          <Mini label="Buyers" value={drop.unique_buyers} />
          <Mini label="Receita" value={drop.credits_revenue} accent="#68ed00" />
        </div>

        <div className="mt-3 space-y-1 text-[11px] text-[#888]">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" /> Criado em {new Date(drop.created_at).toLocaleDateString("pt-BR")}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {drop.available_until
              ? <>Encerra em <span className="text-white">{new Date(drop.available_until).toLocaleString("pt-BR")}</span></>
              : <span>Sem prazo de encerramento</span>}
          </div>
          {drop.last_unlock_at && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3" /> Último unlock {new Date(drop.last_unlock_at).toLocaleDateString("pt-BR")}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button onClick={toggleActive} disabled={update.isPending}
            className="press inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-[11px] font-bold disabled:opacity-50"
            style={{
              borderColor: drop.is_active ? "#ef444444" : "#68ed0044",
              background: drop.is_active ? "#ef444414" : "#68ed0014",
              color: drop.is_active ? "#fca5a5" : "#68ed00",
            }}>
            {drop.is_active ? <><PauseCircle className="h-3.5 w-3.5" /> Pausar</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Ativar</>}
          </button>
          <button onClick={() => setOpenSchedule((v) => !v)}
            className="press inline-flex h-8 items-center gap-1 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-2.5 text-[11px] font-bold text-white">
            <Clock className="h-3.5 w-3.5" /> {drop.available_until ? "Editar prazo" : "Agendar fim"}
          </button>
          <Link to="/admin/creditos"
            className="press inline-flex h-8 items-center gap-1 rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-2.5 text-[11px] font-bold text-white">
            <ExternalLink className="h-3.5 w-3.5" /> Editar
          </Link>
        </div>

        {openSchedule && (
          <div className="mt-3 rounded-lg border border-[#2a2a2a] bg-[#161616] p-2.5">
            <label className="text-[10px] uppercase text-[#888]">Encerrar em</label>
            <input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-[#2a2a2a] bg-[#0f0f0f] px-2 text-xs text-white" />
            <div className="mt-2 flex gap-1.5">
              <button onClick={saveSchedule} disabled={update.isPending}
                className="press inline-flex h-8 flex-1 items-center justify-center rounded-md bg-[#68ed00] px-3 text-[11px] font-bold text-black disabled:opacity-50">
                Salvar
              </button>
              {drop.available_until && (
                <button onClick={clearSchedule} disabled={update.isPending}
                  className="press inline-flex h-8 items-center justify-center rounded-md border border-[#2a2a2a] bg-[#0f0f0f] px-3 text-[11px] font-bold text-white">
                  Remover
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-md border border-[#2a2a2a] bg-[#161616] px-1.5 py-1">
      <div className="text-[9px] uppercase text-[#666]">{label}</div>
      <div className="text-xs font-bold tabular-nums" style={{ color: accent ?? "#fff" }}>{value.toLocaleString("pt-BR")}</div>
    </div>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}