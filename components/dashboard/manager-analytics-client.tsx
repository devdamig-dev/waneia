"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  Clock3,
  MessageCircleMore,
  Smartphone,
  Tags,
  UsersRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  dailyChats,
  managerMetrics,
  recentActivity,
  sellers,
  tagFamilies,
  tagFunnel,
} from "@/data/manager-analytics";

const toneClasses: Record<string, string> = {
  blue: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  amber: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  rose: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  violet: "border-violet-400/20 bg-violet-400/10 text-violet-200",
};

export function ManagerAnalyticsClient() {
  const maxDaily = Math.max(...dailyChats);
  const polyline = dailyChats
    .map((value, index) => {
      const x = 10 + (index / (dailyChats.length - 1)) * 780;
      const y = 170 - (value / maxDaily) * 140;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,.14),transparent_28%),linear-gradient(180deg,rgba(14,22,42,.98),rgba(7,11,28,.98))] p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-300">Imprenta Esteban Cerrullo</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">WhatsApp Business Intelligence</h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-400">
              El equipo sigue atendiendo desde WhatsApp Web. Esta capa registra operación, etiquetas, tiempos y rendimiento para los gestores.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Coexistence activo · Bridge pendiente de validar
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {managerMetrics.map((metric) => (
            <Card key={metric.label} className="border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">{metric.label}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] ${toneClasses[metric.tone ?? "blue"]}`}>
                  {metric.delta}
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{metric.value}</p>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_.75fr]">
        <Card className="overflow-hidden border-white/10 bg-[#0b1224]/95 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                <BarChart3 className="h-4 w-4 text-sky-300" />
                Conversaciones del período
              </p>
              <p className="mt-1 text-xs text-zinc-500">01/09/2026 — 30/09/2026</p>
            </div>
            <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300">30 días</span>
          </div>
          <div className="mt-4 rounded-2xl border border-white/5 bg-black/10 p-3">
            <svg viewBox="0 0 800 190" className="h-[220px] w-full">
              {[30, 65, 100, 135, 170].map((y) => (
                <line key={y} x1="10" x2="790" y1={y} y2={y} stroke="rgba(255,255,255,.07)" strokeWidth="1" />
              ))}
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(56,189,248)" stopOpacity=".28" />
                  <stop offset="100%" stopColor="rgb(56,189,248)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points={`10,180 ${polyline} 790,180`} fill="url(#area)" stroke="none" />
              <polyline points={polyline} fill="none" stroke="rgb(125,211,252)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Card>

        <Card className="border-white/10 bg-[#0b1224]/95 p-5">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
            <Activity className="h-4 w-4 text-emerald-300" />
            Actividad reciente
          </p>
          <div className="mt-4 space-y-3">
            {recentActivity.map((item) => (
              <div key={item.title + item.when} className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                    <p className="mt-1 text-xs text-zinc-500">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-zinc-600">{item.when}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="border-white/10 bg-[#0b1224]/95 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                <Tags className="h-4 w-4 text-violet-300" />
                Etiquetas como fuente de verdad
              </p>
              <p className="mt-1 text-xs text-zinc-500">Sin round-robin. El vendedor toma el chat manualmente en WhatsApp.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {tagFamilies.map((family) => (
              <div key={family.title} className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{family.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {family.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-200">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-white/10 bg-[#0b1224]/95 p-5">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
            <MessageCircleMore className="h-4 w-4 text-sky-300" />
            Embudo reconstruido desde etiquetas
          </p>
          <div className="mt-5 space-y-3">
            {tagFunnel.map((step, index) => {
              const pct = Math.round((step.value / tagFunnel[0].value) * 100);
              return (
                <div key={step.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">{step.label}</span>
                    <span className="font-semibold text-white">{step.value.toLocaleString("es-AR")} · {pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300"
                      style={{ width: `${Math.max(pct, 8)}%`, opacity: 1 - index * 0.08 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="border-white/10 bg-[#0b1224]/95 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
              <UsersRound className="h-4 w-4 text-cyan-300" />
              Rendimiento por vendedor
            </p>
            <p className="mt-1 text-xs text-zinc-500">Atribución por etiqueta manual + eventos del bridge; no se distribuyen chats desde la plataforma.</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <Smartphone className="h-4 w-4 text-emerald-300" />
            Respuesta humana desde WhatsApp Business
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-zinc-500">
                <th className="pb-3 font-medium">Vendedor</th>
                <th className="pb-3 font-medium">Chats tomados</th>
                <th className="pb-3 font-medium">Respondidos</th>
                <th className="pb-3 font-medium">Pendientes</th>
                <th className="pb-3 font-medium">1ra respuesta</th>
                <th className="pb-3 font-medium">Mensajes/chat</th>
                <th className="pb-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => {
                const answerPct = Math.round((seller.answered / seller.chats) * 100);
                return (
                  <tr key={seller.name} className="border-b border-white/5">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sky-300/20 bg-sky-400/10 font-semibold text-sky-100">
                          {seller.name.slice(0, 1)}
                        </span>
                        <span className="font-semibold text-zinc-100">{seller.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-zinc-200">{seller.chats}</td>
                    <td className="py-3.5">
                      <div className="min-w-[120px]">
                        <div className="flex justify-between"><span className="text-zinc-200">{seller.answered}</span><span className="text-emerald-300">{answerPct}%</span></div>
                        <div className="mt-1 h-1.5 rounded-full bg-white/5"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${answerPct}%` }} /></div>
                      </div>
                    </td>
                    <td className="py-3.5 text-rose-200">{seller.pending}</td>
                    <td className="py-3.5 text-zinc-200">{seller.firstResponse}</td>
                    <td className="py-3.5 text-zinc-200">{seller.messages}</td>
                    <td className="py-3.5">
                      <span className={`rounded-full border px-2.5 py-1 ${seller.status === "En línea" ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200" : "border-amber-300/20 bg-amber-400/10 text-amber-200"}`}>
                        {seller.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-[#0b1224]/95 p-5">
          <BadgeDollarSign className="h-5 w-5 text-amber-300" />
          <p className="mt-3 text-sm font-semibold text-white">Costo bajo control</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">Separamos mensajes humanos desde la App de los envíos por API para proyectar costo Meta.</p>
        </Card>
        <Card className="border-white/10 bg-[#0b1224]/95 p-5">
          <Clock3 className="h-5 w-5 text-violet-300" />
          <p className="mt-3 text-sm font-semibold text-white">Tiempos reales</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">Primera respuesta, seguimientos y tiempo hasta presupuesto calculados sin cambiar la operatoria diaria.</p>
        </Card>
        <Card className="border-white/10 bg-[#0b1224]/95 p-5">
          <div className="flex gap-2">
            <ArrowUpRight className="h-5 w-5 text-emerald-300" />
            <ArrowDownRight className="h-5 w-5 text-sky-300" />
          </div>
          <p className="mt-3 text-sm font-semibold text-white">Gestión, no inbox</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">La plataforma observa, mide y reconstruye el funnel. Los vendedores siguen trabajando en WhatsApp Web.</p>
        </Card>
      </div>
    </div>
  );
}
