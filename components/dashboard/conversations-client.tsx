"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Flame,
  Send,
  Sparkles,
  StickyNote,
  Tag as TagIcon,
  TimerReset,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";
import { contacts, conversations as seedConversations, leads } from "@/data/mock-data";
import { teamMembers } from "@/data/saas-data";
import { useConfigurableTemplates, useDepartments } from "@/lib/workspace-config";
import { CategoryBadge } from "@/components/dashboard/category-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import {
  ActivityEvent,
  Conversation,
  ConversationCategory,
  ConversationPriority,
  ConversationStatus,
} from "@/types/entities";
import { useWorkspace } from "@/components/dashboard/workspace-context";

const queues: Array<{ value: ConversationStatus | "todas" | "sla"; label: string; tone: string }> = [
  { value: "todas", label: "Todas", tone: "border-white/15 bg-white/5 text-zinc-200" },
  { value: "sla", label: "Urgentes", tone: "border-rose-300/40 bg-rose-500/10 text-rose-100" },
  { value: "nuevo", label: "Nuevos", tone: "border-cyan-300/40 bg-cyan-500/10 text-cyan-100" },
  { value: "en curso", label: "En curso", tone: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100" },
  { value: "pendiente", label: "Pendientes", tone: "border-violet-300/40 bg-violet-500/10 text-violet-100" },
  { value: "ganado", label: "Ganados", tone: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100" },
  { value: "perdido", label: "Perdidos", tone: "border-rose-300/40 bg-rose-500/10 text-rose-100" },
  { value: "cerrado", label: "Cerrados", tone: "border-zinc-300/40 bg-zinc-500/10 text-zinc-200" },
];

const priorityChip: Record<ConversationPriority, string> = {
  alta: "border-rose-300/40 bg-rose-500/10 text-rose-100",
  media: "border-amber-300/40 bg-amber-500/10 text-amber-100",
  baja: "border-zinc-300/40 bg-zinc-500/10 text-zinc-200",
};

function formatSla(minutes: number): { text: string; tone: "rose" | "amber" | "emerald" } {
  if (minutes <= 0) return { text: `SLA vencido ${Math.abs(minutes)}m`, tone: "rose" };
  if (minutes <= 5) return { text: `SLA en riesgo · ${minutes}m`, tone: "amber" };
  return { text: `SLA ${minutes}m`, tone: "emerald" };
}

const toneText = { rose: "text-rose-200", amber: "text-amber-200", emerald: "text-emerald-200" } as const;
const toneChip = {
  rose: "border-rose-300/40 bg-rose-500/10 text-rose-100",
  amber: "border-amber-300/40 bg-amber-500/10 text-amber-100",
  emerald: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100",
} as const;

export function ConversationsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const [items, setItems] = useState<Conversation[]>(seedConversations);
  const [queue, setQueue] = useState<(typeof queues)[number]["value"]>("todas");
  const [filterCategory, setFilterCategory] = useState<ConversationCategory | "todas">("todas");
  const [filterAgent, setFilterAgent] = useState<string>("todos");
  const [filterTag, setFilterTag] = useState<string>("todos");
  const [filterPriority, setFilterPriority] = useState<ConversationPriority | "todas">("todas");
  const [filterIntent, setFilterIntent] = useState<string>("todos");
  const [filterDepartment, setFilterDepartment] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");
  const { departments } = useDepartments();
  const conversationDepartment: Record<string, string> = useMemo(() => {
    // Map by category to default department (first one that includes the category).
    const map: Record<string, string> = {};
    items.forEach((c) => {
      const dept = departments.find((d) => d.categoryIds.some((catId) => catId.includes(c.category.split(" ")[0])));
      if (dept) map[c.id] = dept.id;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, departments]);

  const workspaceItems = useMemo(
    () => items.filter((c) => c.workspaceId === activeWorkspaceId),
    [items, activeWorkspaceId],
  );
  const workspaceAgents = useMemo(
    () => teamMembers.filter((m) => m.workspaceId === activeWorkspaceId),
    [activeWorkspaceId],
  );
  const { templates: configTemplates } = useConfigurableTemplates();
  const workspaceTemplates = useMemo(
    () => configTemplates.filter((t) => t.channel !== "whatsapp" || t.approved),
    [configTemplates],
  );
  const allTags = useMemo(
    () => Array.from(new Set(workspaceItems.flatMap((c) => c.tags))),
    [workspaceItems],
  );
  const allIntents = useMemo(
    () => Array.from(new Set(workspaceItems.map((c) => c.intent))),
    [workspaceItems],
  );

  const filtered = useMemo(
    () =>
      workspaceItems.filter((c) => {
        if (queue === "sla") {
          if (c.slaMinutesRemaining > 5) return false;
          if (c.status === "ganado" || c.status === "perdido" || c.status === "cerrado") return false;
        } else if (queue !== "todas" && c.status !== queue) return false;
        if (filterCategory !== "todas" && c.category !== filterCategory) return false;
        if (filterAgent === "sin-asignar") {
          if (c.assignedAgentId) return false;
        } else if (filterAgent !== "todos" && c.assignedAgentId !== filterAgent) return false;
        if (filterDepartment !== "todos" && conversationDepartment[c.id] !== filterDepartment) return false;
        if (filterTag !== "todos" && !c.tags.includes(filterTag)) return false;
        if (filterPriority !== "todas" && c.priority !== filterPriority) return false;
        if (filterIntent !== "todos" && c.intent !== filterIntent) return false;
        if (
          search &&
          !`${c.customerName} ${c.phone} ${c.lastMessage}`.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [workspaceItems, queue, filterCategory, filterAgent, filterTag, filterPriority, filterIntent, search],
  );

  useEffect(() => {
    setSelectedId(filtered[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId, queue, filterCategory, filterAgent, filterTag, filterPriority, filterIntent, search]);

  useEffect(() => {
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const selected = useMemo(() => items.find((c) => c.id === selectedId), [items, selectedId]);
  const selectedContact = useMemo(
    () => (selected ? contacts.find((c) => c.id === selected.contactId) : undefined),
    [selected],
  );
  const selectedAgent = useMemo(
    () => (selected ? teamMembers.find((m) => m.id === selected.assignedAgentId) : undefined),
    [selected],
  );
  const selectedLead = useMemo(() => {
    if (!selected) return undefined;
    if (selected.linkedLeadId) return leads.find((l) => l.id === selected.linkedLeadId);
    return leads.find((l) => l.conversationId === selected.id || (l.contactId === selected.contactId && l.workspaceId === selected.workspaceId));
  }, [selected]);

  const counts = useMemo(() => {
    const out: Record<string, number> = { todas: workspaceItems.length };
    out["sla"] = workspaceItems.filter((c) => c.slaMinutesRemaining <= 5 && c.status !== "ganado" && c.status !== "perdido" && c.status !== "cerrado").length;
    queues.forEach((q) => {
      if (q.value !== "todas" && q.value !== "sla") {
        out[q.value] = workspaceItems.filter((c) => c.status === q.value).length;
      }
    });
    return out;
  }, [workspaceItems]);

  const updateConversation = (id: string, patch: Partial<Conversation>, activity?: ActivityEvent) =>
    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, ...patch, activity: activity ? [{ ...activity }, ...c.activity] : c.activity }
          : c,
      ),
    );

  const sendReply = () => {
    if (!selected || !reply.trim()) return;
    const now = new Date();
    const stamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    updateConversation(
      selected.id,
      {
        messages: [
          ...selected.messages,
          { id: `m-${Date.now()}`, sender: "agent", agentName: selectedAgent?.name ?? "Agente", content: reply, timestamp: stamp },
        ],
        status: selected.status === "nuevo" ? "en curso" : selected.status,
        slaMinutesRemaining: Math.max(selected.slaMinutesRemaining, 30),
        updatedAt: now.toISOString(),
      },
      { id: `ev-${Date.now()}`, type: "ai", label: `Respuesta enviada por ${selectedAgent?.name ?? "Agente"}`, when: `Hoy ${stamp}` },
    );
    setReply("");
    setToast("Respuesta enviada al cliente.");
  };

  const useSuggested = () => selected && setReply(selected.suggestedReply);
  const insertTemplate = (id: string) => {
    const t = workspaceTemplates.find((x) => x.id === id);
    if (t) setReply(t.body);
  };

  const assignAgent = (agentId: string) => {
    if (!selected) return;
    const agent = workspaceAgents.find((a) => a.id === agentId);
    updateConversation(
      selected.id,
      { assignedAgentId: agentId === "" ? null : agentId },
      { id: `ev-${Date.now()}`, type: "assignment", label: `Reasignada a ${agent?.name ?? "sin asignar"}`, when: "Ahora" },
    );
    setToast(`Conversación asignada a ${agent?.name ?? "sin asignar"}.`);
  };

  const changeStatus = (status: ConversationStatus) => {
    if (!selected) return;
    updateConversation(
      selected.id,
      { status },
      { id: `ev-${Date.now()}`, type: "stage", label: `Movida a ${status}`, when: "Ahora" },
    );
    setToast(`Conversación movida a ${status}.`);
  };

  const addTag = (tag: string) => {
    if (!selected || !tag.trim() || selected.tags.includes(tag)) return;
    updateConversation(
      selected.id,
      { tags: [...selected.tags, tag] },
      { id: `ev-${Date.now()}`, type: "tag", label: `Etiqueta '${tag}' agregada`, when: "Ahora" },
    );
    setToast(`Etiqueta '${tag}' agregada.`);
  };

  const removeTag = (tag: string) => {
    if (!selected) return;
    updateConversation(selected.id, { tags: selected.tags.filter((t) => t !== tag) });
  };

  const saveNote = () => {
    if (!selected || !note.trim()) return;
    updateConversation(
      selected.id,
      { internalNotes: `${selected.internalNotes}\n· ${note}`.trim() },
      { id: `ev-${Date.now()}`, type: "note", label: `Nota interna agregada`, when: "Ahora" },
    );
    setNote("");
    setToast("Nota interna guardada.");
  };

  const updateNextTask = (text: string) => {
    if (!selected) return;
    updateConversation(selected.id, { nextTask: text });
  };
  const updateNextDue = (date: string) => {
    if (!selected) return;
    updateConversation(selected.id, { nextTaskDueDate: date });
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 text-xs">
        <button onClick={() => setFilterDepartment("todos")} className={`rounded-xl px-3 py-1.5 transition ${filterDepartment === "todos" ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-300 hover:bg-white/10"}`}>
          Todos los departamentos
          <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-300">{workspaceItems.length}</span>
        </button>
        {departments.filter((d) => d.active !== false).map((d) => {
          const count = workspaceItems.filter((c) => conversationDepartment[c.id] === d.id).length;
          const isActive = filterDepartment === d.id;
          return (
            <button key={d.id} onClick={() => setFilterDepartment(d.id)} className={`rounded-xl px-3 py-1.5 transition ${isActive ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-300 hover:bg-white/10"}`}>
              {d.name}
              <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-300">{count}</span>
            </button>
          );
        })}
        <button onClick={() => { setFilterDepartment("todos"); setFilterAgent("sin-asignar"); }} className={`ml-auto rounded-xl px-3 py-1.5 text-xs transition ${filterAgent === "sin-asignar" ? "bg-rose-500/20 text-rose-100" : "text-zinc-300 hover:bg-white/10"}`}>
          Sin asignar
          <span className="ml-1 rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-300">{workspaceItems.filter((c) => !c.assignedAgentId).length}</span>
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-8">
        {queues.map((q) => (
          <button
            key={q.value}
            onClick={() => setQueue(q.value)}
            className={`rounded-2xl border px-3 py-2.5 text-left text-xs transition ${
              queue === q.value ? `${q.tone} ring-1 ring-white/30` : "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
            }`}
          >
            <p className="text-[11px] uppercase tracking-wide opacity-70">{q.label}</p>
            <p className="mt-1 text-2xl font-semibold">{counts[q.value] ?? 0}</p>
          </button>
        ))}
      </div>

      <Card className="mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nombre, teléfono o mensaje"
            className="min-w-56 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
          />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as ConversationCategory | "todas")} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <option value="todas" className="bg-[#0b1023]">Todas las categorías</option>
            <option value="presupuesto" className="bg-[#0b1023]">Presupuesto</option>
            <option value="pedido" className="bg-[#0b1023]">Pedido</option>
            <option value="consulta" className="bg-[#0b1023]">Consulta</option>
            <option value="soporte humano" className="bg-[#0b1023]">Soporte humano</option>
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as ConversationPriority | "todas")} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <option value="todas" className="bg-[#0b1023]">Todas las prioridades</option>
            <option value="alta" className="bg-[#0b1023]">Prioridad alta</option>
            <option value="media" className="bg-[#0b1023]">Prioridad media</option>
            <option value="baja" className="bg-[#0b1023]">Prioridad baja</option>
          </select>
          <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <option value="todos" className="bg-[#0b1023]">Todos los operadores</option>
            <option value="sin-asignar" className="bg-[#0b1023]">Sin asignar</option>
            {workspaceAgents.map((a) => (
              <option key={a.id} value={a.id} className="bg-[#0b1023]">{a.name}</option>
            ))}
          </select>
          {departments.length > 0 ? (
            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm" aria-label="Departamento">
              <option value="todos" className="bg-[#0b1023]">Todos los departamentos</option>
              {departments.filter((d) => d.active !== false).map((d) => (
                <option key={d.id} value={d.id} className="bg-[#0b1023]">{d.name}</option>
              ))}
            </select>
          ) : null}
          <select value={filterIntent} onChange={(e) => setFilterIntent(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <option value="todos" className="bg-[#0b1023]">Todos los intents</option>
            {allIntents.map((t) => (
              <option key={t} value={t} className="bg-[#0b1023]">{t}</option>
            ))}
          </select>
          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <option value="todos" className="bg-[#0b1023]">Todas las etiquetas</option>
            {allTags.map((t) => (
              <option key={t} value={t} className="bg-[#0b1023]">{t}</option>
            ))}
          </select>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card className="p-3">
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-zinc-400">Sin conversaciones para los filtros aplicados.</p>
            ) : (
              filtered.map((c) => {
                const sla = formatSla(c.slaMinutesRemaining);
                const agent = workspaceAgents.find((a) => a.id === c.assignedAgentId);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selected?.id === c.id ? "border-cyan-300/40 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{c.customerName}</p>
                        <p className="truncate text-[11px] text-zinc-400">{c.phone} · {agent?.name ?? "Sin asignar"}</p>
                      </div>
                      <span className={`shrink-0 text-[11px] ${toneText[sla.tone]}`}>{sla.text}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-zinc-300">{c.lastMessage}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <CategoryBadge category={c.category} />
                      <StatusBadge status={c.status} />
                      <span className={`rounded-full border px-2 py-0.5 ${priorityChip[c.priority]}`}>Prio {c.priority}</span>
                      <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-0.5 text-cyan-100">Puntaje {c.leadScore}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {selected ? (
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Conversación</p>
                  <h3 className="text-xl font-semibold">{selected.customerName}</h3>
                  <p className="text-sm text-zinc-400">{selected.phone} · {selected.businessName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full border px-2 py-1 ${toneChip[formatSla(selected.slaMinutesRemaining).tone]}`}>
                    <TimerReset className="mr-1 inline h-3.5 w-3.5" />{formatSla(selected.slaMinutesRemaining).text}
                  </span>
                  <span className="rounded-full border border-cyan-300/40 bg-cyan-500/10 px-2 py-1 text-cyan-100"><Flame className="mr-1 inline h-3.5 w-3.5" />Puntaje {selected.leadScore}</span>
                  <CategoryBadge category={selected.category} />
                  <StatusBadge status={selected.status} />
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px]">
                <Card className="p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
                    <span>Hilo de mensajes</span>
                    <span>Intent: {selected.intent}</span>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-3">
                    {selected.messages.map((m) => (
                      <div key={m.id} className={`max-w-[85%] rounded-xl p-3 text-sm ${m.sender === "customer" ? "bg-white/10" : m.sender === "agent" ? "ml-auto bg-emerald-500/20" : "ml-auto bg-cyan-500/20"}`}>
                        {m.agentName ? <p className="text-[10px] uppercase tracking-wide text-emerald-200/70">{m.agentName}</p> : null}
                        <p>{m.content}</p>
                        <p className="mt-1 text-[10px] text-zinc-300/80">{m.timestamp}</p>
                      </div>
                    ))}
                  </div>

                  <Card className="mt-3 border-cyan-300/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                    <p className="inline-flex items-center gap-2 font-medium"><Bot className="h-4 w-4" /> Respuesta sugerida</p>
                    <p className="mt-1 text-zinc-100">{selected.suggestedReply}</p>
                    <button onClick={useSuggested} className="mt-2 rounded-lg border border-cyan-300/40 bg-cyan-400/20 px-2 py-1 text-xs">Usar sugerencia</button>
                  </Card>

                  <div className="mt-3 flex items-end gap-2">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        // expand /shortcut into template body when user types Tab or Enter
                        if (e.key === "Tab" && reply.startsWith("/")) {
                          const t = workspaceTemplates.find((x) => x.shortcut === reply.trim());
                          if (t) { e.preventDefault(); setReply(t.body); }
                        }
                      }}
                      placeholder="Escribí tu respuesta… o usá un atajo /cot, /fup, /post"
                      className="min-h-16 flex-1 rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm"
                    />
                    <Button onClick={sendReply} className="bg-emerald-500/30 hover:bg-emerald-500/40">
                      <Send className="mr-1 h-4 w-4" />Enviar
                    </Button>
                  </div>

                  {workspaceTemplates.length > 0 ? (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-zinc-400">Respuestas rápidas:</span>
                      {workspaceTemplates.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => insertTemplate(t.id)}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-200 hover:bg-white/10"
                          title={t.body}
                        >
                          {t.name}{t.shortcut ? <span className="ml-1 font-mono text-[10px] text-zinc-400">{t.shortcut}</span> : null}
                        </button>
                      ))}
                      <Link href="/dashboard/plantillas" className="ml-auto text-[11px] text-cyan-200 hover:text-cyan-100">Editar plantillas →</Link>
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-zinc-500">
                      Sin plantillas configuradas. <Link href="/dashboard/plantillas" className="text-cyan-200 underline">Crear una</Link>.
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                    <Button onClick={() => changeStatus("en curso")}><Sparkles className="mr-1 h-4 w-4" />En curso</Button>
                    <Button onClick={() => changeStatus("pendiente")}><Clock3 className="mr-1 h-4 w-4" />Pendiente</Button>
                    <Button onClick={() => changeStatus("ganado")} className="border-emerald-300/40 bg-emerald-500/20 hover:bg-emerald-500/30"><CheckCircle2 className="mr-1 h-4 w-4" />Marcar ganado</Button>
                    <Button onClick={() => changeStatus("perdido")} className="border-rose-300/40 bg-rose-500/20 hover:bg-rose-500/30"><XCircle className="mr-1 h-4 w-4" />Marcar perdido</Button>
                    <Button onClick={() => changeStatus("cerrado")}>Cerrar</Button>
                    <Button onClick={() => setToast(`Seguimiento agendado: ${selected.nextTask}`)}>Agendar follow-up</Button>
                  </div>

                  <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-2">
                    <p className="px-1 text-[10px] uppercase tracking-wide text-zinc-500">Acciones rápidas</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-5">
                      <button
                        onClick={() => {
                          const target = workspaceAgents.find((a) => a.id !== selected.assignedAgentId);
                          if (target) { assignAgent(target.id); setToast(`Conversación transferida a ${target.name}.`); }
                          else setToast("No hay otro operador disponible para transferir.");
                        }}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 hover:bg-white/10"
                      >
                        Transferir
                      </button>
                      <button
                        onClick={() => { updateConversation(selected.id, { priority: "alta", status: "en curso" }, { id: `ev-${Date.now()}`, type: "stage", label: "Escalada por urgencia", when: "Ahora" }); setToast("Conversación escalada y prioridad alta."); }}
                        className="rounded-lg border border-rose-300/30 bg-rose-500/10 px-2 py-1.5 text-rose-100 hover:bg-rose-500/15"
                      >
                        Escalar
                      </button>
                      <button
                        onClick={() => { addTag("urgente"); updateConversation(selected.id, { priority: "alta" }); setToast("Marcada como urgente."); }}
                        className="rounded-lg border border-amber-300/30 bg-amber-500/10 px-2 py-1.5 text-amber-100 hover:bg-amber-500/15"
                      >
                        Marcar urgente
                      </button>
                      <button
                        onClick={() => {
                          const due = new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16);
                          updateConversation(selected.id, { nextTask: `Tarea: ${selected.intent}`, nextTaskDueDate: due }, { id: `ev-${Date.now()}`, type: "note", label: "Tarea creada", when: "Ahora" });
                          setToast("Tarea creada con vencimiento en 30 min.");
                        }}
                        className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-2 py-1.5 text-cyan-100 hover:bg-cyan-500/15"
                      >
                        Crear tarea
                      </button>
                      <button
                        onClick={() => { setToast(`Lead '${selected.customerName}' creado en pipeline.`); updateConversation(selected.id, {}, { id: `ev-${Date.now()}`, type: "stage", label: "Lead generado desde conversación", when: "Ahora" }); }}
                        className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-2 py-1.5 text-emerald-100 hover:bg-emerald-500/15"
                      >
                        Crear lead
                      </button>
                    </div>
                  </div>
                </Card>

                <div className="space-y-3">
                  <Card className="p-3">
                    <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400"><User className="h-3.5 w-3.5" /> Perfil del cliente</p>
                    <p className="mt-2 text-sm font-semibold">{selectedContact?.name}</p>
                    <p className="text-xs text-zinc-400">{selectedContact?.business}</p>
                    <p className="mt-1 text-xs text-zinc-400">Origen: {selectedContact?.source}</p>
                    <p className="text-xs text-zinc-400">Lifecycle: {selectedContact?.lifecycle}</p>
                    <p className="text-xs text-zinc-400">Conversaciones: {selectedContact?.totalConversations}</p>
                    {selectedContact ? <Link href={`/dashboard/contactos?id=${selectedContact.id}`} className="mt-1 inline-flex items-center gap-1 text-[11px] text-cyan-200 hover:text-cyan-100">Ver contacto <ExternalLink className="h-3 w-3" /></Link> : null}
                    {selected.estimatedOpportunity ? (
                      <p className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100">Oportunidad: {selected.estimatedOpportunity}</p>
                    ) : null}
                  </Card>

                  {selectedLead ? (
                    <Card className="p-3">
                      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400"><Sparkles className="h-3.5 w-3.5" /> Lead vinculado</p>
                      <p className="mt-2 text-sm font-semibold">{selectedLead.name}</p>
                      <p className="text-xs text-zinc-400">{selectedLead.business}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs"><StatusBadge status={selectedLead.stage} /></p>
                      <p className="mt-1 text-xs text-emerald-200">Valor estimado AR$ {selectedLead.estimatedValue.toLocaleString("es-AR")}</p>
                      <p className="text-[11px] text-zinc-400">Próximo follow-up: {selectedLead.nextFollowUp}</p>
                      <Link href={`/dashboard/leads?id=${selectedLead.id}`} className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-200 hover:text-cyan-100">Abrir en pipeline <ExternalLink className="h-3 w-3" /></Link>
                    </Card>
                  ) : (
                    <Card className="p-3 text-xs text-zinc-400">
                      <p>Sin lead vinculado. Convertí esta conversación en lead desde el pipeline.</p>
                    </Card>
                  )}

                  <Card className="p-3">
                    <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400"><UserPlus className="h-3.5 w-3.5" /> Operador asignado</p>
                    <select value={selected.assignedAgentId ?? ""} onChange={(e) => assignAgent(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm">
                      <option value="" className="bg-[#0b1023]">Sin asignar</option>
                      {workspaceAgents.map((a) => (
                        <option key={a.id} value={a.id} className="bg-[#0b1023]">{a.name} · {a.role}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-[10px] text-zinc-500">La asignación persiste en esta sesión.</p>
                    {departments.length > 0 ? (
                      <div className="mt-2">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Departamento</p>
                        <p className="mt-1 text-xs text-zinc-300">{departments.find((d) => d.id === conversationDepartment[selected.id])?.name ?? "Sin asignar"}</p>
                      </div>
                    ) : null}
                  </Card>

                  <Card className="p-3">
                    <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400"><TagIcon className="h-3.5 w-3.5" /> Etiquetas</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selected.tags.map((t) => (
                        <button key={t} onClick={() => removeTag(t)} className="rounded-full border border-violet-300/30 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-100 hover:bg-violet-500/20">#{t} ✕</button>
                      ))}
                    </div>
                    <input
                      placeholder="+ etiqueta y Enter"
                      onKeyDown={(e) => { if (e.key === "Enter") { addTag(e.currentTarget.value); e.currentTarget.value = ""; } }}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-xs"
                    />
                  </Card>
                </div>
              </div>
            </Card>

            <div className="grid gap-3 md:grid-cols-2">
              <Card className="p-4">
                <p className="text-sm font-semibold inline-flex items-center gap-2"><CalendarClock className="h-4 w-4 text-emerald-300" /> Próxima tarea / follow-up</p>
                <input value={selected.nextTask} onChange={(e) => updateNextTask(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm" />
                <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
                  <input type="datetime-local" value={selected.nextTaskDueDate ?? ""} onChange={(e) => updateNextDue(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm" />
                  <Button onClick={() => setToast("Recordatorio agendado.")}>Agendar</Button>
                </div>
                <p className="mt-2 text-[11px] text-zinc-500">Recomendación AI: priorizá esta conversación, puntaje {selected.leadScore} y {formatSla(selected.slaMinutesRemaining).text.toLowerCase()}.</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm font-semibold inline-flex items-center gap-2"><StickyNote className="h-4 w-4 text-violet-300" /> Notas internas</p>
                <p className="mt-2 max-h-24 overflow-y-auto whitespace-pre-line rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-zinc-200">{selected.internalNotes || "Sin notas todavía."}</p>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Agregá una nota interna…" className="mt-2 min-h-14 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-xs" />
                <Button onClick={saveNote} className="mt-2 w-full text-xs">Guardar nota</Button>
              </Card>
            </div>

            <Card className="p-4">
              <p className="text-sm font-semibold inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-cyan-300" />Línea de tiempo</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {selected.activity.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-zinc-300">
                    {ev.type === "sla" ? <AlertTriangle className="h-3.5 w-3.5 text-rose-300" /> : <Sparkles className="h-3.5 w-3.5 text-cyan-300" />}
                    <div>
                      <p>{ev.label}</p>
                      <p className="text-[10px] text-zinc-500">{ev.when}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-8 text-center text-sm text-zinc-400">Seleccioná una conversación para ver el detalle.</Card>
        )}
      </div>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
