"use client";

import { Card } from "@/components/ui/card";
import {
  automationRules,
  campaigns,
  conversations,
  leads,
} from "@/data/mock-data";
import { teamMembers } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { ConversationCategory } from "@/types/entities";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export function AnalyticsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const wsConv = conversations.filter((c) => c.workspaceId === activeWorkspaceId);
  const wsLeads = leads.filter((l) => l.workspaceId === activeWorkspaceId);
  const wsAuto = automationRules.filter((a) => a.workspaceId === activeWorkspaceId);
  const wsCamp = campaigns.filter((c) => c.workspaceId === activeWorkspaceId && c.status === "enviada");
  const wsAgents = teamMembers.filter((m) => m.workspaceId === activeWorkspaceId);

  const totalLeads = wsLeads.length;
  const wonLeads = wsLeads.filter((l) => l.stage === "ganado").length;
  const conversionRate = totalLeads === 0 ? 0 : Math.round((wonLeads / totalLeads) * 100);
  const pipelineValue = wsLeads.filter((l) => l.stage !== "perdido" && l.stage !== "ganado").reduce((acc, l) => acc + l.estimatedValue, 0);
  const wonValue = wsLeads.filter((l) => l.stage === "ganado").reduce((acc, l) => acc + l.estimatedValue, 0);
  const avgResponseMin = wsAgents.length === 0 ? 0 : Math.round(wsAgents.reduce((acc, a) => acc + a.responseTimeMinutes, 0) / wsAgents.length);
  const slaCompliance = wsConv.length === 0 ? 100 : Math.round((wsConv.filter((c) => c.slaMinutesRemaining > 0).length / wsConv.length) * 100);
  const humanIntervention = wsConv.length === 0 ? 0 : Math.round((wsConv.filter((c) => c.assignedAgentId).length / wsConv.length) * 100);

  const categories: ConversationCategory[] = ["presupuesto", "pedido", "consulta", "soporte humano"];
  const byCategory = categories.map((cat) => ({
    cat,
    count: wsConv.filter((c) => c.category === cat).length,
  }));
  const maxCatCount = Math.max(1, ...byCategory.map((b) => b.count));

  const stages = [
    { id: "nuevo", label: "Nuevos" },
    { id: "contactado", label: "Contactados" },
    { id: "cotizando", label: "Cotizando" },
    { id: "negociacion", label: "Negociación" },
    { id: "ganado", label: "Ganados" },
  ] as const;
  const funnel = stages.map((s) => ({
    label: s.label,
    count: wsLeads.filter((l) => l.stage === s.id).length,
  }));
  const funnelMax = Math.max(1, ...funnel.map((f) => f.count));

  const topAutomations = [...wsAuto].sort((a, b) => b.triggeredCount - a.triggeredCount).slice(0, 4);
  const topAgents = [...wsAgents].sort((a, b) => b.resolvedToday - a.resolvedToday).slice(0, 5);
  const topIntents = [
    { label: "Solicita cotización", count: wsConv.filter((c) => c.intent.toLowerCase().includes("cotizac") || c.intent.toLowerCase().includes("comercial")).length },
    { label: "Soporte / derivación humana", count: wsConv.filter((c) => c.intent.toLowerCase().includes("derivación") || c.intent.toLowerCase().includes("humana")).length },
    { label: "Coordinación / logística", count: wsConv.filter((c) => c.intent.toLowerCase().includes("coordinación") || c.intent.toLowerCase().includes("logística")).length },
    { label: "Exploración / consulta", count: wsConv.filter((c) => c.intent.toLowerCase().includes("explorac") || c.intent.toLowerCase().includes("consulta")).length },
  ].filter((i) => i.count > 0);

  const campaignTotals = wsCamp.reduce(
    (acc, c) => ({ open: acc.open + (c.openRate ?? 0), reply: acc.reply + (c.replyRate ?? 0), conv: acc.conv + (c.conversionRate ?? 0) }),
    { open: 0, reply: 0, conv: 0 },
  );
  const campaignAvg = {
    open: wsCamp.length === 0 ? 0 : Math.round(campaignTotals.open / wsCamp.length),
    reply: wsCamp.length === 0 ? 0 : Math.round(campaignTotals.reply / wsCamp.length),
    conv: wsCamp.length === 0 ? 0 : Math.round(campaignTotals.conv / wsCamp.length),
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Conversaciones" value={String(wsConv.length)} hint={`${wsConv.filter((c) => c.status === "ganada").length} ganadas`} />
        <Kpi label="Tiempo respuesta" value={`${avgResponseMin}m`} hint="Promedio del equipo" />
        <Kpi label="SLA compliance" value={`${slaCompliance}%`} hint={`${wsConv.filter((c) => c.slaMinutesRemaining <= 0).length} vencidas`} tone={slaCompliance >= 90 ? "emerald" : slaCompliance >= 70 ? "amber" : "rose"} />
        <Kpi label="Conversión" value={`${conversionRate}%`} hint={`${wonLeads} cierres`} tone="emerald" />
        <Kpi label="Pipeline" value={formatCurrency(pipelineValue)} hint={`Cerrado ${formatCurrency(wonValue)}`} tone="cyan" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold">Funnel comercial</p>
          <p className="text-xs text-zinc-400">De conversación a cierre.</p>
          <div className="mt-3 space-y-2">
            {funnel.map((step) => (
              <div key={step.label}>
                <div className="flex items-center justify-between text-xs">
                  <span>{step.label}</span>
                  <span className="text-zinc-400">{step.count}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400" style={{ width: `${(step.count / funnelMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold">Conversaciones por categoría</p>
          <p className="text-xs text-zinc-400">Distribución de intents detectados.</p>
          <div className="mt-3 space-y-2">
            {byCategory.map((c) => (
              <div key={c.cat}>
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize">{c.cat}</span>
                  <span className="text-zinc-400">{c.count}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${(c.count / maxCatCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold">Top automatizaciones</p>
          <div className="mt-3 space-y-2 text-sm">
            {topAutomations.length === 0 ? <p className="text-xs text-zinc-400">Sin automatizaciones activas.</p> : topAutomations.map((a) => (
              <div key={a.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{a.name}</p>
                  <span className="text-xs text-emerald-200">{a.replyRate}% reply</span>
                </div>
                <p className="text-[11px] text-zinc-400">{a.triggeredCount} ejecuciones · conversión estimada {a.conversionEstimate}%</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold">Performance por agente</p>
          <div className="mt-3 space-y-2 text-sm">
            {topAgents.map((a) => (
              <div key={a.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-[11px] text-zinc-400">{a.role}</p>
                  </div>
                  <div className="text-right text-[11px] text-zinc-300">
                    <p>{a.resolvedToday} resueltas hoy</p>
                    <p>{a.assignedConversations} asignadas · {a.responseTimeMinutes}m</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold">Top intents detectados</p>
          <div className="mt-3 space-y-2 text-sm">
            {topIntents.length === 0 ? <p className="text-xs text-zinc-400">Sin intents reconocidos en este workspace.</p> : topIntents.map((i) => (
              <div key={i.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs">
                <span>{i.label}</span>
                <span className="text-zinc-400">{i.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold">Performance de campañas</p>
          {wsCamp.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-400">Aún no hay campañas enviadas en este workspace.</p>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Open</p><p className="text-lg font-bold text-cyan-100">{campaignAvg.open}%</p></Card>
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Reply</p><p className="text-lg font-bold text-emerald-100">{campaignAvg.reply}%</p></Card>
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Conv</p><p className="text-lg font-bold text-violet-100">{campaignAvg.conv}%</p></Card>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                {wsCamp.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2">
                    <span>{c.name}</span>
                    <span className="text-zinc-400">{c.sentRecipients} enviados · {c.replyRate}% reply</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <p className="text-sm font-semibold">Alertas de salud del negocio</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3 text-sm">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3"><p className="text-xs text-zinc-400">Intervención humana</p><p className="text-lg font-bold">{humanIntervention}%</p><p className="text-[11px] text-zinc-500">Conversaciones con agente asignado.</p></div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3"><p className="text-xs text-zinc-400">Conversaciones sin agente</p><p className="text-lg font-bold text-amber-200">{wsConv.filter((c) => !c.assignedAgentId).length}</p><p className="text-[11px] text-zinc-500">Acción recomendada: rebalanceo.</p></div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3"><p className="text-xs text-zinc-400">Borradores de automatización</p><p className="text-lg font-bold text-violet-200">{wsAuto.filter((a) => a.status === "borrador" || a.status === "test").length}</p><p className="text-[11px] text-zinc-500">Pendientes de publicación.</p></div>
        </div>
      </Card>
    </div>
  );
}

function Kpi({ label, value, hint, tone = "default" }: { label: string; value: string; hint: string; tone?: "default" | "emerald" | "amber" | "rose" | "cyan" }) {
  const toneClass = {
    default: "text-white",
    emerald: "text-emerald-100",
    amber: "text-amber-100",
    rose: "text-rose-100",
    cyan: "text-cyan-100",
  }[tone];
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs text-zinc-400">{hint}</p>
    </Card>
  );
}
