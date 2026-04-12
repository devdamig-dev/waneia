import { AutomationsClient } from "@/components/dashboard/automations-client";

export default function AutomatizacionesPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Automatizaciones</h2>
      <p className="text-zinc-400">Diseñá flujos inteligentes, editá reglas en vivo y creá automatizaciones nuevas para cada caso comercial.</p>
      <AutomationsClient />
    </section>
  );
}
