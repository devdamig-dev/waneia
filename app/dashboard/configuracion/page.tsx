import Link from "next/link";
import { ArrowRight, Building2, GitBranch, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SettingsClient } from "@/components/dashboard/settings-client";

const subSections = [
  { href: "/dashboard/configuracion/categorias", icon: Tag, title: "Categorías y etiquetas", description: "Adaptá las clasificaciones de tu negocio." },
  { href: "/dashboard/configuracion/pipelines", icon: GitBranch, title: "Pipelines y etapas", description: "Configurá tu pipeline comercial y de soporte." },
  { href: "/dashboard/configuracion/departamentos", icon: Building2, title: "Departamentos y colas", description: "Organizá equipos y ruteo de conversaciones." },
];

export default function ConfiguracionPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Configuración</h2>
      <p className="text-zinc-400">Configurá tu operación por secciones. Los cambios se guardan en este navegador y workspace.</p>

      <div className="grid gap-3 md:grid-cols-3">
        {subSections.map((s) => (
          <Link key={s.href} href={s.href} className="block">
            <Card className="group h-full p-4 transition hover:border-cyan-300/40 hover:bg-cyan-500/5">
              <div className="flex items-start justify-between">
                <span className="rounded-xl border border-white/10 bg-white/5 p-2"><s.icon className="h-4 w-4 text-cyan-300" /></span>
                <ArrowRight className="h-4 w-4 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-cyan-200" />
              </div>
              <p className="mt-3 text-sm font-semibold">{s.title}</p>
              <p className="mt-1 text-xs text-zinc-400">{s.description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <SettingsClient />
    </section>
  );
}
