import { CategoryBadge } from "@/components/dashboard/category-badge";
import { Card } from "@/components/ui/card";
import { automationRules } from "@/data/mock-data";

export default function AutomatizacionesPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Automatizaciones</h2>
      <p className="text-zinc-400">WANEIA clasifica mensajes en tiempo real y ejecuta flujos con lógica comercial.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {automationRules.map((rule) => (
          <Card key={rule.id} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{rule.name}</h3>
              <span className={`rounded-full px-2 py-1 text-xs ${rule.active ? "bg-emerald-500/20 text-emerald-100" : "bg-zinc-500/20 text-zinc-300"}`}>
                {rule.active ? "Activo" : "Pausado"}
              </span>
            </div>
            <p className="mt-3 text-sm text-zinc-300"><strong>Trigger:</strong> {rule.trigger}</p>
            <p className="mt-2 text-sm text-zinc-300"><strong>Acción:</strong> {rule.action}</p>
            <div className="mt-3 flex items-center justify-between">
              <CategoryBadge category={rule.category} />
              <span className="text-xs text-cyan-200">Confianza IA: {rule.confidence}%</span>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <h3 className="font-semibold">Lógica de clasificación simulada</h3>
        <p className="mt-2 text-sm text-zinc-300">Si el mensaje incluye "precio", "presupuesto" o "costo" ⇒ categoría <b>presupuesto</b>. Si incluye "pedido", "listo" o "envío" ⇒ <b>pedido</b>. Si contiene "asesor" o "humano" ⇒ <b>soporte humano</b>. Caso contrario ⇒ <b>consulta</b>.</p>
      </Card>
    </section>
  );
}
