"use client";

import {
  BarChart3,
  Building2,
  Gauge,
  MessageCircleMore,
  Plug,
  Settings,
  Tags,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { cn } from "@/lib/utils";
import { BUILD_TAG } from "@/lib/version";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Gauge;
  group: string;
  badge?: string;
};

const items: NavItem[] = [
  { href: "/dashboard", label: "Resumen", icon: Gauge, group: "gestión" },
  { href: "/dashboard/conversaciones", label: "Conversaciones", icon: MessageCircleMore, group: "gestión" },
  { href: "/dashboard/contactos", label: "Contactos", icon: Building2, group: "gestión" },
  { href: "/dashboard/equipo", label: "Vendedores", icon: UsersRound, group: "operación" },
  { href: "/dashboard/configuracion/etiquetas", label: "Etiquetas", icon: Tags, group: "operación" },
  { href: "/dashboard/analytics", label: "Reportes", icon: BarChart3, group: "insights" },
  { href: "/dashboard/integracion-whatsapp", label: "Conexión WhatsApp", icon: Plug, group: "sistema" },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings, group: "sistema" },
];

const groupOrder = ["gestión", "operación", "insights", "sistema"];
const groupLabels: Record<string, string> = {
  gestión: "Gestión",
  operación: "Operación observada",
  insights: "Insights",
  sistema: "Sistema",
};

export function Sidebar() {
  const pathname = usePathname();
  const { activeWorkspace } = useWorkspace();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#070b1c]/90 p-6 lg:block">
      <div className="mb-6 overflow-hidden rounded-2xl border border-sky-400/25 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,.18),transparent_50%),rgba(14,22,42,.8)] p-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-sky-300">NEXO · WHATSAPP OPS</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Gestión invisible</h1>
        <p className="mt-1 text-xs leading-5 text-zinc-400">El equipo usa WhatsApp. Vos ves toda la operación.</p>
      </div>
      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Negocio observado</p>
        <p className="mt-1 font-semibold">{activeWorkspace.name}</p>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          WhatsApp Business conectado
        </div>
      </div>
      <nav className="space-y-4">
        {groupOrder.map((g) => (
          <div key={g}>
            <p className="mb-1 px-2 text-[10px] uppercase tracking-[0.2em] text-zinc-600">{groupLabels[g]}</p>
            <div className="space-y-1">
              {items.filter((i) => i.group === g).map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white",
                      active && "border border-sky-300/15 bg-sky-400/10 text-sky-100",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? <span className="rounded-full border border-sky-300/30 bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-100">{item.badge}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-6 rounded-xl border border-white/8 bg-black/10 p-3 text-[11px] text-zinc-500">
        <p className="font-medium text-zinc-300">Modo shadow</p>
        <p className="mt-1">Sin distribución de leads. La operación real ocurre en WhatsApp Web.</p>
      </div>
      <p className="mt-4 border-t border-white/5 pt-3 text-[10px] uppercase tracking-wide text-zinc-600" title="Versión del build">
        Build · {BUILD_TAG}
      </p>
    </aside>
  );
}
