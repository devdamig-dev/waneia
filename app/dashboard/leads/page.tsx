import { LeadsClient } from "@/components/dashboard/leads-client";

export default function LeadsPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Leads</h2>
      <p className="text-zinc-400">CRM-lite para clasificar oportunidades y moverlas más rápido hacia venta.</p>
      <LeadsClient />
    </section>
  );
}
