import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Loader2, Users, UserPlus, Activity, Shirt, Shield, Unlock, Coins, ArrowDownCircle, ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { adminAnalyticsSummary, type AdminAnalyticsSummary } from "@/lib/admin-analytics.functions";

export const Route = createFileRoute("/admin/analytics")({
  ssr: false,
  component: AnalyticsPage,
});

const RANGES = [
  { v: 7, l: "7d" },
  { v: 30, l: "30d" },
  { v: 90, l: "90d" },
  { v: 180, l: "180d" },
  { v: 365, l: "1a" },
] as const;

const PLAN_COLORS: Record<string, string> = {
  free: "#3f3f46",
  pro: "#68ed00",
  premium: "#a855f7",
  admin: "#f59e0b",
};

function nfmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function AnalyticsPage() {
  const fn = useServerFn(adminAnalyticsSummary);
  const [range, setRange] = useState<number>(30);
  const q = useQuery({
    queryKey: ["admin", "analytics", range],
    queryFn: () => fn({ data: { rangeDays: range } }),
    placeholderData: (prev) => prev,
  });

  if (q.isLoading && !q.data) {
    return <div className="grid min-h-[40vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (q.error) {
    return <p className="text-sm text-red-300">{(q.error as Error).message}</p>;
  }
  const d = q.data as AdminAnalyticsSummary;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-[#888]">Atividade da plataforma nos últimos {range} dias.</p>
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

      {d.setupError && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-amber-200">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-xs leading-relaxed">{d.setupError}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Users} label="Usuários totais" value={nfmt(d.totals.total_users)} hint={`${nfmt(d.totals.active_users)} ativos no período`} />
        <Kpi icon={UserPlus} label="Novos usuários" value={nfmt(d.totals.new_users)} hint="cadastros no período" />
        <Kpi icon={Shirt} label="Kits criados" value={nfmt(d.totals.kits_created)} hint={`${nfmt(d.totals.shields_created)} escudos`} />
        <Kpi icon={Unlock} label="Modelos desbloqueados" value={nfmt(d.totals.templates_unlocked)} hint={`${nfmt(d.totals.credits_spent)} créditos gastos`} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Cadastros por dia">
          <ResponsiveContainer>
            <AreaChart data={d.daily_signups} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="su" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#68ed00" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#68ed00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="date" stroke="#666" fontSize={10} tickFormatter={(v) => v.slice(5)} />
              <YAxis stroke="#666" fontSize={10} width={30} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#68ed00" strokeWidth={2} fill="url(#su)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Kits criados por dia">
          <ResponsiveContainer>
            <AreaChart data={d.daily_kits} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="kt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="date" stroke="#666" fontSize={10} tickFormatter={(v) => v.slice(5)} />
              <YAxis stroke="#666" fontSize={10} width={30} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} fill="url(#kt)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <ChartCard title="Distribuição por plano" className="lg:col-span-1">
          {d.plans.length === 0 ? <Empty /> : (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={d.plans} dataKey="count" nameKey="plan" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2}>
                  {d.plans.map((p, i) => <Cell key={i} fill={PLAN_COLORS[p.plan] ?? "#666"} stroke="#0f0f0f" />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#aaa" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top modelos usados em kits" className="lg:col-span-2">
          {d.top_models.length === 0 ? <Empty /> : (
            <ResponsiveContainer>
              <BarChart data={d.top_models} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#1a1a1a" horizontal={false} />
                <XAxis type="number" stroke="#666" fontSize={10} allowDecimals={false} />
                <YAxis type="category" dataKey={(v: any) => v.name || v.model_code} stroke="#aaa" fontSize={11} width={120} />
                <Tooltip contentStyle={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#68ed00" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#888]">Top modelos desbloqueados</h2>
          {d.top_unlocked.length === 0 ? <Empty /> : (
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase text-[#666]">
                <tr><th className="py-1.5">Modelo</th><th className="py-1.5 text-right">Desbloqueios</th><th className="py-1.5 text-right">Créditos</th></tr>
              </thead>
              <tbody>
                {d.top_unlocked.map((r) => (
                  <tr key={r.model_code} className="border-t border-[#1a1a1a]">
                    <td className="py-1.5 text-white">{r.name || r.model_code}</td>
                    <td className="py-1.5 text-right tabular-nums text-white">{nfmt(r.count)}</td>
                    <td className="py-1.5 text-right tabular-nums text-[#68ed00]">{nfmt(r.credits)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#888]">Movimentação de créditos</h2>
            <div className="flex items-center gap-3 text-[10px] text-[#888]">
              <span className="inline-flex items-center gap-1"><Coins className="h-3 w-3 text-[#68ed00]" />Entradas {nfmt(d.totals.credits_earned)}</span>
              <span className="inline-flex items-center gap-1"><ArrowDownCircle className="h-3 w-3 text-red-300" />Saídas {nfmt(d.totals.credits_spent)}</span>
            </div>
          </div>
          {d.ledger_by_type.length === 0 ? <Empty /> : (
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={d.ledger_by_type} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="type" stroke="#aaa" fontSize={10} />
                  <YAxis stroke="#666" fontSize={10} width={40} />
                  <Tooltip contentStyle={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#aaa" }} />
                  <Bar dataKey="in" name="entrada" stackId="a" fill="#68ed00" />
                  <Bar dataKey="out" name="saída" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Mini icon={Activity} label="Usuários ativos" value={nfmt(d.totals.active_users)} />
        <Mini icon={Shield} label="Escudos enviados" value={nfmt(d.totals.shields_created)} />
        <Mini icon={Coins} label="Saldo líquido" value={nfmt(d.totals.credits_earned - d.totals.credits_spent)} />
      </div>
    </div>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4 ${className}`}>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#888]">{title}</h2>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

function Empty() {
  return <div className="grid h-full place-items-center text-xs text-[#666]">Sem dados no período.</div>;
}

function Kpi({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#888]">{label}</span>
        <Icon className="h-4 w-4 text-[#68ed00]" />
      </div>
      <div className="mt-2 text-xl font-extrabold text-white tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-[10px] text-[#888]">{hint}</div>}
    </div>
  );
}

function Mini({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] px-3 py-2.5">
      <span className="inline-flex items-center gap-2 text-[11px] text-[#aaa]"><Icon className="h-3.5 w-3.5 text-[#68ed00]" />{label}</span>
      <span className="text-sm font-bold tabular-nums text-white">{value}</span>
    </div>
  );
}
