import { AnalyticsClient } from "@/components/dashboard/analytics-client";

export default function AnalyticsPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Analytics</h2>
      <p className="text-zinc-400">Métricas de valor comercial y performance operativa del workspace.</p>
      <AnalyticsClient />
    </section>
  );
}
