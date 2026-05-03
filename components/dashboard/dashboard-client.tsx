"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Clock3,
  Flame,
  MessageCircleMore,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  automationRules,
  campaigns,
  contacts,
  conversations,
  leads,
  pipelineStages,
} from "@/data/mock-data";
import { teamMembers, usageByWorkspace } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { CategoryBadge } from "@/components/dashboard/category-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";

const quickActions = [
  { label: "Conversaciones", href: "/dashboard/conversaciones", icon: MessageCircleMore },
  { label: "Pipeline", href: "/dashboard/leads", icon: TrendingUp },
  { label: "Contactos", href: "/dashboard/contactos", icon: Users },
  { label: "Automatizaciones", href: "/dashboard/automatizaciones", icon: Bot },
  { label: "Campañas", href: "/dashboard/campanias", icon: Sparkles },
  { label: "Equipo", href: "/dashboard/equipo", icon: UserPlus },
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export function DashboardClient() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const wsConversations = conversations.filter((c) => c.workspaceId === activeWorkspaceId);
  const wsLeads = leads.filter((l) => l.workspaceId === activeWorkspaceId);
  const wsContacts = contacts.filter((c) => c.workspaceId === activeWorkspaceId);
  const wsAutomations = automationRules.filter((a) => a.workspaceId === activeWorkspaceId);
  const wsCampaigns = campaigns.filter((c) => c.workspaceId === activeWorkspaceId);
  const wsAgents = teamMembers.filter((m) => m.workspaceId === activeWorkspaceId);
  const usage = usageByWorkspace.find((u) => u.workspaceId === activeWorkspaceId);

  const slaAlerts = wsConversations.filter((c) => c.slaMinutesRemaining <= 5).sort((a, b) => a.slaMinutesRemaining - b.slaMinutesRemaining);
  const hotLeads = [...wsLeads].sort((a, b) => b.estimatedValue - a.estimatedValue).slice(0, 4);
  const pipelineValue = wsLeads
    .filter((l) => l.stage !== "perdido" && l.stage !== "ganado")
    .reduce((acc, l) => acc + l.estimatedValue, 0);
  const wonValue = wsLeads.filter((l) => l.stage === "ganado").reduce((acc, l) => acc + l.estimatedValue, 0);
  const automationCoverage = wsAutomations.length === 0 ? 0 : Math.round((wsAutomations.filter((a) => a.status === "activa").length / wsAutomations.length) * 100);
  const conversionRate = wsLeads.length === 0 ? 0 : Math.round((wsLeads.filter((l) => l.stage === "ganado").length / wsLeads.length) * 100);
  const avgResponseMin = wsAgents.length === 0 ? 0 : Math.round(wsAgents.reduce((acc, a) => acc + a.responseTimeMinutes, 0) / wsAgents.length);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Workspace overview</p>
            <h2 className="mt-1 text-3xl font-bold">{activeWorkspace.name}</h2>
            <p className="mt-1 text-sm text-zinc-300">{activeWorkspace.industry} · {activeWorkspace.country} · Plan {activeWorkspace.plan}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1 text-emerald-100">WhatsApp · {activeWorkspace.whatsappStatus}</span>
            <span className="rounded-full border border-cyan-300/40 bg-cyan-500/10 px-3 py-1 text-cyan-100">Onboarding {activeWorkspace.onboardingCompletion}%</span>
            <Link href="/dashboard/onboarding" className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-200 hover:bg-white/10">Continuar setup <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 transition hover:border-cyan-300/40 hover:bg-cyan-500/10">
              <span className="inline-flex items-center gap-2"><action.icon className="h-4 w-4" />{action.label}</span>
              <ArrowRight className="h-4 w-4 opacity-50 transition group-hover:translate-x-1 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Conversaciones hoy</p>
          <p className="mt-1 text-3xl font-bold">{wsConversations.length}</p>
          <p className="mt-1 text-xs text-emerald-300">{wsConversations.filter((c) => c.status === "ganada").length} ganadas · {wsConversations.filter((c) => c.status === "sin responder").length} sin responder</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Pipeline activo</p>
          <p className="mt-1 text-3xl font-bold text-cyan-100">{formatCurrency(pipelineValue)}</p>
          <p className="mt-1 text-xs text-zinc-400">Cerrado este mes: {formatCurrency(wonValue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Cobertura automatización</p>
          <p className="mt-1 text-3xl font-bold text-emerald-100">{automationCoverage}%</p>
          <p className="mt-1 text-xs text-zinc-400">{wsAutomations.filter((a) => a.status === "activa").length}/{wsAutomations.length} reglas activas</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Conversión estimada</p>
          <p className="mt-1 text-3xl font-bold text-violet-100">{conversionRate}%</p>
          <p className="mt-1 text-xs text-zinc-400">Tiempo respuesta promedio: {avgResponseMin}m</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-rose-300" />Alertas SLA</p>
            <Link href="/dashboard/conversaciones" className="text-xs text-cyan-200">Ver inbox <ArrowRight className="ml-1 inline h-3 w-3" /></Link>
          </div>
          <div className="mt-3 space-y-2">
            {slaAlerts.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-emerald-200">Todo dentro del SLA. Buen ritmo del equipo.</p>
            ) : (
              slaAlerts.slice(0, 5).map((c) => (
                <Link key={c.id} href="/dashboard/conversaciones" className="flex items-center justify-between rounded-lg border border-rose-300/30 bg-rose-500/10 p-3 text-xs hover:bg-rose-500/15">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-rose-100">{c.customerName}</p>
                    <p className="truncate text-[11px] text-rose-200/80">{c.lastMessage}</p>
                  </div>
                  <div className="text-right text-[11px]">
                    <p className="text-rose-100">{c.slaMinutesRemaining <= 0 ? `Vencido ${Math.abs(c.slaMinutesRemaining)}m` : `${c.slaMinutesRemaining}m restantes`}</p>
                    <p className="text-rose-200/80">{c.category}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold inline-flex items-center gap-2"><Flame className="h-4 w-4 text-amber-300" />Leads calientes</p>
          <div className="mt-3 space-y-2">
            {hotLeads.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">No hay leads abiertos.</p>
            ) : (
              hotLeads.map((l) => (
                <Link key={l.id} href="/dashboard/leads" className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs hover:bg-white/10">
                  <div>
                    <p className="font-semibold">{l.name}</p>
                    <p className="text-[11px] text-zinc-400">{l.business}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-200">{formatCurrency(l.estimatedValue)}</p>
                    <StatusBadge status={l.stage} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold inline-flex items-center gap-2"><Users className="h-4 w-4 text-cyan-300" />Workload del equipo</p>
            <Link href="/dashboard/equipo" className="text-xs text-cyan-200">Ver equipo <ArrowRight className="ml-1 inline h-3 w-3" /></Link>
          </div>
          <div className="mt-3 space-y-2 text-xs">
            {wsAgents.map((a) => (
              <div key={a.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-[11px] text-zinc-400">{a.role} · {a.availability}</p>
                  </div>
                  <div className="text-right text-[11px] text-zinc-300">
                    <p>{a.assignedConversations} asignadas</p>
                    <p>{a.resolvedToday} resueltas hoy · {a.responseTimeMinutes}m</p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${Math.min(a.assignedConversations * 10, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold inline-flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-300" />Pipeline por etapa</p>
          <div className="mt-3 space-y-2 text-xs">
            {pipelineStages.map((s) => {
              const stageLeads = wsLeads.filter((l) => l.stage === s.id);
              const value = stageLeads.reduce((acc, l) => acc + l.estimatedValue, 0);
              return (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>{s.label}</span>
                    <span className="text-zinc-400">{stageLeads.length} · {formatCurrency(value)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400" style={{ width: `${Math.min(stageLeads.length * 20, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-semibold inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-300" />Resumen de salud</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" />Cobertura automática {automationCoverage}%</li>
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-400" />Tiempo respuesta promedio {avgResponseMin} min</li>
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" />{slaAlerts.length} conversaciones en riesgo SLA</li>
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-400" />{wsCampaigns.filter((c) => c.status === "programada").length} campañas programadas</li>
          </ul>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold inline-flex items-center gap-2"><Bot className="h-4 w-4 text-emerald-300" />Recomendación WANEIA</p>
          <p className="mt-2 text-sm text-zinc-300">Priorizá las {slaAlerts.length} conversaciones en riesgo SLA y reasigná {Math.max(0, wsConversations.filter((c) => !c.assignedAgentId).length)} sin agente. Tenés {hotLeads.length} leads calientes con potencial de cierre esta semana.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Link href="/dashboard/conversaciones" className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-center text-cyan-100">Atender SLA</Link>
            <Link href="/dashboard/leads" className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-center text-emerald-100">Cerrar leads</Link>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-violet-300" />Conversaciones pendientes</p>
          <div className="mt-3 space-y-2 text-xs">
            {wsConversations.slice(0, 4).map((c) => (
              <div key={c.id} className="rounded-lg border border-white/10 bg-white/5 p-2">
                <div className="flex items-center justify-between">
                  <p className="truncate font-semibold">{c.customerName}</p>
                  <CategoryBadge category={c.category} />
                </div>
                <p className="mt-1 line-clamp-1 text-[11px] text-zinc-400">{c.lastMessage}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {usage ? (
        <Card className="p-5">
          <p className="text-sm font-semibold">Consumo del plan {activeWorkspace.plan}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <Usage label="Conversaciones" used={usage.conversationsUsed} limit={usage.conversationsLimit} />
            <Usage label="Usuarios" used={usage.usersUsed} limit={usage.usersLimit} />
            <Usage label="Automatizaciones" used={usage.automationsUsed} limit={usage.automationsLimit} />
            <Usage label="Campañas" used={usage.campaignsUsed} limit={usage.campaignsLimit} />
          </div>
        </Card>
      ) : null}

      <Card className="p-5">
        <p className="text-sm font-semibold">Últimas {Math.min(wsContacts.length, 4)} interacciones nuevas</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {wsContacts.slice(0, 4).map((c) => (
            <div key={c.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
              <p className="font-semibold">{c.name}</p>
              <p className="text-[11px] text-zinc-400">{c.business} · {c.source}</p>
              <p className="mt-1 text-[11px] text-zinc-500">{c.lastInteraction}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Usage({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const tone = pct >= 90 ? "from-rose-400 to-amber-400" : pct >= 70 ? "from-amber-400 to-emerald-400" : "from-emerald-400 to-cyan-400";
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold">{used} / {limit >= 999 ? "∞" : limit}</p>
      <div className="mt-2 h-1.5 rounded-full bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
