import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Search, ShieldOff, ShieldCheck, Coins, Crown } from "lucide-react";
import { toast } from "sonner";
import {
  adminListUsers,
  adminUpdateUserPlan,
  adminSetUserDisabled,
  adminAdjustCredits,
  type AdminUserRow,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/usuarios")({
  ssr: false,
  component: AdminUsuariosPage,
});

const PLANS = ["all", "free", "pro", "premium", "admin"] as const;
type PlanFilter = (typeof PLANS)[number];

function AdminUsuariosPage() {
  const listFn = useServerFn(adminListUsers);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState<PlanFilter>("all");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const q = useQuery({
    queryKey: ["admin", "users", { search, plan, page }],
    queryFn: () => listFn({ data: { search: search || null, plan, page, pageSize } }),
    placeholderData: (prev) => prev,
  });

  const [editing, setEditing] = useState<AdminUserRow | null>(null);

  const totalPages = Math.max(1, Math.ceil((q.data?.total ?? 0) / pageSize));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar por email, nome ou ID…"
            className="h-10 w-full rounded-lg border border-[#2a2a2a] bg-[#161616] pl-9 pr-3 text-sm text-white"
          />
        </label>
        <select
          value={plan}
          onChange={(e) => { setPlan(e.target.value as PlanFilter); setPage(0); }}
          className="h-10 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 text-sm text-white"
        >
          {PLANS.map((p) => <option key={p} value={p}>{p === "all" ? "Todos planos" : p}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#161616] text-[10px] uppercase text-[#888]">
            <tr>
              <th className="px-3 py-2">Usuário</th>
              <th className="px-3 py-2">Plano</th>
              <th className="px-3 py-2 text-right">Créditos</th>
              <th className="px-3 py-2 text-right">Kits</th>
              <th className="px-3 py-2 text-right">Escudos</th>
              <th className="px-3 py-2 text-right">Gasto (R$)</th>
              <th className="px-3 py-2">Criado</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {q.isLoading ? (
              <tr><td colSpan={9} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
            ) : !q.data?.users.length ? (
              <tr><td colSpan={9} className="py-10 text-center text-[#888]">Nenhum usuário encontrado.</td></tr>
            ) : q.data.users.map((u) => (
              <tr key={u.id} className="border-t border-[#1a1a1a] hover:bg-[#0f0f0f]">
                <td className="px-3 py-2">
                  <div className="font-semibold text-white">{u.full_name || "—"}</div>
                  <div className="text-[10px] text-[#888]">{u.email || u.id.slice(0, 8)}</div>
                </td>
                <td className="px-3 py-2">
                  <PlanBadge plan={u.plan} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{u.credits}</td>
                <td className="px-3 py-2 text-right tabular-nums">{u.kits_count}</td>
                <td className="px-3 py-2 text-right tabular-nums">{u.shields_count}</td>
                <td className="px-3 py-2 text-right tabular-nums">{u.purchases_total_brl.toFixed(2)}</td>
                <td className="px-3 py-2 text-[#aaa]">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                <td className="px-3 py-2">
                  {u.is_disabled
                    ? <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-300">desativado</span>
                    : <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">ativo</span>}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setEditing(u)} className="press rounded-md bg-[#1a1a1a] px-2.5 py-1 text-[10px] font-bold text-white">
                    Gerenciar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-[#888]">
        <span>{q.data?.total ?? 0} usuário(s) · página {page + 1} de {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="press rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-white disabled:opacity-30">Anterior</button>
          <button disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}
            className="press rounded-md border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-white disabled:opacity-30">Próxima</button>
        </div>
      </div>

      {editing && <UserDrawer user={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    free: "bg-[#1a1a1a] text-[#aaa]",
    pro: "bg-blue-500/10 text-blue-300",
    premium: "bg-purple-500/10 text-purple-300",
    admin: "bg-[#68ed00]/10 text-[#68ed00]",
  };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${map[plan] ?? map.free}`}>{plan}</span>;
}

function UserDrawer({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  const qc = useQueryClient();
  const updatePlanFn = useServerFn(adminUpdateUserPlan);
  const setDisabledFn = useServerFn(adminSetUserDisabled);
  const adjustFn = useServerFn(adminAdjustCredits);

  const [plan, setPlan] = useState(user.plan);
  const [delta, setDelta] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const savePlan = useMutation({
    mutationFn: () => updatePlanFn({ data: { userId: user.id, plan: plan as "free" | "pro" | "premium" | "admin" } }),
    onSuccess: () => { toast.success("Plano atualizado."); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleDisabled = useMutation({
    mutationFn: () => setDisabledFn({ data: { userId: user.id, is_disabled: !user.is_disabled } }),
    onSuccess: () => { toast.success(user.is_disabled ? "Usuário reativado." : "Usuário desativado."); invalidate(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const adjust = useMutation({
    mutationFn: () => adjustFn({ data: { userId: user.id, delta: Number(delta), reason: reason.trim() } }),
    onSuccess: (r) => { toast.success(`Saldo atualizado: ${r.balance} créditos.`); setDelta(""); setReason(""); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 sm:place-items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4 sm:max-w-md sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">{user.full_name || user.email}</h2>
            <div className="text-[10px] text-[#666]">{user.id}</div>
          </div>
          <button onClick={onClose} className="text-xs text-[#888]">Fechar</button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat label="Créditos" value={String(user.credits)} />
          <Stat label="Total ganho" value={String(user.total_earned)} />
          <Stat label="Total gasto" value={String(user.total_spent)} />
          <Stat label="Gasto R$" value={user.purchases_total_brl.toFixed(2)} />
          <Stat label="Kits" value={String(user.kits_count)} />
          <Stat label="Escudos" value={String(user.shields_count)} />
        </div>

        <div className="mt-4 rounded-xl border border-[#2a2a2a] bg-[#161616] p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#888]"><Crown className="h-3.5 w-3.5" /> Plano</div>
          <div className="flex gap-2">
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className="h-10 flex-1 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-2 text-sm text-white">
              {["free", "pro", "premium", "admin"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button disabled={savePlan.isPending || plan === user.plan} onClick={() => savePlan.mutate()}
              className="press inline-flex h-10 items-center rounded-lg bg-[#68ed00] px-4 text-xs font-bold text-black disabled:opacity-50">
              Salvar
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-[#2a2a2a] bg-[#161616] p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#888]"><Coins className="h-3.5 w-3.5" /> Ajustar créditos</div>
          <div className="grid grid-cols-2 gap-2">
            <input value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="±valor" type="number"
              className="h-10 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-2 text-sm text-white" />
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo"
              className="h-10 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-2 text-sm text-white" />
          </div>
          <button disabled={adjust.isPending || !delta || Number(delta) === 0 || !reason.trim()} onClick={() => adjust.mutate()}
            className="press mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#68ed00] px-4 text-xs font-bold text-black disabled:opacity-50">
            {adjust.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar ajuste"}
          </button>
        </div>

        <button disabled={toggleDisabled.isPending} onClick={() => {
          if (confirm(user.is_disabled ? "Reativar este usuário?" : "Desativar este usuário?")) toggleDisabled.mutate();
        }} className="press mt-3 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border px-4 text-xs font-bold"
          style={{
            borderColor: user.is_disabled ? "#10b98166" : "#ef444466",
            background: user.is_disabled ? "#10b98114" : "#ef444414",
            color: user.is_disabled ? "#6ee7b7" : "#fca5a5",
          }}>
          {user.is_disabled ? <><ShieldCheck className="h-4 w-4" /> Reativar usuário</> : <><ShieldOff className="h-4 w-4" /> Desativar usuário</>}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#2a2a2a] bg-[#161616] px-2 py-1.5">
      <div className="text-[10px] uppercase text-[#666]">{label}</div>
      <div className="text-sm font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}