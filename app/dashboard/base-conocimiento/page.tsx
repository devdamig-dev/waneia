import { KnowledgeClient } from "@/components/dashboard/knowledge-client";

export default function BaseConocimientoPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Base de conocimiento</h2>
      <p className="text-zinc-400">Cargá artículos, manuales, catálogos y FAQ. La IA usa este contenido como contexto al responder a tus clientes.</p>
      <KnowledgeClient />
    </section>
  );
}
