import { TemplatesClient } from "@/components/dashboard/templates-client";

export default function PlantillasPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Plantillas y respuestas rápidas</h2>
      <p className="text-zinc-400">Centralizá los mensajes que tu equipo y bots usan en conversaciones, automatizaciones y campañas.</p>
      <TemplatesClient />
    </section>
  );
}
