"use client";

import { Command, LogOut, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/dashboard/conversaciones", label: "Inbox" },
  { href: "/dashboard/leads", label: "Ventas" },
  { href: "/dashboard/contactos", label: "Contactos" },
  { href: "/dashboard/automatizaciones", label: "Automatizaciones" },
  { href: "/dashboard/analytics", label: "Reportes" },
  { href: "/dashboard/integracion-whatsapp", label: "WhatsApp" },
  { href: "/dashboard/equipo", label: "Equipo" },
  { href: "/dashboard/configuracion", label: "Configuración" },
];

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "WA";
}

export function Topbar() {
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, currentUserName, currentUserEmail } = useWorkspace();
  const pathname = usePathname();
  const current = navItems.find((item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)));

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <button
        onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-zinc-400 hover:border-cyan-300/30 hover:text-zinc-200 lg:max-w-xl"
        aria-label="Abrir buscador rápido"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate text-sm">{current ? current.label : "Buscar clientes, conversaciones o ventas"}</span>
        <span className="ml-auto hidden items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 sm:inline-flex">
          <Command className="h-3 w-3" />K
        </span>
      </button>

      <div className="flex items-center gap-2">
        <select
          value={activeWorkspaceId}
          onChange={(event) => setActiveWorkspaceId(event.target.value)}
          className="max-w-44 rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-sm font-medium text-zinc-100 outline-none"
          aria-label="Seleccionar negocio"
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
          ))}
        </select>
        <NotificationsBell />
        <div
          className="rounded-xl border border-cyan-300/30 bg-cyan-400/20 px-3 py-2 text-sm font-semibold"
          title={currentUserEmail || currentUserName}
        >
          {initials(currentUserName)}
        </div>
        <button onClick={signOut} className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 hover:bg-white/10 hover:text-white" title="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <nav className="order-last flex w-full gap-1 overflow-x-auto pt-2 text-xs lg:hidden">
        {navItems.slice(0, 6).map((item) => (
          <a key={item.href} href={item.href} className={`whitespace-nowrap rounded-lg px-2 py-1.5 ${pathname === item.href ? "bg-cyan-500/20 text-cyan-100" : "bg-white/5 text-zinc-300"}`}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
