import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Sparkles, Package, Megaphone, Diamond, Inbox } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@tanstack/react-router";

export type NotificationType = "general" | "drop" | "credits" | "promo";
export type NotificationTarget = "all" | "user";

export interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  target: NotificationTarget;
  target_user_id: string | null;
  created_by: string;
  created_at: string;
  notification_reads: { read_at: string }[];
}

function iconFor(type: NotificationType) {
  switch (type) {
    case "drop":
      return Sparkles;
    case "credits":
      return Diamond;
    case "promo":
      return Package;
    default:
      return Megaphone;
  }
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return "agora";
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m}min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  if (d < 30) return `há ${d}d`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `há ${mo}mês`;
  return `há ${Math.round(mo / 12)}a`;
}

export function NotificationsBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const PAGE_SIZE = 30;
  const queryKey = ["notifications", user?.id ?? "anon"];

  const query = useInfiniteQuery({
    queryKey,
    enabled: !!user,
    staleTime: 30_000,
    initialPageParam: 0,
    getNextPageParam: (last: NotificationRow[], all) =>
      last.length < PAGE_SIZE ? undefined : all.length * PAGE_SIZE,
    queryFn: async ({ pageParam }): Promise<NotificationRow[]> => {
      const from = pageParam as number;
      const { data, error } = await supabase
        .from("notifications")
        .select("*, notification_reads!left(read_at)")
        .or(`target.eq.all,target_user_id.eq.${user!.id}`)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return (data ?? []) as unknown as NotificationRow[];
    },
  });

  const notifications = useMemo(
    () => (query.data?.pages ?? []).flat(),
    [query.data],
  );
  const unread = useMemo(
    () => notifications.filter((n) => !n.notification_reads?.length).length,
    [notifications],
  );
  const visible = useMemo(
    () => (onlyUnread ? notifications.filter((n) => !n.notification_reads?.length) : notifications),
    [notifications, onlyUnread],
  );

  useEffect(() => {
    if (!open || !user || unread === 0) return;
    (async () => {
      await supabase.rpc("mark_all_notifications_read");
      qc.invalidateQueries({ queryKey });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, unread]);

  // Realtime: novas notificações destinadas ao usuário (all ou user).
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new as NotificationRow;
          if (n.target === "all" || (n.target === "user" && n.target_user_id === user.id)) {
            qc.invalidateQueries({ queryKey });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notification_reads", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markOneRead = async (id: string) => {
    await supabase.rpc("mark_notification_read", { p_notification_id: id });
    qc.invalidateQueries({ queryKey });
  };

  if (!user) {
    return (
      <Link
        to="/login"
        aria-label="Notificações"
        className="press grid h-9 w-9 place-items-center rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-white"
      >
        <Bell className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ""}`}
          className="press relative grid h-9 w-9 place-items-center rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-white"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] rounded-t-2xl border-[#1a1a1a] bg-black p-0 text-white"
      >
        <SheetHeader className="border-b border-[#1a1a1a] p-4">
          <SheetTitle className="text-white">Notificações</SheetTitle>
          <div className="mt-3 inline-flex self-start rounded-full border border-[#2a2a2a] bg-[#0f0f0f] p-0.5 text-[11px] font-semibold">
            <button
              onClick={() => setOnlyUnread(false)}
              className={`press rounded-full px-3 py-1 ${!onlyUnread ? "bg-[#68ed00] text-black" : "text-[#aaa]"}`}
            >
              Todas
            </button>
            <button
              onClick={() => setOnlyUnread(true)}
              className={`press rounded-full px-3 py-1 ${onlyUnread ? "bg-[#68ed00] text-black" : "text-[#aaa]"}`}
            >
              Não lidas{unread > 0 ? ` (${unread > 9 ? "9+" : unread})` : ""}
            </button>
          </div>
        </SheetHeader>
        <div className="max-h-[70dvh] overflow-y-auto">
          {query.isLoading ? (
            <div className="p-6 text-center text-sm text-[#888]">Carregando…</div>
          ) : visible.length === 0 ? (
            <div className="grid place-items-center gap-2 p-10 text-center">
              <Inbox className="h-10 w-10 text-[#333]" />
              <p className="text-sm text-[#888]">
                {onlyUnread ? "Nenhuma notificação não lida" : "Nenhuma notificação por enquanto"}
              </p>
            </div>
          ) : (
            <>
            <ul className="divide-y divide-[#1a1a1a]">
              {visible.map((n) => {
                const Icon = iconFor(n.type);
                const isRead = n.notification_reads?.length > 0;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => !isRead && markOneRead(n.id)}
                      className={`press flex w-full gap-3 px-4 py-3 text-left ${
                        isRead ? "bg-transparent" : "bg-[#68ed00]/5"
                      }`}
                    >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1a1a1a] text-[#68ed00]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">
                          {n.title}
                        </p>
                        {!isRead && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-3 text-xs text-[#aaa]">{n.body}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-[#666]">
                        {relativeTime(n.created_at)}
                      </p>
                    </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {query.hasNextPage && (
              <div className="p-4">
                <button
                  onClick={() => query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                  className="press w-full rounded-full border border-[#2a2a2a] bg-[#0f0f0f] py-2 text-[12px] font-semibold text-white disabled:opacity-50"
                >
                  {query.isFetchingNextPage ? "Carregando…" : "Ver mais"}
                </button>
              </div>
            )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}