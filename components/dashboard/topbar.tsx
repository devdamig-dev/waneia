"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { workspaces } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";

const navItems = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/dashboard/conversaciones", label: "Conversaciones" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/contactos", label: "Contactos" },
  { href: "/dashboard/automatizaciones", label: "Automatizaciones" },
  { href: "/dashboard/campanias", label: "Campañas" },
  { href: "/dashboard/analytics", label: "Analítica" },
  { href: "/dashboard/equipo", label: "Equipo" },
  { href: "/dashboard/facturacion", label: "Facturación" },
  { href: "/dashboard/configuracion", label: "Configuración" },
];

export function Topbar() {
  const { activeWorkspaceId, setActiveWorkspaceId, activeWorkspace } = useWorkspace();
  const pathname = usePathname();
  const current = navItems.find((n) => pathname === n.href);

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-zinc-400">
        <Search className="h-4 w-4" />
        <span className="text-sm">{current ? `Estás en ${current.label}` : "Buscar conversaciones, contactos o etiquetas"}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-2 py-1.5">
          <span className="hidden text-[10px] uppercase tracking-wide text-zinc-500 sm:inline">Workspace</span>
          <select
            value={activeWorkspaceId}
            onChange={(event) => setActiveWorkspaceId(event.target.value)}
            className="bg-transparent text-sm font-medium text-zinc-100 outline-none"
            aria-label="Seleccionar workspace"
          >
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id} className="bg-[#0b1023]">
                {workspace.name} · {workspace.plan}
              </option>
            ))}
          </select>
        </div>
        <Link href="/dashboard/onboarding" className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100 hover:bg-emerald-500/20">
          Configuración inicial {activeWorkspace.onboardingCompletion}%
        </Link>
        <button className="rounded-xl border border-white/10 bg-white/10 p-2 text-zinc-200" aria-label="Notificaciones"><Bell className="h-4 w-4" /></button>
        <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/20 px-3 py-2 text-sm font-semibold" title="Camila Romero">CR</div>
      </div>
      <nav className="order-last flex w-full flex-wrap gap-1 overflow-x-auto pt-2 text-xs lg:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={`rounded-lg px-2 py-1 ${pathname === item.href ? "bg-cyan-500/20 text-cyan-100" : "bg-white/5 text-zinc-300"}`}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
