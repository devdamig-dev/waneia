"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Bot, CheckCheck, MegaphoneIcon, Sparkles, TrendingUp, UserPlus } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { useNotifications, timeAgo, NotificationKind } from "@/lib/notifications";

const kindMeta: Record<NotificationKind, { icon: typeof Bell; tone: string; label: string }> = {
  sla: { icon: AlertTriangle, tone: "border-rose-300/30 bg-rose-500/10 text-rose-100", label: "SLA" },
  asignacion: { icon: UserPlus, tone: "border-cyan-300/30 bg-cyan-500/10 text-cyan-100", label: "Asignación" },
  lead: { icon: TrendingUp, tone: "border-emerald-300/30 bg-emerald-500/10 text-emerald-100", label: "Lead" },
  ia: { icon: Sparkles, tone: "border-violet-300/30 bg-violet-500/10 text-violet-100", label: "IA" },
  automation: { icon: Bot, tone: "border-amber-300/30 bg-amber-500/10 text-amber-100", label: "Automatización" },
  campaign: { icon: MegaphoneIcon, tone: "border-sky-300/30 bg-sky-500/10 text-sky-100", label: "Campaña" },
  sistema: { icon: Bell, tone: "border-zinc-300/30 bg-zinc-500/10 text-zinc-200", label: "Sistema" },
};

export function NotificationsBell() {
  const { items, unread, markAllRead, markRead, dismissAll } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-xl border border-white/10 bg-white/10 p-2 text-zinc-200 hover:bg-white/15"
        aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Notificaciones"
        description={`${unread} sin leer · ${items.length} totales`}
        width="max-w-md"
        footer={
          <div className="flex items-center justify-between gap-2 text-xs">
            <button onClick={dismissAll} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300 hover:bg-white/10">Limpiar todo</button>
            <button onClick={markAllRead} className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/30 bg-cyan-500/15 px-3 py-1.5 text-cyan-100 hover:bg-cyan-500/20">
              <CheckCheck className="h-3.5 w-3.5" />Marcar todo como leído
            </button>
          </div>
        }
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-10 w-10 text-zinc-600" />
            <p className="mt-3 text-sm font-semibold">Sin notificaciones nuevas</p>
            <p className="mt-1 text-xs text-zinc-500">Te avisamos cuando haya alertas de SLA, leads nuevos o eventos importantes.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const meta = kindMeta[n.kind];
              const Icon = meta.icon;
              const Body = (
                <div className={`flex items-start gap-2 rounded-xl border p-3 transition ${n.read ? "border-white/5 bg-white/[0.02]" : "border-white/10 bg-white/5"}`}>
                  <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${meta.tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${n.read ? "text-zinc-300" : "font-semibold text-white"}`}>{n.title}</p>
                      <span className="shrink-0 text-[10px] text-zinc-500">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-400">{n.body}</p>
                    <span className={`mt-1 inline-block rounded-full border px-1.5 py-0.5 text-[10px] ${meta.tone}`}>{meta.label}</span>
                  </div>
                  {!n.read ? <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" /> : null}
                </div>
              );
              return (
                <li key={n.id} onClick={() => markRead(n.id)}>
                  {n.href ? <Link href={n.href} onClick={() => setOpen(false)}>{Body}</Link> : Body}
                </li>
              );
            })}
          </ul>
        )}
      </Drawer>
    </>
  );
}
