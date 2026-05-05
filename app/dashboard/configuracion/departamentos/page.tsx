import { DepartmentsClient } from "@/components/dashboard/departments-client";

export default function DepartamentosPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Departamentos y colas</h2>
      <p className="text-zinc-400">Definí departamentos, asigná miembros y categorías, y configurá ruteo automático para tu inbox.</p>
      <DepartmentsClient />
    </section>
  );
}
