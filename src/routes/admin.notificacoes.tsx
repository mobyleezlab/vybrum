import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Send, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminListUsers, type AdminUserRow } from "@/lib/admin.functions";
import { relativeTime, type NotificationType } from "@/components/NotificationsSheet";

export const Route = createFileRoute("/admin/notificacoes")({
  ssr: false,
  component: AdminNotificacoesPage,
});

const TYPES: { value: NotificationType; label: string }[] = [
  { value: "general", label: "Aviso geral" },
  { value: "drop", label: "Novo drop" },
  { value: "credits", label: "Créditos" },
  { value: "promo", label: "Promoção" },
];

type SentNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  target: string;
  target_user_id: string | null;
  created_at: string;
  reads_count: number;
};

function AdminNotificacoesPage() {
  const qc = useQueryClient();
  const listUsersFn = useServerFn(adminListUsers);

  const [type, setType] = useState<NotificationType>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<"all" | "user">("all");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);

  const usersQ = useQuery({
    queryKey: ["admin", "notif-users", userSearch],
    enabled: target === "user" && userSearch.trim().length >= 2,
    queryFn: () =>
      listUsersFn({
        data: { search: userSearch.trim(), plan: "all", page: 0, pageSize: 10 },
      }),
  });

  const listQ = useQuery({
    queryKey: ["admin", "notifications", "recent"],
    queryFn: async (): Promise<SentNotification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,type,title,body,target,target_user_id,created_at,notification_reads(count)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).map((n: Record<string, unknown>) => {
        const reads = n.notification_reads as Array<{ count: number }> | null;
        return {
          id: n.id as string,
          type: n.type as string,
          title: n.title as string,
          body: n.body as string,
          target: n.target as string,
          target_user_id: (n.target_user_id as string | null) ?? null,
          created_at: n.created_at as string,
          reads_count: reads?.[0]?.count ?? 0,
        };
      });
    },
  });

  const sendMut = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !body.trim()) throw new Error("Preencha título e mensagem");
      if (target === "user" && !selectedUser) throw new Error("Selecione um usuário");
      const { data, error } = await supabase.rpc("send_notification", {
        p_type: type,
        p_title: title.trim(),
        p_body: body.trim(),
        p_target: target,
        p_user_id: target === "user" ? selectedUser!.id : undefined,
      });
      if (error) throw error;
      const res = data as { error?: string } | null;
      if (res && "error" in res && res.error) throw new Error(res.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Notificação enviada");
      setTitle("");
      setBody("");
      setSelectedUser(null);
      setUserSearch("");
      qc.invalidateQueries({ queryKey: ["admin", "notifications", "recent"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Falha ao enviar"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notificação excluída");
      qc.invalidateQueries({ queryKey: ["admin", "notifications", "recent"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Falha ao excluir"),
  });

  const canSend = useMemo(() => {
    if (!title.trim() || !body.trim()) return false;
    if (target === "user" && !selectedUser) return false;
    return !sendMut.isPending;
  }, [title, body, target, selectedUser, sendMut.isPending]);

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-[#2a2a2a] bg-[#0f0f0f] p-4">
        <h2 className="mb-3 text-sm font-bold text-white">Nova notificação</h2>

        <div className="grid gap-3">
          <label className="grid gap-1 text-xs text-[#aaa]">
            Tipo
            <select
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
              className="h-10 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 text-sm text-white"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-[#aaa]">
            <div className="flex justify-between">
              <span>Título</span>
              <span className="text-[#666]">{title.length}/80</span>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 80))}
              maxLength={80}
              className="h-10 rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 text-sm text-white"
            />
          </label>

          <label className="grid gap-1 text-xs text-[#aaa]">
            <div className="flex justify-between">
              <span>Mensagem</span>
              <span className="text-[#666]">{body.length}/300</span>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 300))}
              maxLength={300}
              rows={3}
              className="rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 py-2 text-sm text-white"
            />
          </label>

          <div className="grid gap-2">
            <span className="text-xs text-[#aaa]">Destinatário</span>
            <div className="inline-flex rounded-lg border border-[#2a2a2a] bg-[#161616] p-1 text-xs font-semibold">
              {(["all", "user"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setTarget(opt)}
                  className="press h-8 rounded-md px-3"
                  style={{
                    background: target === opt ? "#68ed00" : "transparent",
                    color: target === opt ? "#000" : "#ddd",
                  }}
                >
                  {opt === "all" ? "Todos os usuários" : "Usuário específico"}
                </button>
              ))}
            </div>

            {target === "user" && (
              <div className="grid gap-2">
                {selectedUser ? (
                  <div className="flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#161616] px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{selectedUser.email}</p>
                      <p className="truncate text-xs text-[#888]">{selectedUser.full_name ?? "—"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="press text-xs text-[#68ed00]"
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <>
                    <label className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
                      <input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Buscar por email ou nome…"
                        className="h-10 w-full rounded-lg border border-[#2a2a2a] bg-[#161616] pl-9 pr-3 text-sm text-white"
                      />
                    </label>
                    {usersQ.isLoading && (
                      <p className="text-xs text-[#888]">Buscando…</p>
                    )}
                    {usersQ.data && usersQ.data.users.length > 0 && (
                      <ul className="max-h-48 overflow-y-auto rounded-lg border border-[#2a2a2a] bg-[#161616]">
                        {usersQ.data.users.map((u) => (
                          <li key={u.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedUser(u)}
                              className="press flex w-full items-center justify-between border-b border-[#2a2a2a] px-3 py-2 text-left text-sm last:border-b-0 hover:bg-[#1f1f1f]"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-white">{u.email}</p>
                                <p className="truncate text-xs text-[#888]">{u.full_name ?? "—"}</p>
                              </div>
                              <span className="text-[10px] uppercase text-[#666]">{u.plan}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {usersQ.data && usersQ.data.users.length === 0 && userSearch.trim().length >= 2 && (
                      <p className="text-xs text-[#888]">Nenhum usuário encontrado.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!canSend}
            onClick={() => sendMut.mutate()}
            className="press inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#68ed00] px-4 text-sm font-bold text-black disabled:opacity-40"
          >
            {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar notificação
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-white">Últimas enviadas</h2>
        <div className="overflow-x-auto rounded-xl border border-[#2a2a2a]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161616] text-[10px] uppercase text-[#888]">
              <tr>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Título</th>
                <th className="px-3 py-2">Destino</th>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2 text-right">Lidas</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {listQ.isLoading && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-[#888]">
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                </td></tr>
              )}
              {listQ.data?.map((n) => (
                <tr key={n.id} className="border-t border-[#1a1a1a] text-white">
                  <td className="px-3 py-2 text-[#68ed00]">{n.type}</td>
                  <td className="px-3 py-2">
                    <p className="font-semibold">{n.title}</p>
                    <p className="line-clamp-1 text-[#888]">{n.body}</p>
                  </td>
                  <td className="px-3 py-2 text-[#aaa]">
                    {n.target === "all" ? "Todos" : "Usuário"}
                  </td>
                  <td className="px-3 py-2 text-[#aaa]">{relativeTime(n.created_at)}</td>
                  <td className="px-3 py-2 text-right">{n.reads_count}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Excluir esta notificação?")) deleteMut.mutate(n.id);
                      }}
                      className="press inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#2a2a2a] text-red-400"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {listQ.data && listQ.data.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-[#888]">
                  Nenhuma notificação enviada ainda.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}