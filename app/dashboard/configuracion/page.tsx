import { Card } from "@/components/ui/card";

const settingsSections = [
  { title: "Negocio", desc: "Datos comerciales, rubro, sucursales y objetivos de conversión." },
  { title: "Automatizaciones", desc: "Activá o pausá reglas, prioridades y horarios de ejecución." },
  { title: "Mensajes automáticos", desc: "Editá plantillas de bienvenida, seguimiento y cierre." },
  { title: "Horarios de atención", desc: "Definí cuándo responde IA y cuándo deriva al equipo." },
  { title: "Derivación a humano", desc: "Configurá SLA, cola de asesores y alertas internas." },
  { title: "Branding", desc: "Placeholder para personalización visual por negocio." },
  { title: "Integración WhatsApp", desc: "Próximamente: conexión oficial con WhatsApp Business API." },
];

export default function ConfiguracionPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Configuración</h2>
      <p className="text-zinc-400">Prepará tu operación para escalar sin perder calidad de atención.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => (
          <Card key={section.title} className="p-5">
            <h3 className="font-semibold">{section.title}</h3>
            <p className="mt-2 text-sm text-zinc-300">{section.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
