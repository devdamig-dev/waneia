import { ConversationsClient } from "@/components/dashboard/conversations-client";

export default function ConversacionesPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Conversaciones</h2>
      <p className="text-zinc-400">WANEIA detecta la intención del mensaje y organiza cada conversación.</p>
      <ConversationsClient />
    </section>
  );
}
