"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  MessageCircleMore,
  Paperclip,
  Search,
  Send,
  Sparkles,
  StickyNote,
  Tag,
  UserRound,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import { useConfigurableTemplates, useDepartments, usePipelines } from "@/lib/workspace-config";
import { useCRMStore } from "@/lib/crm-store";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { Conversation, ConversationStatus } from "@/types/entities";

type InboxQueue = "todas" | "sin-asignar" | "mias" | "seguimientos" | "urgentes";

const queueOptions: Array<{ value: InboxQueue; label: string }> = [
  { value: "todas", label: "Todas" },
  { value: "sin-asignar", label: "Sin asignar" },
  { value: "mias", label: "Mías" },
  { value: "seguimientos", label: "Seguimientos" },
  { value: "urgentes", label: "Urgentes" },
];

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

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isClosed(status: ConversationStatus) {
  return status === "ganado" || status === "perdido" || status === "cerrado";
}

export function ConversationsClient() {
  const { activeWorkspaceId, teamMembers, currentUserId } = useWorkspace();
  const {
    contacts,
    conversations,
    leads,
    updateConversation: persistConversation,
    sendMessage,
    createLeadFromConversation,
    updateLead: persistLead,
  } = useCRMStore();
  const { departments } = useDepartments();
  const { pipelines, defaultPipelineId } = usePipelines();
  const { templates } = useConfigurableTemplates();

  const [queue, setQueue] = useState<InboxQueue>("todas");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");

  const workspaceItems = useMemo(
    () => conversations.filter((item) => item.workspaceId === activeWorkspaceId),
    [conversations, activeWorkspaceId],
  );
  const workspaceAgents = useMemo(
    () => teamMembers.filter((member) => member.workspaceId === activeWorkspaceId && member.status === "active"),
    [activeWorkspaceId, teamMembers],
  );
  const currentAgentId = currentUserId || workspaceAgents[0]?.id || "";

  const conversationDepartment = useMemo(() => {
    const map: Record<string, string> = {};
    workspaceItems.forEach((conversation) => {
      const department = departments.find((item) =>
        item.categoryIds.some((categoryId) => categoryId.includes(conversation.category.split(" ")[0])),
      );
      if (department) map[conversation.id] = department.id;
    });
    return map;
  }, [workspaceItems, departments]);

  const counts = useMemo(() => {
    const active = workspaceItems.filter((item) => !isClosed(item.status));
    return {
      todas: workspaceItems.length,
      "sin-asignar": active.filter((item) => !item.assignedAgentId).length,
      mias: active.filter((item) => item.assignedAgentId === currentAgentId).length,
      seguimientos: active.filter((item) => Boolean(item.nextTask)).length,
      urgentes: active.filter((item) => item.priority === "alta" || item.slaMinutesRemaining <= 5).length,
    };
  }, [workspaceItems, currentAgentId]);

  const filtered = useMemo(() => {
    const result = workspaceItems.filter((conversation) => {
      if (queue === "sin-asignar" && conversation.assignedAgentId) return false;
      if (queue === "mias" && conversation.assignedAgentId !== currentAgentId) return false;
      if (queue === "seguimientos" && (!conversation.nextTask || isClosed(conversation.status))) return false;
      if (queue === "urgentes" && (isClosed(conversation.status) || (conversation.priority !== "alta" && conversation.slaMinutesRemaining > 5))) return false;
      if (departmentFilter !== "todos" && conversationDepartment[conversation.id] !== departmentFilter) return false;
      if (categoryFilter !== "todas" && conversation.category !== categoryFilter) return false;
      if (search && !`${conversation.customerName} ${conversation.phone} ${conversation.businessName} ${conversation.lastMessage}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    return [...result].sort((a, b) => {
      const aUrgency = isClosed(a.status) ? 10000 : Math.min(a.slaMinutesRemaining, 999);
      const bUrgency = isClosed(b.status) ? 10000 : Math.min(b.slaMinutesRemaining, 999);
      return aUrgency - bUrgency;
    });
  }, [workspaceItems, queue, currentAgentId, departmentFilter, categoryFilter, search, conversationDepartment]);

  useEffect(() => {
    const requested = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null;
    if (requested && workspaceItems.some((item) => item.id === requested)) {
      setSelectedId(requested);
      return;
    }
    setSelectedId((current) => (filtered.some((item) => item.id === current) ? current : (filtered[0]?.id ?? "")));
  }, [activeWorkspaceId, filtered, workspaceItems]);

  const selected = useMemo(
    () => conversations.find((item) => item.id === selectedId),
    [conversations, selectedId],
  );
  const selectedContact = useMemo(
    () => (selected ? contacts.find((contact) => contact.id === selected.contactId) : undefined),
    [selected, contacts],
  );
  const selectedLead = useMemo(() => {
    if (!selected) return undefined;
    if (selected.linkedLeadId) return leads.find((lead) => lead.id === selected.linkedLeadId);
    return leads.find(
      (lead) =>
        lead.workspaceId === selected.workspaceId &&
        (lead.conversationId === selected.id || lead.contactId === selected.contactId),
    );
  }, [selected, leads]);

  const activePipeline = pipelines.find((pipeline) => pipeline.id === defaultPipelineId) ?? pipelines[0];
  const stages = useMemo(
    () => (activePipeline ? [...activePipeline.stages].sort((a, b) => a.order - b.order) : []),
    [activePipeline],
  );

  const workspaceTemplates = useMemo(
    () => templates.filter((template) => template.channel !== "whatsapp" || template.approved).slice(0, 4),
    [templates],
  );

  const updateConversation = (id: string, patch: Partial<Conversation>) => {
    void persistConversation(id, patch).catch((err) =>
      setToast(err instanceof Error ? err.message : "No se pudo actualizar la conversación."),
    );
  };

  const assignAgent = (agentId: string) => {
    if (!selected) return;
    updateConversation(selected.id, { assignedAgentId: agentId || null });
    const name = workspaceAgents.find((agent) => agent.id === agentId)?.name ?? "Sin asignar";
    setToast(`Responsable actualizado: ${name}.`);
  };

  const changeStatus = (status: ConversationStatus) => {
    if (!selected) return;
    updateConversation(selected.id, { status });
    setToast(status === "cerrado" ? "Conversación resuelta." : `Conversación movida a ${status}.`);
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    const body = reply.trim();
    setReply("");
    try {
      await sendMessage(selected.id, body);
      setToast("Mensaje guardado en el Inbox.");
    } catch (err) {
      setReply(body);
      setToast(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    }
  };

  const addTag = (tag: string) => {
    if (!selected || !tag.trim() || selected.tags.includes(tag.trim())) return;
    updateConversation(selected.id, { tags: [...selected.tags, tag.trim()] });
  };

  const saveNote = () => {
    if (!selected || !note.trim()) return;
    const text = selected.internalNotes
      ? `${selected.internalNotes}\n· ${note.trim()}`
      : `· ${note.trim()}`;
    updateConversation(selected.id, { internalNotes: text });
    setNote("");
    setToast("Nota guardada.");
  };

  const createOpportunity = async () => {
    if (!selected) return;
    try {
      await createLeadFromConversation(selected);
      setToast("Oportunidad creada y vinculada en Ventas.");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "No se pudo crear la oportunidad.");
    }
  };

  const updateLead = (patch: Partial<NonNullable<typeof selectedLead>>) => {
    if (!selectedLead) return;
    void persistLead(selectedLead.id, patch).catch((err) =>
      setToast(err instanceof Error ? err.message : "No se pudo actualizar la oportunidad."),
    );
  };

  if (!selected && workspaceItems.length === 0) {
    return <Card className="p-8 text-center text-sm text-zinc-400">Todavía no hay conversaciones en este negocio.</Card>;
  }

  return (
    <>
      <div className="space-y-3">
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-64 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, negocio o mensaje"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters((value) => !value)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10"
            >
              <Filter className="h-4 w-4" />
              Filtros
              <ChevronDown className={`h-3.5 w-3.5 transition ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
            {queueOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setQueue(option.value)}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs transition ${
                  queue === option.value ? "bg-cyan-500/20 text-cyan-100" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
              >
                {option.label}
                <span className="ml-1.5 rounded-full border border-white/10 bg-black/20 px-1.5 py-0.5 text-[10px]">
                  {counts[option.value]}
                </span>
              </button>
            ))}
          </div>

          {showFilters ? (
            <div className="mt-3 grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-2">
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-sm"
              >
                <option value="todos">Todos los equipos</option>
                {departments.filter((department) => department.active !== false).map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-sm"
              >
                <option value="todas">Todas las categorías</option>
                <option value="presupuesto">Presupuesto</option>
                <option value="pedido">Pedido</option>
                <option value="consulta">Consulta</option>
                <option value="soporte humano">Soporte humano</option>
              </select>
            </div>
          ) : null}
        </Card>

        <div className="grid min-h-[680px] gap-3 xl:grid-cols-[320px_minmax(0,1fr)_330px]">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-white/10 px-3 py-3">
              <p className="text-sm font-semibold">Inbox</p>
              <p className="text-xs text-zinc-500">{filtered.length} conversaciones</p>
            </div>
            <div className="max-h-[640px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="p-6 text-center text-xs text-zinc-500">No hay conversaciones con estos filtros.</p>
              ) : filtered.map((conversation) => {
                const agent = workspaceAgents.find((item) => item.id === conversation.assignedAgentId);
                const urgent = !isClosed(conversation.status) && (conversation.slaMinutesRemaining <= 5 || conversation.priority === "alta");
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedId(conversation.id)}
                    className={`mb-1 w-full rounded-xl border p-3 text-left transition ${
                      selected?.id === conversation.id
                        ? "border-cyan-300/40 bg-cyan-500/10"
                        : "border-transparent hover:border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold">
                        {initials(conversation.customerName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{conversation.customerName}</p>
                          {urgent ? <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400" title="Urgente" /> : null}
                        </div>
                        <p className="truncate text-[11px] text-zinc-500">
                          {conversation.businessName} · {agent?.name ?? "Sin asignar"}
                        </p>
                        <p className="mt-1.5 line-clamp-2 text-xs text-zinc-300">{conversation.lastMessage}</p>
                        <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                          <span className={urgent ? "text-rose-200" : "text-zinc-500"}>
                            {isClosed(conversation.status)
                              ? conversation.status
                              : conversation.slaMinutesRemaining <= 0
                                ? `Vencido ${Math.abs(conversation.slaMinutesRemaining)}m`
                                : `${conversation.slaMinutesRemaining}m SLA`}
                          </span>
                          <span className="truncate text-zinc-500">{conversation.category}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {selected ? (
            <Card className="flex min-h-[680px] min-w-0 flex-col overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-500/10 text-sm font-semibold text-cyan-100">
                    {initials(selected.customerName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{selected.customerName}</p>
                    <p className="truncate text-xs text-zinc-500">{selected.phone} · {selected.businessName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selected.status}
                    onChange={(event) => changeStatus(event.target.value as ConversationStatus)}
                    className="rounded-xl border border-white/10 bg-[#0b1023] px-2 py-1.5 text-xs"
                  >
                    <option value="nuevo">Nuevo</option>
                    <option value="en curso">En curso</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="cerrado">Resuelto</option>
                    <option value="ganado">Ganado</option>
                    <option value="perdido">Perdido</option>
                  </select>
                  <Button onClick={() => changeStatus("cerrado")} className="hidden sm:inline-flex">
                    <Check className="mr-1 h-4 w-4" />Resolver
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-black/10 p-4">
                <div className="mx-auto max-w-3xl space-y-3">
                  {selected.messages.map((message) => {
                    const outgoing = message.sender === "agent";
                    const system = message.sender === "system";
                    if (system) {
                      return (
                        <p key={message.id} className="text-center text-[10px] text-zinc-500">{message.content}</p>
                      );
                    }
                    return (
                      <div key={message.id} className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                          outgoing
                            ? "rounded-br-md bg-emerald-500/20 text-emerald-50"
                            : "rounded-bl-md border border-white/10 bg-white/5 text-zinc-100"
                        }`}>
                          {outgoing && message.agentName ? <p className="mb-1 text-[10px] text-emerald-200/70">{message.agentName}</p> : null}
                          <p>{message.content}</p>
                          <p className="mt-1 text-right text-[9px] text-zinc-500">{message.timestamp}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-white/10 p-3">
                {selected.suggestedReply ? (
                  <div className="mb-2 flex items-start gap-2 rounded-xl border border-violet-300/20 bg-violet-500/5 p-2.5">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-200" />
                    <p className="line-clamp-2 flex-1 text-xs text-zinc-300">{selected.suggestedReply}</p>
                    <button onClick={() => setReply(selected.suggestedReply)} className="shrink-0 text-xs text-violet-200 hover:text-violet-100">Usar</button>
                  </div>
                ) : null}

                <div className="flex items-end gap-2">
                  <button onClick={() => setToast("Adjunto listo para seleccionar (demo).")} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400 hover:bg-white/10" title="Adjuntar">
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                        event.preventDefault();
                        sendReply();
                      }
                    }}
                    placeholder="Escribí una respuesta…"
                    className="min-h-12 max-h-28 flex-1 resize-y rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none focus:border-cyan-300/30"
                  />
                  <button
                    onClick={() => {
                      const base = reply || selected.suggestedReply;
                      if (!base) return;
                      setReply(base.length > 140 ? base.slice(0, 137) + "…" : base);
                      setToast("Texto simplificado.");
                    }}
                    className="rounded-xl border border-violet-300/20 bg-violet-500/10 p-2.5 text-violet-200 hover:bg-violet-500/20"
                    title="Mejorar texto"
                  >
                    <WandSparkles className="h-4 w-4" />
                  </button>
                  <Button onClick={sendReply} className="bg-emerald-500/30 hover:bg-emerald-500/40">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {workspaceTemplates.length > 0 ? (
                  <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                    {workspaceTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setReply(template.body)}
                        className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-zinc-300 hover:bg-white/10"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </Card>
          ) : (
            <Card className="flex min-h-[680px] items-center justify-center p-8 text-sm text-zinc-500">
              Seleccioná una conversación.
            </Card>
          )}

          {selected ? (
            <div className="space-y-3">
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Cliente</p>
                    <p className="mt-1 font-semibold">{selectedContact?.name ?? selected.customerName}</p>
                    <p className="text-xs text-zinc-500">{selectedContact?.business ?? selected.businessName}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-zinc-400">
                    {selectedContact?.lifecycle ?? "lead"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                    <p className="text-[10px] uppercase text-zinc-500">Origen</p>
                    <p className="mt-1">{selectedContact?.source ?? "WhatsApp"}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                    <p className="text-[10px] uppercase text-zinc-500">Score</p>
                    <p className="mt-1 font-semibold text-emerald-200">{selected.leadScore}/100</p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Responsable</p>
                  <select
                    value={selected.assignedAgentId ?? ""}
                    onChange={(event) => assignAgent(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-xs"
                  >
                    <option value="">Sin asignar</option>
                    {workspaceAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-3">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Etiquetas</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {selected.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-violet-300/20 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-100">#{tag}</span>
                    ))}
                  </div>
                  <input
                    placeholder="+ etiqueta y Enter"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        addTag(event.currentTarget.value);
                        event.currentTarget.value = "";
                      }
                    }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                  />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold">
                    <MessageCircleMore className="h-4 w-4 text-emerald-300" />
                    Oportunidad
                  </p>
                  {selectedLead ? <span className="text-[10px] text-emerald-200">{formatCurrency(selectedLead.estimatedValue)}</span> : null}
                </div>

                {selectedLead ? (
                  <div className="mt-3 space-y-2">
                    <select
                      value={selectedLead.stage}
                      onChange={(event) => updateLead({ stage: event.target.value as typeof selectedLead.stage })}
                      className="w-full rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-xs"
                    >
                      {stages.map((stage) => (
                        <option key={stage.id} value={slugifyStage(stage.name)}>{stage.name}</option>
                      ))}
                    </select>
                    <label className="block text-[10px] uppercase tracking-wide text-zinc-500">Valor estimado</label>
                    <input
                      type="number"
                      value={selectedLead.estimatedValue}
                      onChange={(event) => updateLead({ estimatedValue: Number(event.target.value) || 0 })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                    />
                    <label className="block text-[10px] uppercase tracking-wide text-zinc-500">Próximo seguimiento</label>
                    <input
                      value={selectedLead.nextFollowUp}
                      onChange={(event) => updateLead({ nextFollowUp: event.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                    />
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
                    <p>Esta conversación todavía no está en el pipeline.</p>
                    <Button onClick={createOpportunity} className="mt-3 w-full bg-emerald-500/20 hover:bg-emerald-500/30">
                      Crear oportunidad
                    </Button>
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  <CalendarClock className="h-4 w-4 text-cyan-300" />
                  Seguimiento
                </p>
                <input
                  value={selected.nextTask}
                  onChange={(event) => updateConversation(selected.id, { nextTask: event.target.value })}
                  placeholder="Qué hay que hacer"
                  className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                />
                <input
                  type="datetime-local"
                  value={selected.nextTaskDueDate ?? ""}
                  onChange={(event) => updateConversation(selected.id, { nextTaskDueDate: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                />
              </Card>

              <Card className="p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  <StickyNote className="h-4 w-4 text-amber-300" />
                  Nota interna
                </p>
                {selected.internalNotes ? (
                  <p className="mt-2 max-h-24 overflow-y-auto whitespace-pre-line rounded-lg bg-black/20 p-2 text-[11px] text-zinc-400">{selected.internalNotes}</p>
                ) : null}
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Escribí una nota para el equipo"
                  className="mt-2 min-h-16 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-xs"
                />
                <Button onClick={saveNote} className="mt-2 w-full text-xs">Guardar nota</Button>
              </Card>

              <Card className="border-violet-300/20 bg-violet-500/5 p-4">
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-violet-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Resumen
                </p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                  {selected.intent}. Prioridad {selected.priority}. Siguiente paso sugerido: {selected.nextTask || "definir seguimiento"}.
                </p>
              </Card>
            </div>
          ) : (
            <Card className="min-h-[680px] p-6" />
          )}
        </div>
      </div>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
