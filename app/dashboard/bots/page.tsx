import { BotsClient } from "@/components/dashboard/bots-client";

export default function BotsPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Flujos de bot</h2>
      <p className="text-zinc-400">Diseñá flujos visuales para automatizar primer respuesta, calificación y derivación. Cada flujo se persiste localmente.</p>
      <BotsClient />
    </section>
  );
}
