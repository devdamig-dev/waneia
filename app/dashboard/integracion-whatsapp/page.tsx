import { WhatsappConnectionClient } from "@/components/dashboard/whatsapp-connection-client";

export default function IntegracionWhatsappPage() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">WhatsApp</h2>
        <p className="mt-1 text-sm text-zinc-400">Conectá un número oficial de Meta Cloud API para recibir y responder conversaciones reales.</p>
      </div>
      <WhatsappConnectionClient />
    </section>
  );
}
