import { LeadsClient } from "@/components/dashboard/leads-client";

export default function LeadsPage() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Ventas</h2>
        <p className="mt-1 text-sm text-zinc-400">Seguí cada oportunidad desde el primer mensaje hasta el cierre.</p>
      </div>
      <LeadsClient />
    </section>
  );
}
