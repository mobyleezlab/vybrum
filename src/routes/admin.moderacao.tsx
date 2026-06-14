import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Search, ShieldAlert, Trash2, AlertTriangle, Activity, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  adminListShields,
  adminDeleteShield,
  adminListSecurityLogs,
  type AdminShield,
} from "@/lib/admin-moderation.functions";

export const Route = createFileRoute("/admin/moderacao")({
  ssr: false,
  component: Page,
});

type Tab = "shields" | "logs";

function Page() {
  const [tab, setTab] = useState<Tab>("shields");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <TabButton active={tab === "shields"} onClick={() => setTab("shields")} icon={<ImageIcon className="h-4 w-4" />}>
          Escudos enviados
        </TabButton>
        <TabButton active={tab === "logs"} onClick={() => setTab("logs")} icon={<Activity className="h-4 w-4" />}>
          Eventos de segurança
        </TabButton>
      </div>
      {tab === "shields" ? <ShieldsPanel /> : <LogsPanel />}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="press inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold"
      style={{
        borderColor: active ? "#68ed00" : "#2a2a2a",
        background: active ? "#68ed0022" : "#0f0f0f",
        color: active ? "#68ed00" : "#ddd",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function ShieldsPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListShields);
  const deleteFn = useServerFn(adminDeleteShield);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 48;

  const q = useQuery({
    queryKey: ["admin", "moderation", "shields", search, page],
    queryFn: () => listFn({ data: { search: search || null, page, pageSize } }),
  });

  const del = useMutation({
    mutationFn: async (args: { id: string; reason: string }) => deleteFn({ data: args }),
    onSuccess: () => {
      toast.success("Escudo removido.");
      qc.invalidateQueries({ queryKey: ["admin", "moderation", "shields"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao remover."),
  });

  const total = q.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar por nome do escudo…"
            className="h-10 w-full rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] pl-9 pr-3 text-sm text-white outline-none focus:border-[#68ed00]"
          />
        </div>
        <div className="text-xs text-[#888]">{total} escudos</div>
      </div>

      {q.isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#666]" /></div>
      ) : q.isError ? (
        <ErrorBox message={(q.error as any)?.message ?? "Erro ao carregar."} />
      ) : (q.data?.shields.length ?? 0) === 0 ? (
        <EmptyBox icon={<ImageIcon className="h-10 w-10 text-[#444]" />} text="Nenhum escudo encontrado." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {q.data!.shields.map((s) => (
            <ShieldCard key={s.id} shield={s} onDelete={(reason) => del.mutate({ id: s.id, reason })} pending={del.isPending} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="press h-9 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 text-xs font-semibold text-white disabled:opacity-40"
        >
          Anterior
        </button>
        <div className="text-xs text-[#888]">Página {page + 1} / {totalPages}</div>
        <button
          onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
          disabled={page + 1 >= totalPages}
          className="press h-9 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 text-xs font-semibold text-white disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}

function ShieldCard({ shield, onDelete, pending }: { shield: AdminShield; onDelete: (reason: string) => void; pending: boolean }) {
  const handleDelete = () => {
    const reason = window.prompt(`Remover "${shield.name}"?\n\nMotivo (será registrado no audit log):`);
    if (!reason || !reason.trim()) return;
    onDelete(reason.trim());
  };
  return (
    <div className="overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#0d0d0d]">
      <div className="grid aspect-square place-items-center bg-[#050505] p-3">
        <img src={shield.image_url} alt={shield.name} loading="lazy" className="max-h-full max-w-full object-contain" />
      </div>
      <div className="space-y-1 p-2 text-xs">
        <div className="truncate font-semibold text-white" title={shield.name}>{shield.name || "(sem nome)"}</div>
        <div className="truncate text-[#888]" title={shield.user_email ?? shield.user_id}>
          {shield.user_email ?? shield.user_name ?? shield.user_id.slice(0, 8)}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] uppercase tracking-wide text-[#666]">
            {new Date(shield.created_at).toLocaleDateString("pt-BR")}
          </span>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="press inline-flex h-7 items-center gap-1 rounded-md border border-red-900/40 bg-red-950/40 px-2 text-[11px] font-semibold text-red-300 disabled:opacity-40"
            title="Remover"
          >
            <Trash2 className="h-3 w-3" /> Remover
          </button>
        </div>
      </div>
    </div>
  );
}

function LogsPanel() {
  const listFn = useServerFn(adminListSecurityLogs);
  const [eventType, setEventType] = useState<string>("");

  const q = useQuery({
    queryKey: ["admin", "moderation", "logs", eventType],
    queryFn: () => listFn({ data: { eventType: eventType || null, limit: 200 } }),
  });

  const eventTypes = q.data?.eventTypes ?? [];
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of q.data?.logs ?? []) m.set(l.event_type, (m.get(l.event_type) ?? 0) + 1);
    return m;
  }, [q.data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="h-10 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 text-sm text-white outline-none focus:border-[#68ed00]"
        >
          <option value="">Todos os eventos</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="text-xs text-[#888]">{q.data?.logs.length ?? 0} eventos exibidos</div>
      </div>

      {q.isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#666]" /></div>
      ) : q.isError ? (
        <ErrorBox message={(q.error as any)?.message ?? "Erro ao carregar."} />
      ) : (q.data?.logs.length ?? 0) === 0 ? (
        <EmptyBox icon={<ShieldAlert className="h-10 w-10 text-[#444]" />} text="Nenhum evento registrado no período." />
      ) : (
        <div className="space-y-3">
          {counts.size > 0 && (
            <div className="flex flex-wrap gap-2">
              {Array.from(counts.entries()).map(([k, v]) => (
                <span key={k} className="rounded-md border border-[#2a2a2a] bg-[#0f0f0f] px-2 py-1 text-[11px] text-[#bbb]">
                  {k} · <span className="text-white">{v}</span>
                </span>
              ))}
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-[#1f1f1f]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f0f0f] text-[#888]">
                <tr>
                  <th className="px-3 py-2 font-semibold">Quando</th>
                  <th className="px-3 py-2 font-semibold">Evento</th>
                  <th className="px-3 py-2 font-semibold">Usuário</th>
                  <th className="px-3 py-2 font-semibold">IP</th>
                  <th className="px-3 py-2 font-semibold">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a] bg-[#0a0a0a]">
                {q.data!.logs.map((l) => (
                  <tr key={l.id} className="align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-[#bbb]">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                    <td className="px-3 py-2 font-semibold text-white">{l.event_type}</td>
                    <td className="px-3 py-2 text-[#bbb]">{l.user_email ?? (l.user_id ? l.user_id.slice(0, 8) : "—")}</td>
                    <td className="px-3 py-2 text-[#888]">{l.ip_address ?? "—"}</td>
                    <td className="px-3 py-2 text-[#888]">
                      <pre className="max-w-[420px] overflow-hidden whitespace-pre-wrap break-words text-[10px] text-[#888]">
                        {l.details ? JSON.stringify(l.details, null, 0) : "—"}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{message}</div>
    </div>
  );
}

function EmptyBox({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] py-16 text-center">
      <div>
        {icon}
        <p className="mt-3 text-sm text-[#888]">{text}</p>
      </div>
    </div>
  );
}
