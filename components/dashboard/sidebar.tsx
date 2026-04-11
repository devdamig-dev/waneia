"use client";

import { Bot, Gauge, MessageCircleMore, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/dashboard/conversaciones", label: "Conversaciones", icon: MessageCircleMore },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/automatizaciones", label: "Automatizaciones", icon: Bot },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#070b1c]/90 p-6 lg:block">
      <div className="mb-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">WANEIA</p>
        <h1 className="mt-2 text-2xl font-bold">Atención inteligente</h1>
        <p className="mt-1 text-sm text-zinc-300">Convertí más consultas en ventas.</p>
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
