"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { planTiers, usageByWorkspace } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";

export function BillingClient() {
  const { activeWorkspace } = useWorkspace();
  const usage = usageByWorkspace.find((item) => item.workspaceId === activeWorkspace.id);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Plan actual</p>
        <h3 className="mt-2 text-2xl font-bold">{activeWorkspace.plan.toUpperCase()}</h3>
        <p className="text-sm text-zinc-300">Tu cuenta está lista para escalar operaciones multi-sucursal y multi-equipo.</p>
      </Card>

      {usage ? (
        <Card className="p-5">
          <p className="font-semibold">Uso del período</p>
          <p className="mt-2 text-sm text-zinc-300">Conversaciones: {usage.conversationsUsed}/{usage.conversationsLimit} · Usuarios: {usage.usersUsed}/{usage.usersLimit} · Automatizaciones: {usage.automationsUsed}/{usage.automationsLimit}</p>
          <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${Math.min((usage.conversationsUsed / usage.conversationsLimit) * 100, 100)}%` }} /></div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {planTiers.map((plan) => (
          <Card key={plan.id} className={`p-4 ${activeWorkspace.plan === plan.id ? "border-emerald-300/40" : ""}`}>
            <p className="text-lg font-semibold">{plan.name}</p>
            <p className="text-sm text-zinc-400">{plan.priceLabel}/mes</p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-300">
              <li>Conversaciones: {plan.conversationsIncluded}</li>
              <li>Usuarios: {plan.usersIncluded}</li>
              <li>Automatizaciones: {plan.automationLimit}</li>
              <li>Analytics: {plan.analyticsLevel}</li>
              <li>Soporte: {plan.supportLevel}</li>
            </ul>
            <button className="mt-3 w-full rounded-xl border border-cyan-300/30 bg-cyan-500/20 px-3 py-2 text-sm">{activeWorkspace.plan === plan.id ? "Plan actual" : "Actualizar plan"}</button>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <p className="font-semibold">Facturación (placeholder)</p>
        <p className="mt-1 text-sm text-zinc-400">Próximamente: método de pago, historial de facturas, taxes y exportación contable.</p>
        <Link href="#" className="mt-3 inline-block text-sm text-cyan-200">Solicitar demo enterprise</Link>
      </Card>
    </div>
  );
}
