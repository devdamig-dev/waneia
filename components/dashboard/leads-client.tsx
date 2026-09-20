"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageCircleMore,
  Plus,
  Search,
  Settings2,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { contacts } from "@/data/mock-data";
import { teamMembers } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { usePipelines } from "@/lib/workspace-config";
import { useCRMStore } from "@/lib/crm-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Drawer } from "@/components/ui/drawer";
import { Toast } from "@/components/ui/toast";
import { ConversationCategory, Lead } from "@/types/entities";
import { PipelineStageConfig } from "@/types/config";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

function slugifyStage(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const stageTone: Record<string, string> = {
  cyan: "border-cyan-300/30",
  sky: "border-sky-300/30",
  violet: "border-violet-300/30",
  amber: "border-amber-300/30",
  emerald: "border-emerald-300/30",
  rose: "border-rose-300/30",
  zinc: "border-zinc-300/30",
};

export function LeadsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const { leads, setLeads, conversations } = useCRMStore();
  const { pipelines, defaultPipelineId } = usePipelines();

  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("todos");
  const [activePipelineId, setActivePipelineId] = useState(defaultPipelineId);
  const [selectedId, setSelectedId] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    phone: "",
    business: "",
    source: "WhatsApp",
    category: "presupuesto" as ConversationCategory,
    estimatedValue: 0,
    notes: "",
  });

  const workspaceAgents = useMemo(
    () => teamMembers.filter((member) => member.workspaceId === activeWorkspaceId && member.status === "active"),
    [activeWorkspaceId],
  );

  useEffect(() => {
    if (!pipelines.some((pipeline) => pipeline.id === activePipelineId)) {
      setActivePipelineId(defaultPipelineId || pipelines[0]?.id || "");
    }
  }, [pipelines, activePipelineId, defaultPipelineId]);

  const activePipeline = pipelines.find((pipeline) => pipeline.id === activePipelineId) ?? pipelines[0];
  const stages: PipelineStageConfig[] = useMemo(
    () => (activePipeline ? [...activePipeline.stages].sort((a, b) => a.order - b.order) : []),
    [activePipeline],
  );

  const matchStage = (stageKey: string) => stages.find((stage) => slugifyStage(stage.name) === stageKey);

  const workspaceLeads = useMemo(
    () =>
      leads.filter((lead) => {
        if (lead.workspaceId !== activeWorkspaceId) return false;
        if (agentFilter !== "todos" && lead.assignedAgentId !== agentFilter) return false;
        if (search && !`${lead.name} ${lead.business} ${lead.phone}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [leads, activeWorkspaceId, agentFilter, search],
  );

  const selected = leads.find((lead) => lead.id === selectedId);

  useEffect(() => {
    const requested = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null;
    if (requested && leads.some((lead) => lead.id === requested && lead.workspaceId === activeWorkspaceId)) {
      setSelectedId(requested);
      setDrawerOpen(true);
    }
  }, [activeWorkspaceId, leads]);

  const openLeads = workspaceLeads.filter((lead) => matchStage(lead.stage)?.statusType === "abierto" || !matchStage(lead.stage));
  const wonLeads = workspaceLeads.filter((lead) => matchStage(lead.stage)?.statusType === "ganado");
  const pipelineValue = openLeads.reduce((total, lead) => total + lead.estimatedValue, 0);
  const wonValue = wonLeads.reduce((total, lead) => total + lead.estimatedValue, 0);
  const dueFollowUps = openLeads.filter((lead) => lead.nextFollowUp && lead.nextFollowUp !== "—").length;

  const updateLead = (id: string, patch: Partial<Lead>) => {
    setLeads((previous) =>
      previous.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)),
    );
  };

  const moveStage = (id: string, direction: -1 | 1) => {
    const lead = leads.find((item) => item.id === id);
    if (!lead || stages.length === 0) return;
    const index = Math.max(0, stages.findIndex((stage) => slugifyStage(stage.name) === lead.stage));
    const target = stages[Math.min(Math.max(index + direction, 0), stages.length - 1)];
    if (!target) return;
    updateLead(id, { stage: slugifyStage(target.name) as Lead["stage"] });
  };

  const createLead = () => {
    const firstStage = stages[0] ? slugifyStage(stages[0].name) : "nuevo";
    const created: Lead = {
      id: `l-${Date.now()}`,
      workspaceId: activeWorkspaceId,
      contactId: `ct-${Date.now()}`,
      name: draft.name || "Oportunidad sin nombre",
      phone: draft.phone || "—",
      source: draft.source,
      business: draft.business || "—",
      category: draft.category,
      stage: firstStage as Lead["stage"],
      assignedAgentId: workspaceAgents[0]?.id ?? "",
      tags: [],
      estimatedValue: Number(draft.estimatedValue) || 0,
      nextFollowUp: "Hoy",
      lastInteraction: "Recién creada",
      notes: draft.notes,
    };
    setLeads((previous) => [created, ...previous]);
    setOpenNew(false);
    setSelectedId(created.id);
    setDrawerOpen(true);
    setDraft({
      name: "",
      phone: "",
      business: "",
      source: "WhatsApp",
      category: "presupuesto",
      estimatedValue: 0,
      notes: "",
    });
    setToast("Oportunidad creada.");
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const selectedConversation = selected
    ? conversations.find(
        (conversation) =>
          conversation.id === selected.conversationId ||
          conversation.linkedLeadId === selected.id ||
          (conversation.contactId === selected.contactId && conversation.workspaceId === selected.workspaceId),
      )
    : undefined;
  const selectedContact = selected ? contacts.find((contact) => contact.id === selected.contactId) : undefined;

  return (
    <>
      <div className="space-y-4">
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-64 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar oportunidad, negocio o teléfono"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <select
              value={agentFilter}
              onChange={(event) => setAgentFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-sm"
            >
              <option value="todos">Todo el equipo</option>
              {workspaceAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
            {pipelines.length > 1 ? (
              <select
                value={activePipelineId}
                onChange={(event) => setActivePipelineId(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-sm"
              >
                {pipelines.map((pipeline) => (
                  <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
                ))}
              </select>
            ) : null}
            <Link
              href="/dashboard/configuracion/pipelines"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Etapas
            </Link>
            <Button onClick={() => setOpenNew(true)} className="bg-emerald-500/30 hover:bg-emerald-500/40">
              <Plus className="mr-1 h-4 w-4" />
              Nueva oportunidad
            </Button>
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Pipeline abierto</p>
            <p className="mt-2 text-2xl font-bold text-cyan-100">{formatCurrency(pipelineValue)}</p>
            <p className="mt-1 text-xs text-zinc-500">{openLeads.length} oportunidades activas</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Seguimientos</p>
            <p className="mt-2 text-2xl font-bold">{dueFollowUps}</p>
            <p className="mt-1 text-xs text-zinc-500">oportunidades con próximo paso</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Ganado</p>
            <p className="mt-2 text-2xl font-bold text-emerald-100">{formatCurrency(wonValue)}</p>
            <p className="mt-1 text-xs text-zinc-500">{wonLeads.length} cierres registrados</p>
          </Card>
        </div>

        <div className="grid gap-3 overflow-x-auto pb-2" style={{ gridTemplateColumns: `repeat(${Math.max(stages.length, 1)}, minmax(230px, 1fr))` }}>
          {stages.length === 0 ? (
            <Card className="p-6 text-center text-sm text-zinc-400">
              El pipeline no tiene etapas configuradas.
            </Card>
          ) : stages.map((stage) => {
            const stageKey = slugifyStage(stage.name);
            const stageLeads = workspaceLeads.filter((lead) => lead.stage === stageKey);
            const stageTotal = stageLeads.reduce((total, lead) => total + lead.estimatedValue, 0);
            return (
              <Card key={stage.id} className={`min-w-[230px] border-t-2 p-3 ${stageTone[stage.color] ?? stageTone.cyan}`}>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{stage.name}</p>
                    <p className="mt-1 text-[11px] text-zinc-500">{formatCurrency(stageTotal)}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {stageLeads.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-center text-[11px] text-zinc-600">
                      Sin oportunidades
                    </div>
                  ) : stageLeads.map((lead) => {
                    const agent = workspaceAgents.find((item) => item.id === lead.assignedAgentId);
                    return (
                      <div
                        key={lead.id}
                        onClick={() => openDetail(lead.id)}
                        className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-white/20 hover:bg-white/10"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{lead.name}</p>
                            <p className="truncate text-[11px] text-zinc-500">{lead.business}</p>
                          </div>
                          <p className="shrink-0 text-xs font-semibold text-emerald-200">{formatCurrency(lead.estimatedValue)}</p>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-zinc-500">
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="h-3 w-3" />
                            {agent?.name ?? "Sin asignar"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3 w-3" />
                            {lead.nextFollowUp}
                          </span>
                        </div>

                        <div className="mt-2 flex gap-1">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              moveStage(lead.id, -1);
                            }}
                            className="flex-1 rounded-lg border border-white/10 bg-black/20 py-1 hover:bg-white/10"
                            aria-label="Mover atrás"
                          >
                            <ChevronLeft className="mx-auto h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              moveStage(lead.id, 1);
                            }}
                            className="flex-1 rounded-lg border border-white/10 bg-black/20 py-1 hover:bg-white/10"
                            aria-label="Mover adelante"
                          >
                            <ChevronRight className="mx-auto h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Drawer
        open={drawerOpen && Boolean(selected)}
        onClose={() => setDrawerOpen(false)}
        title={selected?.name ?? "Oportunidad"}
        description={selected ? `${selected.business} · ${selected.phone}` : ""}
        width="max-w-lg"
        footer={
          selected ? (
            <div className="flex gap-2">
              {selectedConversation ? (
                <Link
                  href={`/dashboard/conversaciones?id=${selectedConversation.id}`}
                  className="flex-1 rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-center text-xs text-cyan-100 hover:bg-cyan-500/20"
                >
                  Abrir conversación
                </Link>
              ) : null}
              <Button onClick={() => setDrawerOpen(false)} className="flex-1">Cerrar</Button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-3">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Valor</p>
                <input
                  type="number"
                  value={selected.estimatedValue}
                  onChange={(event) => updateLead(selected.id, { estimatedValue: Number(event.target.value) || 0 })}
                  className="mt-2 w-full bg-transparent text-lg font-bold text-emerald-100 outline-none"
                />
              </Card>
              <Card className="p-3">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Origen</p>
                <p className="mt-2 text-sm">{selected.source}</p>
              </Card>
            </div>

            <Card className="p-3">
              <p className="text-xs font-semibold">Etapa</p>
              <select
                value={selected.stage}
                onChange={(event) => updateLead(selected.id, { stage: event.target.value as Lead["stage"] })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-sm"
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={slugifyStage(stage.name)}>{stage.name}</option>
                ))}
              </select>
            </Card>

            <Card className="p-3">
              <p className="text-xs font-semibold">Responsable</p>
              <select
                value={selected.assignedAgentId}
                onChange={(event) => updateLead(selected.id, { assignedAgentId: event.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-sm"
              >
                <option value="">Sin asignar</option>
                {workspaceAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </Card>

            <Card className="p-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <CalendarClock className="h-3.5 w-3.5 text-cyan-300" />
                Próximo seguimiento
              </p>
              <input
                value={selected.nextFollowUp}
                onChange={(event) => updateLead(selected.id, { nextFollowUp: event.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
            </Card>

            {selectedConversation ? (
              <Card className="p-3">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  <MessageCircleMore className="h-3.5 w-3.5 text-emerald-300" />
                  Conversación vinculada
                </p>
                <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{selectedConversation.lastMessage}</p>
                <Link
                  href={`/dashboard/conversaciones?id=${selectedConversation.id}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-200"
                >
                  Ir al Inbox <ExternalLink className="h-3 w-3" />
                </Link>
              </Card>
            ) : null}

            {selectedContact ? (
              <Card className="p-3">
                <p className="text-xs font-semibold">Cliente</p>
                <p className="mt-2 text-sm">{selectedContact.name}</p>
                <p className="text-xs text-zinc-500">{selectedContact.business} · {selectedContact.lifecycle}</p>
              </Card>
            ) : null}

            <Card className="p-3">
              <p className="text-xs font-semibold">Notas</p>
              <textarea
                value={selected.notes}
                onChange={(event) => updateLead(selected.id, { notes: event.target.value })}
                className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm"
              />
            </Card>
          </div>
        ) : null}
      </Drawer>

      <Modal open={openNew} onClose={() => setOpenNew(false)} title="Nueva oportunidad">
        <div className="grid gap-3">
          <FormField label="Nombre">
            <input
              value={draft.name}
              onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Teléfono">
              <input
                value={draft.phone}
                onChange={(event) => setDraft((previous) => ({ ...previous, phone: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5"
              />
            </FormField>
            <FormField label="Valor estimado">
              <input
                type="number"
                value={draft.estimatedValue}
                onChange={(event) => setDraft((previous) => ({ ...previous, estimatedValue: Number(event.target.value) || 0 }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5"
              />
            </FormField>
          </div>
          <FormField label="Negocio">
            <input
              value={draft.business}
              onChange={(event) => setDraft((previous) => ({ ...previous, business: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5"
            />
          </FormField>
          <FormField label="Notas">
            <textarea
              value={draft.notes}
              onChange={(event) => setDraft((previous) => ({ ...previous, notes: event.target.value }))}
              className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5"
            />
          </FormField>
        </div>
        <Button onClick={createLead} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40">
          <TrendingUp className="mr-1 h-4 w-4" />
          Crear oportunidad
        </Button>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
