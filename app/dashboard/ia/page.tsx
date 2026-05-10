import { AIHub } from "@/components/dashboard/ai-hub";

export default function IAPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">IA · Centro de inteligencia</h2>
      <p className="text-zinc-400">Configurá motor, prompts, modelos y probá el asistente. Todos los cambios se guardan localmente en este workspace.</p>
      <AIHub />
    </section>
  );
}
