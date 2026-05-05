import { PipelinesClient } from "@/components/dashboard/pipelines-client";

export default function PipelinesAdminPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Pipelines y etapas</h2>
      <p className="text-zinc-400">Adaptá tus pipelines a cómo vende y atiende tu negocio. Cada etapa puede tener color, probabilidad, SLA y automatización asociada.</p>
      <PipelinesClient />
    </section>
  );
}
