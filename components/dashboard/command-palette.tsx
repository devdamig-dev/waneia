"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Command,
  MessageCircleMore,
  Plus,
  Search,
  Settings,
  TrendingUp,
  UsersRound,
  Workflow,
} from "lucide-react";

type Action = {
  id: string;
  label: string;
  group: "navegar" | "crear" | "configurar";
  icon: typeof Search;
  href: string;
  keywords?: string;
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const actions: Action[] = useMemo(() => [
    { id: "inbox", label: "Ir al Inbox", group: "navegar", icon: MessageCircleMore, href: "/dashboard/conversaciones", keywords: "whatsapp chat conversaciones" },
    { id: "ventas", label: "Ir a Ventas", group: "navegar", icon: TrendingUp, href: "/dashboard/leads", keywords: "crm pipeline leads oportunidades" },
    { id: "contactos", label: "Ir a Contactos", group: "navegar", icon: UsersRound, href: "/dashboard/contactos", keywords: "clientes" },
    { id: "automatizaciones", label: "Ir a Automatizaciones", group: "navegar", icon: Workflow, href: "/dashboard/automatizaciones" },
    { id: "reportes", label: "Ir a Reportes", group: "navegar", icon: BarChart3, href: "/dashboard/analytics" },
    { id: "crear-lead", label: "Crear oportunidad", group: "crear", icon: Plus, href: "/dashboard/leads", keywords: "lead venta" },
    { id: "config", label: "Configuración general", group: "configurar", icon: Settings, href: "/dashboard/configuracion" },
    { id: "pipeline", label: "Configurar pipeline", group: "configurar", icon: TrendingUp, href: "/dashboard/configuracion/pipelines" },
    { id: "departamentos", label: "Configurar equipos y colas", group: "configurar", icon: UsersRound, href: "/dashboard/configuracion/departamentos" },
  ], []);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter((a) => `${a.label} ${a.keywords ?? ""} ${a.group}`.toLowerCase().includes(q));
  }, [actions, query]);

  const grouped = useMemo(() => {
    const out: Record<string, Action[]> = { navegar: [], crear: [], configurar: [] };
    filtered.forEach((a) => out[a.group].push(a));
    return out;
  }, [filtered]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isToggle = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isToggle) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter") {
        e.preventDefault();
        const target = filtered[active];
        if (target) {
          setOpen(false);
          router.push(target.href);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active, router]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" aria-modal role="dialog">
      <button onClick={() => setOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Cerrar" />
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-white/15 bg-[#070b1c]/98 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
          <Search className="h-4 w-4 text-zinc-400" />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente, venta o acción…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500" />
          <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">esc</span>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {(["navegar", "crear", "configurar"] as const).map((group) => grouped[group].length > 0 && (
            <div key={group} className="mb-2">
              <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-500">{group === "navegar" ? "Ir a" : group === "crear" ? "Crear" : "Configurar"}</p>
              {grouped[group].map((a) => {
                const idx = filtered.findIndex((x) => x.id === a.id);
                const Icon = a.icon;
                return (
                  <button key={a.id} onMouseEnter={() => setActive(idx)} onClick={() => { setOpen(false); router.push(a.href); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${idx === active ? "bg-cyan-500/15 text-cyan-100" : "hover:bg-white/5"}`}>
                    <Icon className="h-4 w-4 text-zinc-400" />
                    <span className="flex-1">{a.label}</span>
                    {idx === active ? <ArrowRight className="h-3.5 w-3.5" /> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-[10px] text-zinc-500">
          <span className="inline-flex items-center gap-1"><Command className="h-3 w-3" />K para abrir</span>
          <span>↑ ↓ Enter</span>
        </div>
      </div>
    </div>
  );
}
