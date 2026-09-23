import { AutomationsClient } from "@/components/dashboard/automations-client";

export default function AutomatizacionesPage() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Automatizaciones</h2>
        <p className="mt-1 text-sm text-zinc-400">Definí qué tiene que pasar y qué debe hacer Waneia automáticamente.</p>
      </div>
      <AutomationsClient />
    </section>
  );
}
