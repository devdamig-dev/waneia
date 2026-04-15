"use client";

import { AlertTriangle, ArrowUpRight, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { automationRules, conversations, leads } from "@/data/mock-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";

export function AnalyticsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const workspaceConversations = conversations.filter((c) => c.workspaceId === activeWorkspaceId);
  const workspaceLeads = leads.filter((l) => l.workspaceId === activeWorkspaceId);
  const workspaceAutomations = automationRules.filter((a) => a.workspaceId === activeWorkspaceId);
  const humanIntervention = workspaceConversations.filter((c) => c.assignedToHuman).length;

  const prevPeriodConversations = Math.max(1, workspaceConversations.length - 2);
  const trend = Math.round(((workspaceConversations.length - prevPeriodConversations) / prevPeriodConversations) * 100);
  const conversion = 34;
  const benchmark = 30;

  const operatorPerformance = [
    { name: "Lucía", responseTime: "2m 10s", closures: 7 },
    { name: "Nicolás", responseTime: "2m 40s", closures: 5 },
    { name: "Camila", responseTime: "3m 05s", closures: 4 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="p-4"><p className="text-sm text-zinc-400">Conversaciones (período)</p><p className="text-2xl font-bold">{workspaceConversations.length}</p><p className="mt-1 text-xs text-emerald-200 inline-flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />{trend}% vs período anterior</p></Card>
        <Card className="p-4"><p className="text-sm text-zinc-400">Lead conversion estimate</p><p className="text-2xl font-bold">{conversion}%</p><p className="mt-1 text-xs text-cyan-200 inline-flex items-center gap-1"><Target className="h-3 w-3" />Benchmark: {benchmark}%</p></Card>
        <Card className="p-4"><p className="text-sm text-zinc-400">Automation coverage</p><p className="text-2xl font-bold">91%</p><p className="mt-1 text-xs text-zinc-500">Meta recomendada: 85%</p></Card>
        <Card className="p-4"><p className="text-sm text-zinc-400">Intervención humana</p><p className="text-2xl font-bold">{Math.round((humanIntervention / Math.max(workspaceConversations.length, 1)) * 100)}%</p><p className="mt-1 text-xs text-zinc-500">Objetivo: &lt;35%</p></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <p className="font-semibold">Workspace health alerts</p>
          <div className="mt-2 space-y-2 text-sm">
            <p className="rounded-lg border border-amber-300/30 bg-amber-500/10 p-2 text-amber-100 inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4" />SLA alto en conversaciones urgentes fuera de horario.</p>
            <p className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 p-2 text-emerald-100">Cobertura automática por encima del benchmark interno.</p>
            <p className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 p-2 text-cyan-100">Funnel estable con conversión por encima de período anterior.</p>
          </div>
        </Card>

        <Card className="p-4">
          <p className="font-semibold">Tendencias estratégicas</p>
          <p className="mt-2 text-sm text-zinc-300">Conversaciones: {workspaceConversations.length} (previo {prevPeriodConversations}) · Leads: {workspaceLeads.length} · Ventas estimadas: {Math.max(1, Math.round(workspaceLeads.length * 0.34))}.</p>
          <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400" style={{ width: `${Math.min(conversion * 2, 100)}%` }} /></div>
        </Card>
      </div>

      <Card className="p-4">
        <p className="font-semibold">Performance por operador</p>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {operatorPerformance.map((op) => (
            <div key={op.name} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
              <p className="font-medium">{op.name}</p>
              <p className="text-zinc-400">Response time: {op.responseTime}</p>
              <p className="text-zinc-400">Cierres: {op.closures}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="font-semibold">Top automations</p>
        <div className="mt-2 space-y-2">
          {workspaceAutomations.map((rule) => (
            <div key={rule.id} className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm">{rule.name} · Confianza {rule.confidence}% · Conversión estimada +{Math.round(rule.confidence / 9)}%</div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <p className="font-semibold">Executive summary</p>
        <p className="mt-2 text-sm text-zinc-300">El workspace muestra operación saludable, mejoras de productividad con automatización y margen para reducir aún más la dependencia de intervención humana en casos repetitivos.</p>
      </Card>
    </div>
  );
}
