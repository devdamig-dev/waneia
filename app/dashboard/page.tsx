"use client";

import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, Clock3, Sparkles, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { conversations, leads, automationRules } from "@/data/mock-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { workspaces } from "@/data/saas-data";

const quickActions = [
  { label: "Crear automatización", href: "/dashboard/automatizaciones" },
  { label: "Revisar leads", href: "/dashboard/leads" },
  { label: "Invitar miembro", href: "/dashboard/equipo" },
  { label: "Conectar WhatsApp", href: "/dashboard/integracion-whatsapp" },
];

export default function DashboardPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const workspaceConversations = conversations.filter((item) => item.workspaceId === activeWorkspaceId);
  const workspaceLeads = leads.filter((item) => item.workspaceId === activeWorkspaceId);
  const workspaceAutomations = automationRules.filter((item) => item.workspaceId === activeWorkspaceId);
  const total = workspaceConversations.length;

  return (
    <section className="space-y-6">
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Workspace overview</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">{activeWorkspace.name} · Operación comercial saludable</h2>
            <p className="mt-2 max-w-3xl text-zinc-300">WANEIA está listo para escalar en multi-tenant: roles, onboarding y facturación por workspace.</p>
          </div>
          <div className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100 inline-flex items-center gap-1">
            <Sparkles className="h-4 w-4" /> Plan actual: {activeWorkspace.plan}
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className="group rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-cyan-300/40 hover:bg-cyan-500/10">
              <span className="flex items-center justify-between">{action.label}<ArrowRight className="h-4 w-4 opacity-50 transition group-hover:translate-x-1 group-hover:opacity-100" /></span>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-sm text-zinc-300">Completá tu configuración inicial</p>
        <p className="mt-1 text-2xl font-bold">Tu workspace está {activeWorkspace.onboardingCompletion}% listo</p>
        <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${activeWorkspace.onboardingCompletion}%` }} /></div>
        <Link href="/dashboard/onboarding" className="mt-3 inline-flex text-sm text-cyan-200">Continuar onboarding <ArrowRight className="ml-1 h-4 w-4" /></Link>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-sm text-zinc-400">Conversaciones</p><p className="mt-1 text-2xl font-bold">{total}</p></Card>
        <Card className="p-4"><p className="text-sm text-zinc-400">Leads activos</p><p className="mt-1 text-2xl font-bold">{workspaceLeads.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-zinc-400">Automatizaciones</p><p className="mt-1 text-2xl font-bold">{workspaceAutomations.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-zinc-400">Workspaces totales</p><p className="mt-1 text-2xl font-bold">{workspaces.length}</p></Card>
      </div>

      <Card className="p-5">
        <h3 className="text-lg font-semibold">Resumen ejecutivo</h3>
        <p className="mt-2 text-sm text-zinc-300 inline-flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-300" /> Conversión estimada 34%, automatización operativa 91% y tiempo de respuesta 2m 40s.</p>
        <p className="mt-2 text-sm text-zinc-300 inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-300" /> Arquitectura preparada para billing, RBAC, onboarding y conexión WhatsApp API futura.</p>
        <p className="mt-2 text-sm text-zinc-300 inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-violet-300" /> Próximo hito recomendado: finalizar integración WhatsApp y publicar automatización inicial.</p>
      </Card>

      <Card className="p-5">
        <h3 className="text-lg font-semibold inline-flex items-center gap-2"><Bot className="h-4 w-4 text-emerald-300" /> Recomendación WANEIA</h3>
        <p className="mt-2 text-sm text-zinc-300">Priorizá conversaciones de presupuesto con ticket alto y asigná seguimiento humano en menos de 15 minutos.</p>
      </Card>
    </section>
  );
}
