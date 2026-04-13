"use client";

import { Card } from "@/components/ui/card";
import { automationRules, conversations, leads } from "@/data/mock-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";

export function AnalyticsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const workspaceConversations = conversations.filter((c) => c.workspaceId === activeWorkspaceId);
  const workspaceLeads = leads.filter((l) => l.workspaceId === activeWorkspaceId);
  const workspaceAutomations = automationRules.filter((a) => a.workspaceId === activeWorkspaceId);
  const humanIntervention = workspaceConversations.filter((c) => c.assignedToHuman).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4"><p className="text-sm text-zinc-400">Response time</p><p className="text-2xl font-bold">2m 40s</p></Card>
        <Card className="p-4"><p className="text-sm text-zinc-400">Automation coverage</p><p className="text-2xl font-bold">91%</p></Card>
        <Card className="p-4"><p className="text-sm text-zinc-400">Lead conversion estimate</p><p className="text-2xl font-bold">34%</p></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4"><p className="font-semibold">Conversaciones por categoría</p><p className="mt-2 text-sm text-zinc-300">Presupuesto: {workspaceConversations.filter((c) => c.category === "presupuesto").length} · Consulta: {workspaceConversations.filter((c) => c.category === "consulta").length} · Pedido: {workspaceConversations.filter((c) => c.category === "pedido").length}</p></Card>
        <Card className="p-4"><p className="font-semibold">Intervención humana</p><p className="mt-2 text-sm text-zinc-300">{humanIntervention} conversaciones requieren derivación humana.</p></Card>
      </div>
      <Card className="p-4"><p className="font-semibold">Best performing automations</p><div className="mt-2 space-y-2">{workspaceAutomations.map((rule) => <div key={rule.id} className="rounded-lg border border-white/10 bg-white/5 p-2 text-sm">{rule.name} · Confianza {rule.confidence}%</div>)}</div></Card>
      <Card className="p-4"><p className="font-semibold">Business health summary</p><p className="mt-2 text-sm text-zinc-300">Leads activos: {workspaceLeads.length}. Operación estable, con capacidad de escalar automatizaciones y cobertura de soporte.</p></Card>
    </div>
  );
}
