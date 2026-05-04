"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkles, AlertTriangle, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { automationRules, campaigns, conversations, leads } from "@/data/mock-data";
import { teamMembers } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { ConversationCategory } from "@/types/entities";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

// Mock previous-period values keyed by workspace
const previousPeriod: Record<string, { conversations: number; conversion: number; sla: number; responseMin: number; pipelineValue: number; }> = {
  "ws-1": { conversations: 6, conversion: 16, sla: 78, responseMin: 5, pipelineValue: 1850000 },
  "ws-2": { conversations: 3, conversion: 22, sla: 88, responseMin: 6, pipelineValue: 410000 },
  "ws-3": { conversations: 4, conversion: 28, sla: 92, responseMin: 3, pipelineValue: 320000 },
};

function delta(current: number, previous: number, invert = false) {
  if (previous === 0) return { pct: 0, up: false, neutral: true };
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return { pct: Math.abs(pct), up, neutral: pct === 0, good: invert ? !up : up };
}

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
  const unassigned = wsConv.filter((c) => !c.assignedAgentId).length;
  const slaAlerts = wsConv.filter((c) => c.slaMinutesRemaining <= 5).length;

  const prev = previousPeriod[activeWorkspaceId] ?? previousPeriod["ws-1"];

  const categories: ConversationCategory[] = ["presupuesto", "pedido", "consulta", "soporte humano"];
  const byCategory = categories.map((cat) => ({ cat, count: wsConv.filter((c) => c.category === cat).length }));
  const maxCatCount = Math.max(1, ...byCategory.map((b) => b.count));

  const stages = [
    { id: "nuevo", label: "Nuevos" },
    { id: "contactado", label: "Contactados" },
    { id: "cotizando", label: "Cotizando" },
    { id: "negociacion", label: "En negociación" },
    { id: "ganado", label: "Ganados" },
  ] as const;
  const funnel = stages.map((s) => ({ label: s.label, count: wsLeads.filter((l) => l.stage === s.id).length }));
  const funnelMax = Math.max(1, ...funnel.map((f) => f.count));

  const topAutomations = [...wsAuto].sort((a, b) => b.triggeredCount - a.triggeredCount).slice(0, 4);
  const topAgents = [...wsAgents].sort((a, b) => b.resolvedToday - a.resolvedToday).slice(0, 5);

  const intentBuckets: Array<{ label: string; match: (intent: string) => boolean }> = [
    { label: "Cotización / presupuesto", match: (i) => /cotiz|presupuesto|comercial/.test(i.toLowerCase()) },
    { label: "Soporte / derivación humana", match: (i) => /derivac|humana/.test(i.toLowerCase()) },
    { label: "Coordinación / logística", match: (i) => /coordinac|logístic|log[ií]stica/.test(i.toLowerCase()) },
    { label: "Exploración / consulta", match: (i) => /explorac|consulta/.test(i.toLowerCase()) },
    { label: "Cierre / venta", match: (i) => /cierre|venta/.test(i.toLowerCase()) },
  ];
  const topIntents = intentBuckets.map((b) => ({ label: b.label, count: wsConv.filter((c) => b.match(c.intent)).length })).filter((i) => i.count > 0);

  const campaignTotals = wsCamp.reduce(
    (acc, c) => ({ open: acc.open + (c.openRate ?? 0), reply: acc.reply + (c.replyRate ?? 0), conv: acc.conv + (c.conversionRate ?? 0) }),
    { open: 0, reply: 0, conv: 0 },
  );
  const campaignAvg = {
    open: wsCamp.length === 0 ? 0 : Math.round(campaignTotals.open / wsCamp.length),
    reply: wsCamp.length === 0 ? 0 : Math.round(campaignTotals.reply / wsCamp.length),
    conv: wsCamp.length === 0 ? 0 : Math.round(campaignTotals.conv / wsCamp.length),
  };

  // Build recommended actions from data
  const recommendations: Array<{ icon: typeof Sparkles; title: string; body: string; href: string; cta: string; tone: "rose" | "amber" | "cyan" | "emerald" }> = [];
  if (slaAlerts > 0) recommendations.push({ icon: AlertTriangle, title: `${slaAlerts} conversaciones en riesgo SLA`, body: "Revisalas para evitar quiebres y proteger la conversión.", href: "/dashboard/conversaciones", cta: "Atender ahora", tone: "rose" });
  if (unassigned > 0) recommendations.push({ icon: ArrowRight, title: `${unassigned} conversaciones sin operador asignado`, body: "Asigná para evitar pérdida de leads y bajar el tiempo de respuesta.", href: "/dashboard/conversaciones", cta: "Reasignar", tone: "amber" });
  if (wsAuto.filter((a) => a.status === "borrador" || a.status === "test").length > 0) recommendations.push({ icon: Sparkles, title: "Tenés automatizaciones sin publicar", body: "Pasá a producción tus borradores o reglas en test para escalar respuesta.", href: "/dashboard/automatizaciones", cta: "Publicar reglas", tone: "cyan" });
  if (campaigns.filter((c) => c.workspaceId === activeWorkspaceId && c.status === "borrador").length > 0) recommendations.push({ icon: Lightbulb, title: "Campaña lista para programar", body: "Convertí borradores en envíos programados para reactivar leads.", href: "/dashboard/campanias", cta: "Programar campaña", tone: "emerald" });
  if (recommendations.length === 0) recommendations.push({ icon: Sparkles, title: "Operación saludable", body: "No detectamos alertas. Buen momento para escalar campañas o sumar automatizaciones.", href: "/dashboard/campanias", cta: "Crear campaña", tone: "emerald" });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Conversaciones" value={String(wsConv.length)} previous={prev.conversations} hint="vs período anterior" />
        <Kpi label="Tiempo respuesta" value={`${avgResponseMin}m`} previous={prev.responseMin} invert hint="vs período anterior" />
        <Kpi label="Cumplimiento SLA" value={`${slaCompliance}%`} previous={prev.sla} hint="vs período anterior" tone={slaCompliance >= 90 ? "emerald" : slaCompliance >= 70 ? "amber" : "rose"} />
        <Kpi label="Conversión" value={`${conversionRate}%`} previous={prev.conversion} hint="vs período anterior" tone="emerald" />
        <Kpi label="Embudo activo" value={formatCurrency(pipelineValue)} previous={prev.pipelineValue} hint={`Cerrado ${formatCurrency(wonValue)}`} tone="cyan" isCurrency />
      </div>

      <Card className="p-5">
        <p className="text-sm font-semibold inline-flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-300" />Acciones recomendadas</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {recommendations.map((r, i) => {
            const tone = {
              rose: "border-rose-300/30 bg-rose-500/10 text-rose-100",
              amber: "border-amber-300/30 bg-amber-500/10 text-amber-100",
              cyan: "border-cyan-300/30 bg-cyan-500/10 text-cyan-100",
              emerald: "border-emerald-300/30 bg-emerald-500/10 text-emerald-100",
            }[r.tone];
            return (
              <Link key={i} href={r.href} className={`flex items-start justify-between gap-3 rounded-xl border p-3 ${tone}`}>
                <div className="flex items-start gap-2">
                  <r.icon className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-[11px] opacity-80">{r.body}</p>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] opacity-90">{r.cta} →</span>
              </Link>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold">Embudo comercial</p>
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
          <p className="text-sm font-semibold">Mejores automatizaciones</p>
          <div className="mt-3 space-y-2 text-sm">
            {topAutomations.length === 0 ? <p className="text-xs text-zinc-400">Sin automatizaciones activas.</p> : topAutomations.map((a) => (
              <div key={a.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{a.name}</p>
                  <span className="text-xs text-emerald-200">{a.replyRate}% respuesta</span>
                </div>
                <p className="text-[11px] text-zinc-400">{a.triggeredCount} ejecuciones · conversión estimada {a.conversionEstimate}% · estado {a.status}</p>
                <div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${Math.min(a.replyRate, 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold">Rendimiento por operador</p>
          <div className="mt-3 space-y-2 text-sm">
            {topAgents.map((a) => (
              <div key={a.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-[11px] text-zinc-400">{a.role} · {a.availability}</p>
                  </div>
                  <div className="text-right text-[11px] text-zinc-300">
                    <p>{a.resolvedToday} resueltas hoy</p>
                    <p>{a.assignedConversations} asignadas · {a.responseTimeMinutes}m respuesta</p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${Math.min(a.resolvedToday * 5, 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold">Principales intents detectados</p>
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
          <p className="text-sm font-semibold">Rendimiento de campañas</p>
          {wsCamp.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-400">Aún no hay campañas enviadas en este workspace.</p>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Apertura</p><p className="text-lg font-bold text-cyan-100">{campaignAvg.open}%</p></Card>
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Respuesta</p><p className="text-lg font-bold text-emerald-100">{campaignAvg.reply}%</p></Card>
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Conversión</p><p className="text-lg font-bold text-violet-100">{campaignAvg.conv}%</p></Card>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                {wsCamp.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2">
                    <span>{c.name}</span>
                    <span className="text-zinc-400">{c.sentRecipients} enviados · {c.replyRate}% respuesta</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <p className="text-sm font-semibold">Salud del negocio</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3 text-sm">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3"><p className="text-xs text-zinc-400">Intervención humana</p><p className="text-lg font-bold">{humanIntervention}%</p><p className="text-[11px] text-zinc-500">Conversaciones con operador asignado.</p></div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3"><p className="text-xs text-zinc-400">Conversaciones sin operador</p><p className="text-lg font-bold text-amber-200">{unassigned}</p><p className="text-[11px] text-zinc-500">Acción recomendada: rebalanceo.</p></div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3"><p className="text-xs text-zinc-400">Reglas pendientes de publicación</p><p className="text-lg font-bold text-violet-200">{wsAuto.filter((a) => a.status === "borrador" || a.status === "test").length}</p><p className="text-[11px] text-zinc-500">Borradores y reglas en prueba.</p></div>
        </div>
      </Card>
    </div>
  );
}

function Kpi({ label, value, hint, previous, invert = false, tone = "default", isCurrency = false }: {
  label: string;
  value: string;
  hint: string;
  previous?: number;
  invert?: boolean;
  tone?: "default" | "emerald" | "amber" | "rose" | "cyan";
  isCurrency?: boolean;
}) {
  const toneClass = {
    default: "text-white",
    emerald: "text-emerald-100",
    amber: "text-amber-100",
    rose: "text-rose-100",
    cyan: "text-cyan-100",
  }[tone];

  let comparison: React.ReactNode = null;
  if (typeof previous === "number") {
    // Use the numeric portion of the value for delta when not isCurrency
    const numeric = isCurrency ? Number(value.replace(/[^0-9-]/g, "")) : Number(value.replace(/[^0-9.-]/g, ""));
    const d = delta(numeric, previous, invert);
    if (!d.neutral) {
      const goodTone = d.good ? "text-emerald-200" : "text-rose-200";
      const Icon = d.up !== invert ? ArrowUpRight : ArrowDownRight;
      comparison = <span className={`inline-flex items-center gap-0.5 text-[11px] ${goodTone}`}><Icon className="h-3 w-3" />{d.pct}%</span>;
    } else {
      comparison = <span className="text-[11px] text-zinc-400">sin cambios</span>;
    }
  }

  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-1 flex items-center justify-between text-xs text-zinc-400">
        <span>{hint}</span>
        {comparison}
      </p>
    </Card>
  );
}
