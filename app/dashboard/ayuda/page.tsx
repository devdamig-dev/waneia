import { HelpClient } from "@/components/dashboard/help-client";

export default function AyudaPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Centro de ayuda</h2>
      <p className="text-zinc-400">Guías paso a paso, mejores prácticas y atajos para configurar tu workspace y resolver dudas frecuentes.</p>
      <HelpClient />
    </section>
  );
}
