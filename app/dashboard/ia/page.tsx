import { AIClient } from "@/components/dashboard/ai-client";

export default function IAPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">IA · Motor del asistente</h2>
      <p className="text-zinc-400">Configurá el proveedor, modelo y comportamiento del asistente. Los cambios se guardan localmente en este navegador y workspace.</p>
      <AIClient />
    </section>
  );
}
