"use client";

import { useMemo, useState } from "react";
import { leads } from "@/data/mock-data";
import { Card } from "@/components/ui/card";
import { CategoryBadge } from "@/components/dashboard/category-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";

export function LeadsClient() {
  const [status, setStatus] = useState("todos");
  const [category, setCategory] = useState("todas");

  const filtered = useMemo(
    () =>
      leads.filter(
        (lead) =>
          (status === "todos" || lead.status === status) &&
          (category === "todas" || lead.category === category),
      ),
    [status, category],
  );

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap gap-2">
        {["todos", "nuevo", "calificado", "en propuesta", "ganado", "perdido"].map((item) => (
          <button key={item} onClick={() => setStatus(item)} className={`rounded-full px-3 py-1 text-sm ${status === item ? "bg-cyan-500/20 text-cyan-100" : "bg-white/5 text-zinc-300"}`}>
            {item}
          </button>
        ))}
        {["todas", "presupuesto", "pedido", "consulta", "soporte humano"].map((item) => (
          <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-3 py-1 text-sm ${category === item ? "bg-emerald-500/20 text-emerald-100" : "bg-white/5 text-zinc-300"}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-400">
              <th className="pb-3">Lead</th><th className="pb-3">Negocio</th><th className="pb-3">Categoría</th><th className="pb-3">Estado</th><th className="pb-3">Última interacción</th><th className="pb-3 text-right">Valor estimado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map((lead) => (
              <tr key={lead.id}>
                <td className="py-3"><p className="font-medium">{lead.name}</p><p className="text-xs text-zinc-500">{lead.phone} · {lead.source}</p></td>
                <td>{lead.business}</td>
                <td><CategoryBadge category={lead.category} /></td>
                <td><StatusBadge status={lead.status} /></td>
                <td>{lead.lastInteraction}</td>
                <td className="text-right font-semibold">{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(lead.estimatedValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
