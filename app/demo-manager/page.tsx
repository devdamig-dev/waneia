import {
  BarChart3,
  Gauge,
  MessageCircleMore,
  Plug,
  Settings,
  Tags,
  UsersRound,
} from "lucide-react";
import { ManagerAnalyticsClient } from "@/components/dashboard/manager-analytics-client";

const nav = [
  { label: "Resumen", icon: Gauge, active: true },
  { label: "Conversaciones", icon: MessageCircleMore },
  { label: "Contactos", icon: UsersRound },
  { label: "Vendedores", icon: UsersRound },
  { label: "Etiquetas", icon: Tags },
  { label: "Reportes", icon: BarChart3 },
  { label: "Conexión WhatsApp", icon: Plug },
  { label: "Configuración", icon: Settings },
];

export default function ManagerDemoPage() {
  return (
    <main className="min-h-screen bg-[#050916] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#070b1c]/95 p-6 xl:block">
          <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-sky-300">NEXO · WHATSAPP OPS</p>
            <h1 className="mt-2 text-xl font-semibold">Gestión invisible</h1>
            <p className="mt-1 text-xs leading-5 text-zinc-400">El equipo usa WhatsApp. Vos ves toda la operación.</p>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Negocio observado</p>
            <p className="mt-2 text-sm font-semibold">Imprenta Esteban Cerrullo</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              WhatsApp Business conectado
            </p>
          </div>

          <nav className="mt-6 space-y-1">
            {nav.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  item.active
                    ? "border border-sky-300/15 bg-sky-400/10 text-sky-100"
                    : "text-zinc-400"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            ))}
          </nav>

          <div className="mt-8 rounded-xl border border-white/8 bg-black/10 p-3 text-[11px] text-zinc-500">
            <p className="font-medium text-zinc-300">Modo shadow</p>
            <p className="mt-1 leading-5">Sin distribución de leads. La operación real ocurre en WhatsApp Web.</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 p-4 md:p-6 xl:p-8">
          <ManagerAnalyticsClient />
        </section>
      </div>
    </main>
  );
}
