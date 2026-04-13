import { SettingsClient } from "@/components/dashboard/settings-client";

export default function ConfiguracionPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Configuración</h2>
      <p className="text-zinc-400">Configurá tu operación por secciones y guardá cambios en tiempo real para una demo completa.</p>
      <SettingsClient />
    </section>
  );
}
