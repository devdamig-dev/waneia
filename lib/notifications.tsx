"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type NotificationKind = "sla" | "asignacion" | "lead" | "ia" | "automation" | "campaign" | "sistema";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string; // ISO
  href?: string;
  read: boolean;
};

type Ctx = {
  items: Notification[];
  unread: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  push: (n: Omit<Notification, "id" | "createdAt" | "read">) => void;
  dismissAll: () => void;
};

const NotificationsContext = createContext<Ctx | null>(null);

const seed: Notification[] = [
  { id: "n1", kind: "sla", title: "SLA crítico · Carla Méndez", body: "Faltan 3 minutos para vencer el SLA de la conversación.", createdAt: new Date(Date.now() - 60 * 1000).toISOString(), href: "/dashboard/conversaciones", read: false },
  { id: "n2", kind: "lead", title: "Lead nuevo · Luis Arce", body: "Lead generado desde campaña Meta Ads. Score 78.", createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), href: "/dashboard/leads", read: false },
  { id: "n3", kind: "ia", title: "IA detectó oportunidad", body: "Carla mencionó \"placard 2.5m\" — alta probabilidad de compra.", createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(), href: "/dashboard/conversaciones", read: false },
  { id: "n4", kind: "asignacion", title: "Conversación asignada", body: "Lucía Acosta recibió 2 nuevas conversaciones.", createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), href: "/dashboard/equipo", read: true },
  { id: "n5", kind: "campaign", title: "Campaña enviada", body: "Recuperación churn Q1 envió 84 mensajes con 22% de respuesta.", createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(), href: "/dashboard/campanias", read: true },
  { id: "n6", kind: "automation", title: "Automatización pausada", body: "FAQ consultas online se pausó por baja confianza.", createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), href: "/dashboard/automatizaciones", read: true },
];

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Notification[]>(seed);

  const push = useCallback((n: Omit<Notification, "id" | "createdAt" | "read">) => {
    setItems((prev) => [{ ...n, id: `n-${Date.now()}`, createdAt: new Date().toISOString(), read: false }, ...prev]);
  }, []);
  const markAllRead = useCallback(() => setItems((prev) => prev.map((n) => ({ ...n, read: true }))), []);
  const markRead = useCallback((id: string) => setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))), []);
  const dismissAll = useCallback(() => setItems([]), []);

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);
  const value = useMemo(() => ({ items, unread, push, markRead, markAllRead, dismissAll }), [items, unread, push, markRead, markAllRead, dismissAll]);

  // Mock: push a "live" notification at random intervals for that "alive" feel during demos
  useEffect(() => {
    if (typeof window === "undefined") return;
    const samples: Array<Omit<Notification, "id" | "createdAt" | "read">> = [
      { kind: "ia", title: "IA: nuevo intent detectado", body: "Cliente con interés alto en cotización mayorista.", href: "/dashboard/conversaciones" },
      { kind: "sla", title: "SLA en riesgo", body: "Conversación 'Sin asignar' lleva 4m sin respuesta.", href: "/dashboard/conversaciones" },
      { kind: "lead", title: "Lead movido a Cotizando", body: "Sergio Lima avanzó en el pipeline.", href: "/dashboard/leads" },
    ];
    const t = setInterval(() => {
      const next = samples[Math.floor(Math.random() * samples.length)];
      if (next) {
        setItems((prev) => [{ ...next, id: `n-live-${Date.now()}`, createdAt: new Date().toISOString(), read: false }, ...prev].slice(0, 30));
      }
    }, 60000);
    return () => clearInterval(t);
  }, []);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.round(hours / 24);
  return `hace ${days}d`;
}
