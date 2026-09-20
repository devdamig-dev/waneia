import { ContactsClient } from "@/components/dashboard/contacts-client";

export default function ContactosPage() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Contactos</h2>
        <p className="mt-1 text-sm text-zinc-400">La ficha de cada cliente con sus conversaciones, oportunidades y responsable.</p>
      </div>
      <ContactsClient />
    </section>
  );
}
