"use client";

import { BarChart3, Bot, CreditCard, Gauge, MessageCircleMore, Settings, Users, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/dashboard/conversaciones", label: "Conversaciones", icon: MessageCircleMore },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/automatizaciones", label: "Automatizaciones", icon: Bot },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/equipo", label: "Equipo", icon: UsersRound },
  { href: "/dashboard/facturacion", label: "Facturación", icon: CreditCard },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { activeWorkspace } = useWorkspace();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#070b1c]/90 p-6 lg:block">
      <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">WANEIA</p>
        <h1 className="mt-2 text-2xl font-bold">Atención inteligente</h1>
        <p className="mt-1 text-sm text-zinc-300">Convertí más consultas en ventas.</p>
      </div>
      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-400">Workspace activo</p>
        <p className="mt-1 font-semibold">{activeWorkspace.name}</p>
        <p className="text-xs text-zinc-400">{activeWorkspace.industry} · Plan {activeWorkspace.plan}</p>
      </div>
      <nav className="space-y-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white",
                active && "bg-white/15 text-white",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
