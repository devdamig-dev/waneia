"use client";

import { Card } from "@/components/ui/card";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { whatsappConnectionData } from "@/data/saas-data";

const statuses = ["no configurado", "pendiente", "conectado", "error"] as const;

export function WhatsappConnectionClient() {
  const { activeWorkspace } = useWorkspace();
  const details = whatsappConnectionData[activeWorkspace.id as keyof typeof whatsappConnectionData];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statuses.map((status) => (
          <Card key={status} className={`p-4 ${activeWorkspace.whatsappStatus === status ? "border-emerald-300/40" : ""}`}>
            <p className="text-xs uppercase tracking-wide text-zinc-400">Estado</p>
            <p className="mt-1 text-lg font-semibold capitalize">{status}</p>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <h3 className="text-lg font-semibold">Detalles de conexión</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <p className="text-sm text-zinc-300">Número: {details.phoneNumber}</p>
          <p className="text-sm text-zinc-300">Business Account ID: {details.businessAccountId}</p>
          <p className="text-sm text-zinc-300">Webhook status: {details.webhookStatus}</p>
          <p className="text-sm text-zinc-300">Última sincronización: {details.lastSync}</p>
        </div>
      </Card>
      {activeWorkspace.whatsappStatus === "no configurado" ? (
        <Card className="p-6 text-center">
          <p className="text-lg font-semibold">Todavía no conectaste WhatsApp</p>
          <p className="mt-2 text-sm text-zinc-400">Activá integración para centralizar conversaciones reales y disparar automatizaciones por plantilla.</p>
          <button className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-500/20 px-4 py-2 text-sm">Conectar WhatsApp</button>
        </Card>
      ) : (
        <button className="rounded-xl border border-cyan-300/30 bg-cyan-500/20 px-4 py-2 text-sm">Conectar WhatsApp</button>
      )}
    </div>
  );
}
