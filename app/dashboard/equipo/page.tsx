import { TeamClient } from "@/components/dashboard/team-client";

export default function EquipoPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Equipo</h2>
      <p className="text-zinc-400">Gestioná miembros, roles y permisos del workspace (frontend mock).</p>
      <TeamClient />
    </section>
  );
}
