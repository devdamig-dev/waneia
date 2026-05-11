"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Brain,
  Building2,
  Command,
  CreditCard,
  Gauge,
  HelpCircle,
  MegaphoneIcon,
  MessageCircleMore,
  Plug,
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
  hint?: string;
  group: "navegar" | "crear" | "configurar";
  icon: typeof Search;
  href?: string;
  onRun?: () => void;
  keywords?: string;
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const actions: Action[] = useMemo(
    () => [
      { id: "n-inicio", label: "Ir a Inicio", group: "navegar", icon: Gauge, href: "/dashboard", keywords: "dashboard home" },
      { id: "n-conv", label: "Ir a Conversaciones", group: "navegar", icon: MessageCircleMore, href: "/dashboard/conversaciones", keywords: "inbox chat" },
      { id: "n-leads", label: "Ir a Leads", group: "navegar", icon: TrendingUp, href: "/dashboard/leads", keywords: "pipeline crm kanban" },
      { id: "n-cont", label: "Ir a Contactos", group: "navegar", icon: Building2, href: "/dashboard/contactos", keywords: "audiencia clientes" },
      { id: "n-aut", label: "Ir a Automatizaciones", group: "navegar", icon: Bot, href: "/dashboard/automatizaciones" },
      { id: "n-bots", label: "Ir a Flujos de bot", group: "navegar", icon: Workflow, href: "/dashboard/bots" },
      { id: "n-camp", label: "Ir a Campañas", group: "navegar", icon: MegaphoneIcon, href: "/dashboard/campanias" },
      { id: "n-ia", label: "Ir a IA · Centro", group: "navegar", icon: Brain, href: "/dashboard/ia" },
      { id: "n-kb", label: "Ir a Base de conocimiento", group: "navegar", icon: BookOpen, href: "/dashboard/base-conocimiento" },
      { id: "n-tpl", label: "Ir a Plantillas", group: "navegar", icon: MessageCircleMore, href: "/dashboard/plantillas" },
      { id: "n-an", label: "Ir a Analítica", group: "navegar", icon: BarChart3, href: "/dashboard/analytics" },
      { id: "n-eq", label: "Ir a Equipo", group: "navegar", icon: UsersRound, href: "/dashboard/equipo" },
      { id: "n-fac", label: "Ir a Facturación", group: "navegar", icon: CreditCard, href: "/dashboard/facturacion" },
      { id: "n-conf", label: "Ir a Configuración", group: "navegar", icon: Settings, href: "/dashboard/configuracion" },
      { id: "n-wpp", label: "Ir a Integración WhatsApp", group: "navegar", icon: Plug, href: "/dashboard/integracion-whatsapp" },
      { id: "n-help", label: "Ir a Centro de ayuda", group: "navegar", icon: HelpCircle, href: "/dashboard/ayuda" },
      { id: "c-cat", label: "Configurar categorías", group: "configurar", icon: Settings, href: "/dashboard/configuracion/categorias" },
      { id: "c-pip", label: "Configurar pipelines", group: "configurar", icon: TrendingUp, href: "/dashboard/configuracion/pipelines" },
      { id: "c-dep", label: "Configurar departamentos y colas", group: "configurar", icon: UsersRound, href: "/dashboard/configuracion/departamentos" },
      { id: "x-lead", label: "Crear lead", group: "crear", icon: Plus, href: "/dashboard/leads", keywords: "nuevo cliente" },
      { id: "x-cont", label: "Agregar contacto", group: "crear", icon: Plus, href: "/dashboard/contactos" },
      { id: "x-tpl", label: "Crear plantilla", group: "crear", icon: Plus, href: "/dashboard/plantillas" },
      { id: "x-bot", label: "Crear flujo de bot", group: "crear", icon: Plus, href: "/dashboard/bots" },
      { id: "x-aut", label: "Crear automatización", group: "crear", icon: Plus, href: "/dashboard/automatizaciones" },
      { id: "x-camp", label: "Crear campaña", group: "crear", icon: Plus, href: "/dashboard/campanias" },
      { id: "x-kb", label: "Cargar artículo de conocimiento", group: "crear", icon: Plus, href: "/dashboard/base-conocimiento" },
    ],
    [],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter((a) => a.label.toLowerCase().includes(q) || a.keywords?.toLowerCase().includes(q) || a.group.includes(q));
  }, [actions, query]);

  const grouped = useMemo(() => {
    const out: Record<string, Action[]> = { navegar: [], crear: [], configurar: [] };
    filtered.forEach((a) => out[a.group].push(a));
    return out;
  }, [filtered]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isToggle = (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
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
        if (!target) return;
        setOpen(false);
        if (target.href) router.push(target.href);
        target.onRun?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active, router]);

  useEffect(() => { setActive(0); }, [query]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" aria-modal role="dialog">
      <button onClick={() => setOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Cerrar" />
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-white/15 bg-[#070b1c]/98 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar acción, módulo o atajo…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
          />
          <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">esc</span>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-zinc-500">Sin resultados.</p>
          ) : (
            (["navegar", "crear", "configurar"] as const).map((group) => grouped[group].length > 0 && (
              <div key={group} className="mb-2">
                <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-500">{group === "navegar" ? "Ir a" : group === "crear" ? "Crear" : "Configurar"}</p>
                <div className="space-y-0.5">
                  {grouped[group].map((a) => {
                    const idxGlobal = filtered.findIndex((x) => x.id === a.id);
                    const isActive = idxGlobal === active;
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.id}
                        onMouseEnter={() => setActive(idxGlobal)}
                        onClick={() => { setOpen(false); if (a.href) router.push(a.href); a.onRun?.(); }}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${isActive ? "bg-cyan-500/15 text-cyan-100" : "hover:bg-white/5"}`}
                      >
                        <Icon className="h-4 w-4 text-zinc-400" />
                        <span className="flex-1">{a.label}</span>
                        {isActive ? <ArrowRight className="h-3.5 w-3.5 text-cyan-200" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-[10px] text-zinc-500">
          <span className="inline-flex items-center gap-1"><Command className="h-3 w-3" />K para abrir / cerrar</span>
          <span className="inline-flex items-center gap-1"><Bell className="h-3 w-3" /> tip: ↑ ↓ y Enter</span>
        </div>
      </div>
    </div>
  );
}
