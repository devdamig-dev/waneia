import { CategoryBadge } from "@/components/dashboard/category-badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card } from "@/components/ui/card";
import { conversations, leads } from "@/data/mock-data";

export default function DashboardPage() {
  const total = conversations.length;
  const newLeads = leads.filter((l) => l.status === "nuevo").length;
  const inFollowup = conversations.filter((c) => c.status === "en seguimiento").length;
  const closed = conversations.filter((c) => c.status === "cerrado").length;

  return (
    <section className="space-y-6">
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">Visión general</p>
        <h2 className="mt-2 text-3xl font-bold">Centralizá tu atención y no pierdas más oportunidades.</h2>
        <p className="mt-2 max-w-3xl text-zinc-300">WANEIA detecta la intención del mensaje, clasifica contactos y te da control total de cada conversación en un único panel premium.</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Conversaciones totales" value={String(total)} delta="+18% vs. semana pasada" />
        <KpiCard title="Nuevos leads" value={String(newLeads)} delta="+9 leads en las últimas 24h" />
        <KpiCard title="En seguimiento" value={String(inFollowup)} delta="Oportunidades activas priorizadas" />
        <KpiCard title="Cerradas" value={String(closed)} delta="Tasa de cierre del 34%" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-lg font-semibold">Conversaciones recientes</h3>
          <p className="text-sm text-zinc-400">Automatizá respuestas frecuentes sin perder cercanía.</p>
          <div className="mt-4 space-y-3">
            {conversations.slice(0, 6).map((conversation) => (
              <div key={conversation.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{conversation.customerName}</p>
                  <StatusBadge status={conversation.status} />
                </div>
                <p className="mt-2 text-sm text-zinc-300">{conversation.lastMessage}</p>
                <div className="mt-2"><CategoryBadge category={conversation.category} /></div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold">Embudo comercial</h3>
          <p className="text-sm text-zinc-400">Convertí más consultas en ventas con una operación más ordenada.</p>
          <div className="mt-6 space-y-4">
            {[{ label: "Consultas entrantes", value: 126 }, { label: "Leads calificados", value: 74 }, { label: "Propuestas enviadas", value: 39 }, { label: "Ventas cerradas", value: 19 }].map((item, index) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-sm"><span>{item.label}</span><span className="font-semibold">{item.value}</span></div>
                <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400" style={{ width: `${100 - index * 20}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
