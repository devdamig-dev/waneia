import { CampaignsClient } from "@/components/dashboard/campaigns-client";

export default function CampaniasPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Campañas</h2>
      <p className="text-zinc-400">Diseñá campañas WhatsApp segmentadas listas para envío real cuando esté conectada la API.</p>
      <CampaignsClient />
    </section>
  );
}
