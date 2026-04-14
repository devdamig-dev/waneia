"use client";

import { Card } from "@/components/ui/card";
import { automationRules, conversations, leads } from "@/data/mock-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";

export function AnalyticsClient() {
  const { activeWorkspaceId } = useWorkspace();
  // Keep analytics fully workspace-scoped for multi-tenant readiness.
  const workspaceConversations = conversations.filter((c) => c.workspaceId === activeWorkspaceId);
  const workspaceLeads = leads.filter((l) => l.workspaceId === activeWorkspaceId);
  const workspaceAutomations = automationRules.filter((a) => a.workspaceId === activeWorkspaceId);
  const humanIntervention = workspaceConversations.filter((c) => c.assignedToHuman).length;
  const funnel = {
    conversations: workspaceConversations.length,
    leads: workspaceLeads.length,
    sales: Math.max(1, Math.round(workspaceLeads.length * 0.34)),
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4"><p className="text-sm text-zinc-400">Response time</p><p className="text-2xl font-bold">2m 40s</p></Card>
        <Card className="p-4"><p className="text-sm text-zinc-400">Automation coverage</p><p className="text-2xl font-bold">91%</p></Card>
        <Card className="p-4"><p className="text-sm text-zinc-400">Lead conversion estimate</p><p className="text-2xl font-bold">34%</p></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <p className="font-semibold">Funnel comercial</p>
          <p className="mt-2 text-sm text-zinc-300">Conversaciones: {funnel.conversations} → Leads: {funnel.leads} → Ventas estimadas: {funnel.sales}</p>
          <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400" style={{ width: `${Math.min((funnel.sales / Math.max(funnel.conversations, 1)) * 100 * 4, 100)}%` }} /></div>
        </Card>
        <Card className="p-4"><p className="font-semibold">Conversaciones por categoría</p><p className="mt-2 text-sm text-zinc-300">Presupuesto: {workspaceConversations.filter((c) => c.category === "presupuesto").length} · Consulta: {workspaceConversations.filter((c) => c.category === "consulta").length} · Pedido: {workspaceConversations.filter((c) => c.category === "pedido").length}</p></Card>
        <Card className="p-4"><p className="font-semibold">Response time por tipo</p><p className="mt-2 text-sm text-zinc-300">Presupuesto: 2m 10s · Consulta: 3m 05s · Soporte humano: 5m 20s.</p><p className="mt-2 text-xs text-zinc-500">Intervención humana: {humanIntervention} conversaciones.</p></Card>
      </div>
      <Card className="p-4"><p className="font-semibold">Best performing automations</p><div className="mt-2 space-y-2">{workspaceAutomations.map((rule) => <div key={rule.id} className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm">{rule.name} · Confianza {rule.confidence}% · Conversión estimada +{Math.round(rule.confidence / 9)}%</div>)}</div></Card>
      <Card className="p-4"><p className="font-semibold">Workspace performance summary</p><p className="mt-2 text-sm text-zinc-300">Leads activos: {workspaceLeads.length}. Cobertura automática: 91%. Conversaciones con intervención humana: {Math.round((humanIntervention / Math.max(workspaceConversations.length, 1)) * 100)}%.</p></Card>
    </div>
  );
}
