"use client";

import { useMemo, useState } from "react";
import { Check, CreditCard, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { planTiers, usageByWorkspace } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { WorkspacePlan } from "@/types/workspace";

export function BillingClient() {
  const { activeWorkspace } = useWorkspace();
  const [selectedPlan, setSelectedPlan] = useState<WorkspacePlan>(activeWorkspace.plan);
  const [toast, setToast] = useState("");
  const usage = useMemo(
    () => usageByWorkspace.find((u) => u.workspaceId === activeWorkspace.id),
    [activeWorkspace.id],
  );
  const plan = planTiers.find((p) => p.id === activeWorkspace.plan);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Plan actual</p>
          <p className="mt-1 text-3xl font-bold">{plan?.name}</p>
          <p className="text-sm text-zinc-300">{plan?.tagline}</p>
          <p className="mt-2 text-sm text-emerald-200">{plan?.priceLabel} / mes</p>
          <p className="mt-1 text-xs text-zinc-400">Próxima facturación: 28 de mayo · Tarjeta •••• 4421</p>
        </Card>
        {usage ? (
          <>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Consumo del período</p>
              <div className="mt-3 space-y-2">
                <Usage label="Conversaciones" used={usage.conversationsUsed} limit={usage.conversationsLimit} />
                <Usage label="Usuarios" used={usage.usersUsed} limit={usage.usersLimit} />
                <Usage label="Automatizaciones" used={usage.automationsUsed} limit={usage.automationsLimit} />
                <Usage label="Campañas" used={usage.campaignsUsed} limit={usage.campaignsLimit} />
              </div>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Salud del plan</p>
              <p className="mt-1 text-lg font-semibold">
                {usage.conversationsUsed / usage.conversationsLimit > 0.85 ? "⚠️ Plan próximo al límite" : "✅ Dentro de los límites"}
              </p>
              <p className="mt-2 text-xs text-zinc-400">Recomendación AI: {usage.conversationsUsed / usage.conversationsLimit > 0.85 ? "considerá subir a Pro para evitar overage." : "el plan cubre tu volumen actual con margen para crecer."}</p>
              <Button onClick={() => setToast("Solicitud enviada al equipo de Customer Success.")} className="mt-3 w-full"><Sparkles className="mr-1 h-4 w-4" />Pedir asesoría</Button>
            </Card>
          </>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {planTiers.map((p) => {
          const isCurrent = p.id === activeWorkspace.plan;
          const isSelected = p.id === selectedPlan;
          return (
            <Card key={p.id} className={`relative flex flex-col p-5 ${p.recommended ? "border-emerald-300/40" : ""} ${isSelected ? "ring-2 ring-cyan-300/40" : ""}`}>
              {p.recommended ? <span className="absolute right-4 top-4 rounded-full border border-emerald-300/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-100">Recomendado</span> : null}
              <p className="text-sm uppercase tracking-wide text-zinc-400">{p.name}</p>
              <p className="mt-1 text-3xl font-bold">{p.priceLabel}<span className="text-sm font-normal text-zinc-400"> /mes</span></p>
              <p className="mt-2 text-xs text-zinc-300">{p.tagline}</p>

              <div className="mt-3 space-y-1 text-xs text-zinc-300">
                <p>· {p.conversationsIncluded} conversaciones</p>
                <p>· {p.usersIncluded}</p>
                <p>· {p.automationLimit}</p>
                <p>· {p.campaignsIncluded} campañas</p>
                <p>· Analytics {p.analyticsLevel}</p>
                <p>· {p.whatsappIntegration}</p>
                <p>· Soporte {p.supportLevel}</p>
              </div>

              <ul className="mt-4 space-y-1 text-xs">
                {p.features.map((f) => (
                  <li key={f.label} className={`flex items-start gap-2 ${f.included ? "text-zinc-200" : "text-zinc-500 line-through"}`}>
                    <Check className={`mt-0.5 h-3.5 w-3.5 ${f.included ? "text-emerald-300" : "text-zinc-600"}`} />
                    <span>{f.label}{f.highlight ? <span className="ml-1 rounded bg-emerald-500/20 px-1 text-emerald-200">nuevo</span> : null}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-col gap-2">
                <button onClick={() => setSelectedPlan(p.id)} className={`rounded-xl border px-3 py-2 text-sm ${isSelected ? "border-cyan-300/40 bg-cyan-500/10 text-cyan-100" : "border-white/10 bg-white/5 text-zinc-200"}`}>
                  {isCurrent ? "Plan actual" : isSelected ? "Plan seleccionado" : "Comparar"}
                </button>
                {!isCurrent ? (
                  <Button onClick={() => setToast(`Upgrade a ${p.name} solicitado.`)} className="bg-emerald-500/30 hover:bg-emerald-500/40"><CreditCard className="mr-1 h-4 w-4" />Cambiar a {p.name}</Button>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 p-5">
        <p className="text-sm font-semibold">Facturación y método de pago</p>
        <p className="mt-2 text-sm text-zinc-400">Próximamente: descarga de facturas, taxes por país, alternativa de pago anual con descuento, exportación contable.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Card className="p-3"><p className="text-xs text-zinc-400">Método</p><p className="mt-1 text-sm font-medium">Visa •••• 4421</p></Card>
          <Card className="p-3"><p className="text-xs text-zinc-400">Próxima factura</p><p className="mt-1 text-sm font-medium">28 mayo 2026</p></Card>
          <Card className="p-3"><p className="text-xs text-zinc-400">Total estimado</p><p className="mt-1 text-sm font-medium">{plan?.priceLabel}</p></Card>
        </div>
      </Card>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}

function Usage({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const tone = pct >= 90 ? "from-rose-400 to-amber-400" : pct >= 70 ? "from-amber-400 to-emerald-400" : "from-emerald-400 to-cyan-400";
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="text-zinc-400">{used} / {limit >= 999 ? "∞" : limit}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-white/10"><div className={`h-full rounded-full bg-gradient-to-r ${tone}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
