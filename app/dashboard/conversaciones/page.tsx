import { ConversationsClient } from "@/components/dashboard/conversations-client";

export default function ConversacionesPage() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Inbox</h2>
        <p className="mt-1 text-sm text-zinc-400">Todos los chats del equipo, con cliente, responsable, oportunidad y seguimiento en la misma pantalla.</p>
      </div>
      <ConversationsClient />
    </section>
  );
}
