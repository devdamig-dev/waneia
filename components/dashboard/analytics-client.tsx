"use client";

import Link from "next/link";
import {
  Clock3,
  MessageCircleMore,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { useCRMStore } from "@/lib/crm-store";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { Card } from "@/components/ui/card";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const stageLabels: Record<string, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  cotizando: "Presupuesto",
  negociacion: "Negociación",
  ganado: "Ganado",
  perdido: "Perdido",
};

export function AnalyticsClient() {
  const { activeWorkspaceId, teamMembers } = useWorkspace();
  const { contacts, conversations, leads } = useCRMStore();

  const wsContacts = contacts.filter((contact) => contact.workspaceId === activeWorkspaceId);
  const wsConversations = conversations.filter((conversation) => conversation.workspaceId === activeWorkspaceId);
  const wsLeads = leads.filter((lead) => lead.workspaceId === activeWorkspaceId);
  const wsAgents = teamMembers.filter((member) => member.workspaceId === activeWorkspaceId && member.status === "active");

  const openLeads = wsLeads.filter((lead) => lead.stage !== "ganado" && lead.stage !== "perdido");
  const wonLeads = wsLeads.filter((lead) => lead.stage === "ganado");
  const pipelineValue = openLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
  const wonValue = wonLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
  const conversion = wsLeads.length ? Math.round((wonLeads.length / wsLeads.length) * 100) : 0;
  const avgResponse = wsAgents.length
    ? Math.round(wsAgents.reduce((sum, agent) => sum + agent.responseTimeMinutes, 0) / wsAgents.length)
    : 0;

  const unassigned = wsConversations.filter(
    (conversation) =>
      !conversation.assignedAgentId &&
      conversation.status !== "cerrado" &&
      conversation.status !== "ganado" &&
      conversation.status !== "perdido",
  ).length;
  const urgent = wsConversations.filter(
    (conversation) =>
      conversation.status !== "cerrado" &&
      conversation.status !== "ganado" &&
      conversation.status !== "perdido" &&
      (conversation.priority === "alta" || conversation.slaMinutesRemaining <= 5),
  ).length;
  const followUps = wsConversations.filter(
    (conversation) =>
      Boolean(conversation.nextTask) &&
      conversation.status !== "cerrado" &&
      conversation.status !== "ganado" &&
      conversation.status !== "perdido",
  ).length;

  const stages = ["nuevo", "contactado", "cotizando", "negociacion", "ganado", "perdido"];
  const stageData = stages.map((stage) => ({
    stage,
    label: stageLabels[stage],
    count: wsLeads.filter((lead) => lead.stage === stage).length,
    value: wsLeads.filter((lead) => lead.stage === stage).reduce((sum, lead) => sum + lead.estimatedValue, 0),
  }));
  const maxStage = Math.max(1, ...stageData.map((item) => item.count));

  const sources = Array.from(new Set(wsLeads.map((lead) => lead.source))).map((source) => ({
    source,
    count: wsLeads.filter((lead) => lead.source === source).length,
    value: wsLeads.filter((lead) => lead.source === source).reduce((sum, lead) => sum + lead.estimatedValue, 0),
  })).sort((a, b) => b.count - a.count);
  const maxSource = Math.max(1, ...sources.map((item) => item.count));

  const team = [...wsAgents].sort((a, b) => b.resolvedToday - a.resolvedToday);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Conversaciones" value={String(wsConversations.length)} hint="en el negocio" icon={MessageCircleMore} />
        <Metric label="Respuesta promedio" value={`${avgResponse} min`} hint="del equipo" icon={Clock3} />
        <Metric label="Pipeline abierto" value={formatCurrency(pipelineValue)} hint={`${openLeads.length} oportunidades`} icon={TrendingUp} />
        <Metric label="Ventas ganadas" value={formatCurrency(wonValue)} hint={`${wonLeads.length} cierres`} icon={UserRoundCheck} />
        <Metric label="Conversión" value={`${conversion}%`} hint={`${wsContacts.length} contactos`} icon={UsersRound} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Pipeline de ventas</p>
              <p className="mt-1 text-xs text-zinc-500">Cuántas oportunidades hay en cada etapa.</p>
            </div>
            <Link href="/dashboard/leads" className="text-xs text-cyan-200">Ver Ventas →</Link>
          </div>
          <div className="mt-5 space-y-3">
            {stageData.map((item) => (
              <div key={item.stage}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span>{item.label}</span>
                  <span className="text-zinc-400">{item.count} · {formatCurrency(item.value)}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-400/70"
                    style={{ width: `${Math.max(item.count ? 8 : 0, (item.count / maxStage) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="font-semibold">Atención ahora</p>
          <p className="mt-1 text-xs text-zinc-500">Lo que necesita acción del equipo.</p>
          <div className="mt-4 space-y-2">
            <Link href="/dashboard/conversaciones" className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
              <span className="text-sm">Sin asignar</span>
              <span className="text-lg font-bold text-amber-200">{unassigned}</span>
            </Link>
            <Link href="/dashboard/conversaciones" className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
              <span className="text-sm">Urgentes</span>
              <span className="text-lg font-bold text-rose-200">{urgent}</span>
            </Link>
            <Link href="/dashboard/conversaciones" className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
              <span className="text-sm">Seguimientos</span>
              <span className="text-lg font-bold text-cyan-200">{followUps}</span>
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="font-semibold">Origen de oportunidades</p>
          <p className="mt-1 text-xs text-zinc-500">De dónde llegan las ventas que hoy están en el CRM.</p>
          <div className="mt-4 space-y-3">
            {sources.length === 0 ? (
              <p className="text-xs text-zinc-500">Todavía no hay oportunidades para analizar.</p>
            ) : sources.map((item) => (
              <div key={item.source}>
                <div className="flex items-center justify-between text-xs">
                  <span>{item.source}</span>
                  <span className="text-zinc-400">{item.count} · {formatCurrency(item.value)}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400/70"
                    style={{ width: `${Math.max(8, (item.count / maxSource) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="font-semibold">Equipo</p>
          <p className="mt-1 text-xs text-zinc-500">Carga y velocidad de atención por responsable.</p>
          <div className="mt-4 space-y-2">
            {team.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{agent.name}</p>
                  <p className="text-[10px] text-zinc-500">{agent.availability} · {agent.assignedConversations} asignadas</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">{agent.resolvedToday} resueltas</p>
                  <p className="text-[10px] text-zinc-500">{agent.responseTimeMinutes} min respuesta</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Lectura rápida</p>
            <p className="mt-1 text-xs text-zinc-500">Sin índices inventados: sólo datos operativos del CRM.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{wsContacts.length} contactos</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{wsLeads.length} oportunidades</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{wsAgents.length} integrantes</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof MessageCircleMore;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
        <Icon className="h-4 w-4 text-zinc-500" />
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </Card>
  );
}
