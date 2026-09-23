import { AnalyticsClient } from "@/components/dashboard/analytics-client";

export default function AnalyticsPage() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Reportes</h2>
        <p className="mt-1 text-sm text-zinc-400">Ventas, atención y rendimiento del equipo en una lectura simple.</p>
      </div>
      <AnalyticsClient />
    </section>
  );
}
