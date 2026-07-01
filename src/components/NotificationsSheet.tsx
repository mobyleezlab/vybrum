import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

  const query = useQuery({
    queryKey: ["notifications", user?.id ?? "anon"],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async (): Promise<NotificationRow[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, notification_reads!left(read_at)")
        .or(`target.eq.all,target_user_id.eq.${user!.id}`)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as unknown as NotificationRow[];
    },
  });

  const notifications = query.data ?? [];
  const unread = useMemo(
    () => notifications.filter((n) => !n.notification_reads?.length).length,
    [notifications],
  );

  useEffect(() => {
    if (!open || !user || unread === 0) return;
    (async () => {
      await supabase.rpc("mark_all_notifications_read");
      qc.invalidateQueries({ queryKey: ["notifications", user.id] });
    })();
  }, [open, user, unread, qc]);

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
        </SheetHeader>
        <div className="max-h-[70dvh] overflow-y-auto">
          {query.isLoading ? (
            <div className="p-6 text-center text-sm text-[#888]">Carregando…</div>
          ) : notifications.length === 0 ? (
            <div className="grid place-items-center gap-2 p-10 text-center">
              <Inbox className="h-10 w-10 text-[#333]" />
              <p className="text-sm text-[#888]">Nenhuma notificação por enquanto</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#1a1a1a]">
              {notifications.map((n) => {
                const Icon = iconFor(n.type);
                const isRead = n.notification_reads?.length > 0;
                return (
                  <li
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 ${
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
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}