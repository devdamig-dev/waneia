"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageCircleMore,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { useCRMStore } from "@/lib/crm-store";
import { createClient } from "@/lib/supabase/client";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export function DashboardClient() {
  const { activeWorkspaceId, activeWorkspace, teamMembers } = useWorkspace();
  const { conversations, leads, contacts } = useCRMStore();
  const supabase = useMemo(() => createClient(), []);
  const [activeAutomationsCount, setActiveAutomationsCount] = useState(0);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    void supabase
      .from("automations")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", activeWorkspaceId)
      .eq("status", "activa")
      .then(({ count }) => setActiveAutomationsCount(count ?? 0));
  }, [activeWorkspaceId, supabase]);

  const wsConversations = conversations.filter((c) => c.workspaceId === activeWorkspaceId);
  const wsLeads = leads.filter((l) => l.workspaceId === activeWorkspaceId);
  const wsContacts = contacts.filter((c) => c.workspaceId === activeWorkspaceId);
  const wsAgents = teamMembers.filter((m) => m.workspaceId === activeWorkspaceId);

  const pending = wsConversations.filter((c) => ["nuevo", "pendiente"].includes(c.status));
  const unassigned = wsConversations.filter((c) => !c.assignedAgentId && !["ganado", "perdido", "cerrado"].includes(c.status));
  const slaAlerts = wsConversations.filter((c) => c.slaMinutesRemaining <= 5 && !["ganado", "perdido", "cerrado"].includes(c.status));
  const followUps = wsConversations.filter((c) => Boolean(c.nextTask)).slice(0, 5);
  const openLeads = wsLeads.filter((l) => !["ganado", "perdido"].includes(l.stage));
  const pipelineValue = openLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
  const won = wsLeads.filter((l) => l.stage === "ganado");
  const conversionRate = wsLeads.length ? Math.round((won.length / wsLeads.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Centro comercial</p>
            <h2 className="mt-1 text-3xl font-bold">{activeWorkspace.name}</h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">Lo importante de hoy: conversaciones por atender, oportunidades abiertas y próximos seguimientos.</p>
          </div>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-100">
            WhatsApp · {activeWorkspace.whatsappStatus}
          </span>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/dashboard/conversaciones" className="group rounded-xl border border-cyan-300/20 bg-cyan-500/5 p-4 hover:bg-cyan-500/10">
            <div className="flex items-center justify-between"><MessageCircleMore className="h-5 w-5 text-cyan-200" /><ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-100" /></div>
            <p className="mt-3 font-semibold">Abrir Inbox</p>
            <p className="mt-1 text-xs text-zinc-400">{pending.length} conversaciones requieren atención</p>
          </Link>
          <Link href="/dashboard/leads" className="group rounded-xl border border-emerald-300/20 bg-emerald-500/5 p-4 hover:bg-emerald-500/10">
            <div className="flex items-center justify-between"><TrendingUp className="h-5 w-5 text-emerald-200" /><ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-100" /></div>
            <p className="mt-3 font-semibold">Ver ventas</p>
            <p className="mt-1 text-xs text-zinc-400">{openLeads.length} oportunidades abiertas</p>
          </Link>
          <Link href="/dashboard/automatizaciones" className="group rounded-xl border border-violet-300/20 bg-violet-500/5 p-4 hover:bg-violet-500/10">
            <div className="flex items-center justify-between"><Workflow className="h-5 w-5 text-violet-200" /><ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-100" /></div>
            <p className="mt-3 font-semibold">Automatizaciones</p>
            <p className="mt-1 text-xs text-zinc-400">{activeAutomationsCount} reglas activas</p>
          </Link>
          <Link href="/dashboard/analytics" className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
            <div className="flex items-center justify-between"><Users className="h-5 w-5 text-zinc-200" /><ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-100" /></div>
            <p className="mt-3 font-semibold">Reportes</p>
            <p className="mt-1 text-xs text-zinc-400">{wsAgents.length} integrantes · {wsContacts.length} contactos</p>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Pendientes" value={pending.length.toString()} detail="Nuevas + esperando respuesta" icon={Clock3} />
        <Metric label="Sin asignar" value={unassigned.length.toString()} detail="Disponibles para tomar" icon={UserRoundCheck} />
        <Metric label="Pipeline abierto" value={formatCurrency(pipelineValue)} detail={`${openLeads.length} oportunidades`} icon={TrendingUp} />
        <Metric label="Conversión" value={`${conversionRate}%`} detail={`${won.length} ventas ganadas`} icon={CheckCircle2} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Prioridad de atención</p>
              <p className="mt-1 text-xs text-zinc-400">Lo que el equipo debería resolver primero.</p>
            </div>
            <Link href="/dashboard/conversaciones" className="text-xs text-cyan-200">Ver Inbox →</Link>
          </div>
          <div className="mt-4 space-y-2">
            {slaAlerts.length ? slaAlerts.slice(0, 5).map((c) => (
              <Link key={c.id} href="/dashboard/conversaciones" className="flex items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-500/5 p-3 hover:bg-rose-500/10">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.customerName}</p>
                  <p className="truncate text-xs text-zinc-400">{c.lastMessage}</p>
                </div>
                <span className="shrink-0 text-xs text-rose-200">{c.slaMinutesRemaining <= 0 ? `Vencido ${Math.abs(c.slaMinutesRemaining)}m` : `${c.slaMinutesRemaining}m`}</span>
              </Link>
            )) : (
              <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">No hay conversaciones críticas en este momento.</div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <p className="font-semibold">Próximos seguimientos</p>
          <p className="mt-1 text-xs text-zinc-400">Tareas comerciales nacidas desde el chat.</p>
          <div className="mt-4 space-y-2">
            {followUps.length ? followUps.map((c) => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-semibold">{c.customerName}</p>
                <p className="mt-1 text-xs text-zinc-400">{c.nextTask}</p>
              </div>
            )) : <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-400">Sin seguimientos pendientes.</p>}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-violet-200" />
          <div className="flex-1">
            <p className="font-semibold">Siguiente acción sugerida</p>
            <p className="mt-1 text-sm text-zinc-300">
              {unassigned.length > 0
                ? `Asigná las ${unassigned.length} conversaciones sin responsable antes de seguir con el pipeline.`
                : pending.length > 0
                  ? `Respondé las ${pending.length} conversaciones pendientes y convertí las que tengan intención comercial en oportunidades.`
                  : "El Inbox está al día. Revisá seguimientos y oportunidades abiertas."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: LucideIcon }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
        <Icon className="h-4 w-4 text-zinc-500" />
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{detail}</p>
    </Card>
  );
}
