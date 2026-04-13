import Link from "next/link";
import { AlertTriangle, ArrowRight, Bot, Clock3, Flame, Handshake, Sparkles, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { conversations, leads, automationRules } from "@/data/mock-data";
import { CategoryBadge } from "@/components/dashboard/category-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";

const quickActions = [
  { label: "Crear automatización", href: "/dashboard/automatizaciones" },
  { label: "Revisar leads", href: "/dashboard/leads" },
  { label: "Configurar mensajes", href: "/dashboard/configuracion" },
  { label: "Ver conversaciones urgentes", href: "/dashboard/conversaciones" },
];

export default function DashboardPage() {
  const total = conversations.length;
  const avgFirstResponse = "2m 40s";
  const autoClassificationRate = "91%";
  const estimatedConversion = "34%";
  const toHuman = conversations.filter((c) => c.assignedToHuman).length;

  const unresolved = conversations.filter((c) => c.status === "nuevo" || c.status === "esperando respuesta").length;
  const hotLeads = leads.filter((l) => l.estimatedValue >= 150000).length;
  const pausedAutomations = automationRules.filter((r) => !r.active).length;

  const conversationsByCategory = [
    { label: "Presupuesto", value: conversations.filter((c) => c.category === "presupuesto").length },
    { label: "Pedido", value: conversations.filter((c) => c.category === "pedido").length },
    { label: "Consulta", value: conversations.filter((c) => c.category === "consulta").length },
    { label: "Soporte humano", value: conversations.filter((c) => c.category === "soporte humano").length },
  ];

  return (
    <section className="space-y-6">
      <Card className="p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Estado de la operación</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Operación saludable con foco en cierre de ventas</h2>
            <p className="mt-2 max-w-3xl text-zinc-300">
              Hoy WANEIA detectó un pico de consultas de presupuesto. Recomendación IA: priorizar los leads con ticket alto en rubros hogar y salud.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
            <span className="inline-flex items-center gap-1"><Sparkles className="h-4 w-4" /> WANEIA sugiere: activar seguimiento automático de 30 min.</span>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className="group rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-cyan-300/40 hover:bg-cyan-500/10">
              <span className="flex items-center justify-between">
                {action.label}
                <ArrowRight className="h-4 w-4 opacity-50 transition group-hover:translate-x-1 group-hover:opacity-100" />
              </span>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-sm text-zinc-400">Conversaciones sin respuesta</p><p className="mt-1 text-2xl font-bold">{unresolved}</p><p className="mt-2 inline-flex items-center gap-1 text-xs text-amber-200"><AlertTriangle className="h-3 w-3" />Revisar en próximas 2h</p></Card>
        <Card className="p-4"><p className="text-sm text-zinc-400">Leads calientes</p><p className="mt-1 text-2xl font-bold">{hotLeads}</p><p className="mt-2 inline-flex items-center gap-1 text-xs text-rose-200"><Flame className="h-3 w-3" />Alto potencial de cierre</p></Card>
        <Card className="p-4"><p className="text-sm text-zinc-400">Automatizaciones pausadas</p><p className="mt-1 text-2xl font-bold">{pausedAutomations}</p><p className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-200"><Bot className="h-3 w-3" />Impacto estimado en SLA</p></Card>
        <Card className="p-4"><p className="text-sm text-zinc-400">Configuración incompleta</p><p className="mt-1 text-2xl font-bold">2</p><p className="mt-2 inline-flex items-center gap-1 text-xs text-violet-200"><Clock3 className="h-3 w-3" />Pendiente: horarios y branding</p></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[{ title: "Total conversaciones", value: total }, { title: "Primera respuesta promedio", value: avgFirstResponse }, { title: "Clasificación automática", value: autoClassificationRate }, { title: "Conversión estimada", value: estimatedConversion }, { title: "Derivadas a humano", value: toHuman }].map((kpi) => (
          <Card key={kpi.title} className="p-4 transition hover:bg-white/10">
            <p className="text-sm text-zinc-400">{kpi.title}</p>
            <p className="mt-2 text-2xl font-semibold">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-lg font-semibold">Activity feed operativo</h3>
          <div className="mt-4 space-y-3">
            {[
              "WANEIA clasificó 12 mensajes como presupuesto en la última hora.",
              "Se derivaron 3 conversaciones al equipo humano por alta urgencia.",
              "Se cerraron 2 ventas desde campañas de Instagram.",
              "Regla “Estado del pedido” ejecutó 18 respuestas automáticas.",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-300">{item}</div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold">Conversaciones por categoría</h3>
          <div className="mt-5 space-y-3">
            {conversationsByCategory.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-sm"><span>{item.label}</span><span className="font-semibold">{item.value}</span></div>
                <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400" style={{ width: `${(item.value / total) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-lg font-semibold">Performance de automatizaciones</h3>
          <div className="mt-4 space-y-3">
            {automationRules.map((rule) => (
              <div key={rule.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{rule.name}</p>
                  <p className="text-xs text-cyan-200">Confianza {rule.confidence}%</p>
                </div>
                <p className="mt-1 text-xs text-zinc-400">Clasificación automática detectada · Motivo: {rule.trigger}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="text-lg font-semibold">Hot opportunities</h3>
          <div className="mt-4 space-y-3">
            {conversations.filter((c) => c.estimatedOpportunity).slice(0, 4).map((c) => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between"><p className="font-medium">{c.customerName}</p><StatusBadge status={c.status} /></div>
                <p className="text-sm text-zinc-300">{c.lastMessage}</p>
                <div className="mt-2 flex items-center justify-between"><CategoryBadge category={c.category} /><p className="text-xs text-emerald-200 inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" />{c.estimatedOpportunity}</p></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-lg font-semibold">Siguiente paso recomendado</h3>
        <p className="mt-2 text-sm text-zinc-300 inline-flex items-center gap-2"><Handshake className="h-4 w-4 text-emerald-300" /> WANEIA sugiere contactar a los 5 leads con mayor ticket antes de las 16:00 para elevar la conversión diaria.</p>
      </Card>
    </section>
  );
}
