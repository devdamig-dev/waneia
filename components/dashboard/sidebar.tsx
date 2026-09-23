"use client";

import {
  BarChart3,
  Gauge,
  MessageCircleMore,
  Plug,
  Settings,
  SlidersHorizontal,
  TrendingUp,
  UsersRound,
  Workflow,
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
  group: "principal" | "administrar";
};

const items: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: Gauge, group: "principal" },
  { href: "/dashboard/conversaciones", label: "Inbox", icon: MessageCircleMore, group: "principal" },
  { href: "/dashboard/leads", label: "Ventas", icon: TrendingUp, group: "principal" },
  { href: "/dashboard/contactos", label: "Contactos", icon: UsersRound, group: "principal" },
  { href: "/dashboard/automatizaciones", label: "Automatizaciones", icon: Workflow, group: "principal" },
  { href: "/dashboard/analytics", label: "Reportes", icon: BarChart3, group: "principal" },
  { href: "/dashboard/integracion-whatsapp", label: "WhatsApp", icon: Plug, group: "administrar" },
  { href: "/dashboard/equipo", label: "Equipo", icon: SlidersHorizontal, group: "administrar" },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings, group: "administrar" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { activeWorkspace } = useWorkspace();

  const renderItem = (item: NavItem) => {
    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white",
          active && "bg-white/15 text-white",
        )}
      >
        <item.icon className="h-4 w-4" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#070b1c]/90 p-5 lg:block">
      <div className="mb-6 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-300">WANEIA</p>
        <h1 className="mt-2 text-xl font-bold">WhatsApp + CRM</h1>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">Atendé, asigná y seguí cada venta desde un solo lugar.</p>
      </div>

      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Negocio</p>
        <p className="mt-1 truncate text-sm font-semibold">{activeWorkspace.name}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{activeWorkspace.industry}</p>
      </div>

      <nav className="space-y-6">
        <div>
          <p className="mb-2 px-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Trabajo diario</p>
          <div className="space-y-1">{items.filter((i) => i.group === "principal").map(renderItem)}</div>
        </div>
        <div>
          <p className="mb-2 px-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">Administrar</p>
          <div className="space-y-1">{items.filter((i) => i.group === "administrar").map(renderItem)}</div>
        </div>
      </nav>

      <p className="mt-6 border-t border-white/5 px-2 pt-3 text-[10px] text-zinc-600">CRM conversacional · {BUILD_TAG}</p>
    </aside>
  );
}
