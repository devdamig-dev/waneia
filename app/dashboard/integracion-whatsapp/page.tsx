import { WhatsappConnectionClient } from "@/components/dashboard/whatsapp-connection-client";

export default function IntegracionWhatsappPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Integración WhatsApp</h2>
      <p className="text-zinc-400">Preparación enterprise para conexión oficial de WhatsApp Business API.</p>
      <WhatsappConnectionClient />
    </section>
  );
}
