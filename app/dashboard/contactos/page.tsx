import { ContactsClient } from "@/components/dashboard/contacts-client";

export default function ContactosPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Contactos</h2>
      <p className="text-zinc-400">Audiencia centralizada con segmentos dinámicos para campañas y automatizaciones.</p>
      <ContactsClient />
    </section>
  );
}
