import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, Coins, Receipt } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";
import { adminBillingSummary, adminListRecentPurchases, type AdminBillingSummary } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/faturamento")({
  ssr: false,
  component: FaturamentoPage,
});

const RANGES = [
  { v: 7, l: "7d" },
  { v: 30, l: "30d" },
  { v: 90, l: "90d" },
  { v: 180, l: "180d" },
  { v: 365, l: "1a" },
] as const;

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function emptySummary(range: number): AdminBillingSummary {
  const now = new Date();
  const daily = Array.from({ length: range }, (_, index) => {
    const d = new Date(now.getTime() - (range - index - 1) * 86400_000);
    return { date: d.toISOString().slice(0, 10), revenue: 0, count: 0 };
  });
  return {
    totals: { revenue_brl: 0, completed_count: 0, pending_count: 0, failed_count: 0, refunded_count: 0, paying_users: 0, arpu_brl: 0, avg_ticket_brl: 0, credits_granted: 0 },
    windows: { today_brl: 0, last_7d_brl: 0, last_30d_brl: 0, prev_30d_brl: 0, growth_pct: null },
    daily,
    top_packages: [],
    recent: [],
  };
}

function FaturamentoPage() {
  const fn = useServerFn(adminBillingSummary);
  const recentFn = useServerFn(adminListRecentPurchases);
  const [range, setRange] = useState<number>(30);
  const q = useQuery({
    queryKey: ["admin", "billing", range],
    queryFn: () => fn({ data: { rangeDays: range } }),
    placeholderData: (prev) => prev,
  });
  const recentQ = useInfiniteQuery({
    queryKey: ["admin", "billing", "recent"],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => recentFn({ data: { offset: pageParam as number, limit: 50 } }),
    getNextPageParam: (last) => (last.hasMore ? last.nextOffset : undefined),
    staleTime: 60_000,
  });
  const recentRows = (recentQ.data?.pages ?? []).flatMap((p) => p.rows);

  if (q.isLoading && !q.data) {
    return <div className="grid min-h-[40vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (q.error) {
    return <p className="text-sm text-red-300">{(q.error as Error).message}</p>;
  }
  const d = (q.data ?? emptySummary(range)) as AdminBillingSummary;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[#888]">Receita confirmada (status <code className="text-[#aaa]">completed</code>) nos últimos {range} dias.</p>
        <div className="flex gap-1 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-1">
          {RANGES.map((r) => (
            <button key={r.v} onClick={() => setRange(r.v)}
              className="press h-7 rounded px-2.5 text-[11px] font-bold"
              style={{ background: range === r.v ? "#68ed00" : "transparent", color: range === r.v ? "#000" : "#aaa" }}>
              {r.l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={DollarSign} label="Receita" value={brl(d.totals.revenue_brl)} hint={d.windows.growth_pct != null ? `vs período anterior` : "—"}
          delta={d.windows.growth_pct} />
        <Kpi icon={Receipt} label="Vendas" value={String(d.totals.completed_count)} hint={`${d.totals.pending_count} pendente(s)`} />
        <Kpi icon={Users} label="Clientes pagantes" value={String(d.totals.paying_users)} hint={`ARPU ${brl(d.totals.arpu_brl)}`} />
        <Kpi icon={ShoppingBag} label="Ticket médio" value={brl(d.totals.avg_ticket_brl)} hint={`${d.totals.credits_granted.toLocaleString("pt-BR")} créditos vendidos`} />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Mini label="Hoje" value={brl(d.windows.today_brl)} />
        <Mini label="7 dias" value={brl(d.windows.last_7d_brl)} />
        <Mini label="30 dias" value={brl(d.windows.last_30d_brl)} />
        <Mini label="30d anterior" value={brl(d.windows.prev_30d_brl)} muted />
      </div>

      <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#888]">Receita diária</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <AreaChart data={d.daily} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#68ed00" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#68ed00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="date" stroke="#666" fontSize={10} tickFormatter={(v) => v.slice(5)} />
              <YAxis stroke="#666" fontSize={10} tickFormatter={(v) => `R$${v}`} width={50} />
              <Tooltip contentStyle={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => brl(Number(v))} labelFormatter={(l) => l} />
              <Area type="monotone" dataKey="revenue" stroke="#68ed00" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#888]">Top pacotes</h2>
          {d.top_packages.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#666]">Sem vendas no período.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={d.top_packages} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#1a1a1a" horizontal={false} />
                  <XAxis type="number" stroke="#666" fontSize={10} tickFormatter={(v) => `R$${v}`} />
                  <YAxis type="category" dataKey="name" stroke="#aaa" fontSize={11} width={100} />
                  <Tooltip contentStyle={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any, k: string) => k === "revenue" ? brl(Number(v)) : v} />
                  <Bar dataKey="revenue" fill="#68ed00" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#888]">Compras recentes</h2>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#0f0f0f] text-[10px] uppercase text-[#666]">
                <tr><th className="py-1.5">Usuário</th><th className="py-1.5">Pacote</th><th className="py-1.5 text-right">Valor</th><th className="py-1.5">Status</th></tr>
              </thead>
              <tbody>
                {recentRows.length === 0 && !recentQ.isLoading ? (
                  <tr><td colSpan={4} className="py-8 text-center text-[#666]">Nenhuma compra ainda.</td></tr>
                ) : recentRows.map((r) => (
                  <tr key={r.id} className="border-t border-[#1a1a1a]">
                    <td className="py-1.5 text-white">
                      <div className="font-semibold">{r.user_name || r.user_email || r.user_id.slice(0, 8)}</div>
                      <div className="text-[10px] text-[#666]">{new Date(r.created_at).toLocaleString("pt-BR")}</div>
                    </td>
                    <td className="py-1.5 text-[#bbb]">{r.package_name ?? "—"}</td>
                    <td className="py-1.5 text-right tabular-nums text-white">{brl(r.price_brl)}</td>
                    <td className="py-1.5"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recentQ.hasNextPage && (
            <button
              onClick={() => recentQ.fetchNextPage()}
              disabled={recentQ.isFetchingNextPage}
              className="press mt-3 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] py-2 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              {recentQ.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, hint, delta }: { icon: any; label: string; value: string; hint?: string; delta?: number | null }) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#888]">{label}</span>
        <Icon className="h-4 w-4 text-[#68ed00]" />
      </div>
      <div className="mt-2 text-xl font-extrabold text-white tabular-nums">{value}</div>
      <div className="mt-1 flex items-center gap-1 text-[10px] text-[#888]">
        {delta != null && (
          <span className="inline-flex items-center gap-0.5 font-bold"
            style={{ color: positive ? "#68ed00" : "#fca5a5" }}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {delta > 0 ? "+" : ""}{delta}%
          </span>
        )}
        <span>{hint}</span>
      </div>
    </div>
  );
}

function Mini({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] px-3 py-2.5">
      <div className="text-[10px] uppercase text-[#666]">{label}</div>
      <div className="text-sm font-bold tabular-nums" style={{ color: muted ? "#888" : "white" }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-300",
    pending: "bg-amber-500/10 text-amber-300",
    failed: "bg-red-500/10 text-red-300",
    refunded: "bg-purple-500/10 text-purple-300",
  };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${map[status] ?? "bg-[#1a1a1a] text-[#aaa]"}`}>{status}</span>;
}