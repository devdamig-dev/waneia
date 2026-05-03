"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Flame,
  MessageSquarePlus,
  Send,
  Sparkles,
  StickyNote,
  Tag as TagIcon,
  TimerReset,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";
import { conversations as seedConversations, contacts } from "@/data/mock-data";
import { teamMembers } from "@/data/saas-data";
import { CategoryBadge } from "@/components/dashboard/category-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import {
  ActivityEvent,
  Conversation,
  ConversationCategory,
  ConversationStatus,
} from "@/types/entities";
import { useWorkspace } from "@/components/dashboard/workspace-context";

const queues: Array<{ value: ConversationStatus | "todas"; label: string; tone: string }> = [
  { value: "todas", label: "Todas", tone: "border-white/15 bg-white/5 text-zinc-200" },
  { value: "urgente", label: "Urgentes", tone: "border-rose-300/40 bg-rose-500/10 text-rose-100" },
  { value: "sin responder", label: "Sin responder", tone: "border-amber-300/40 bg-amber-500/10 text-amber-100" },
  { value: "en seguimiento", label: "En seguimiento", tone: "border-cyan-300/40 bg-cyan-500/10 text-cyan-100" },
  { value: "pendiente", label: "Pendientes", tone: "border-violet-300/40 bg-violet-500/10 text-violet-100" },
  { value: "ganada", label: "Ganadas", tone: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100" },
  { value: "perdida", label: "Perdidas", tone: "border-zinc-300/40 bg-zinc-500/10 text-zinc-200" },
];

const priorityChip: Record<string, string> = {
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
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");

  const workspaceItems = useMemo(
    () => items.filter((c) => c.workspaceId === activeWorkspaceId),
    [items, activeWorkspaceId],
  );
  const workspaceAgents = useMemo(
    () => teamMembers.filter((m) => m.workspaceId === activeWorkspaceId),
    [activeWorkspaceId],
  );
  const allTags = useMemo(
    () => Array.from(new Set(workspaceItems.flatMap((c) => c.tags))),
    [workspaceItems],
  );

  const filtered = useMemo(
    () =>
      workspaceItems.filter((c) => {
        if (queue !== "todas" && c.status !== queue) return false;
        if (filterCategory !== "todas" && c.category !== filterCategory) return false;
        if (filterAgent !== "todos" && c.assignedAgentId !== filterAgent) return false;
        if (filterTag !== "todos" && !c.tags.includes(filterTag)) return false;
        if (
          search &&
          !`${c.customerName} ${c.phone} ${c.lastMessage}`.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [workspaceItems, queue, filterCategory, filterAgent, filterTag, search],
  );

  useEffect(() => {
    setSelectedId(filtered[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId, queue, filterCategory, filterAgent, filterTag, search]);

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

  const counts = useMemo(() => {
    const out: Record<string, number> = { todas: workspaceItems.length };
    queues.slice(1).forEach((q) => {
      out[q.value] = workspaceItems.filter((c) => c.status === q.value).length;
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
        status: selected.status === "sin responder" || selected.status === "urgente" ? "en seguimiento" : selected.status,
        slaMinutesRemaining: Math.max(selected.slaMinutesRemaining, 30),
        updatedAt: now.toISOString(),
      },
      { id: `ev-${Date.now()}`, type: "ai", label: `Respuesta enviada por ${selectedAgent?.name ?? "Agente"}`, when: `Hoy ${stamp}` },
    );
    setReply("");
    setToast("Respuesta enviada al cliente.");
  };

  const useSuggested = () => selected && setReply(selected.suggestedReply);

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

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
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
          <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <option value="todos" className="bg-[#0b1023]">Todos los agentes</option>
            {workspaceAgents.map((a) => (
              <option key={a.id} value={a.id} className="bg-[#0b1023]">{a.name}</option>
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
                      <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-0.5 text-cyan-100">Score {c.leadScore}</span>
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
                  <span className="rounded-full border border-cyan-300/40 bg-cyan-500/10 px-2 py-1 text-cyan-100"><Flame className="mr-1 inline h-3.5 w-3.5" />Score {selected.leadScore}</span>
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
                      placeholder="Escribí tu respuesta…"
                      className="min-h-16 flex-1 rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm"
                    />
                    <Button onClick={sendReply} className="bg-emerald-500/30 hover:bg-emerald-500/40">
                      <Send className="mr-1 h-4 w-4" />Enviar
                    </Button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                    <Button onClick={() => changeStatus("en seguimiento")}><MessageSquarePlus className="mr-1 h-4 w-4" />Seguimiento</Button>
                    <Button onClick={() => changeStatus("pendiente")}><Clock3 className="mr-1 h-4 w-4" />Pendiente</Button>
                    <Button onClick={() => changeStatus("ganada")} className="border-emerald-300/40 bg-emerald-500/20 hover:bg-emerald-500/30"><CheckCircle2 className="mr-1 h-4 w-4" />Marcar ganada</Button>
                    <Button onClick={() => changeStatus("perdida")} className="border-rose-300/40 bg-rose-500/20 hover:bg-rose-500/30"><XCircle className="mr-1 h-4 w-4" />Marcar perdida</Button>
                    <Button onClick={() => setToast(`Follow-up agendado: ${selected.nextTask}`)}><Sparkles className="mr-1 h-4 w-4" />Agendar follow-up</Button>
                    <Button onClick={() => setToast("Conversación cerrada.")}>Cerrar</Button>
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
                    {selected.estimatedOpportunity ? (
                      <p className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100">Oportunidad: {selected.estimatedOpportunity}</p>
                    ) : null}
                  </Card>

                  <Card className="p-3">
                    <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400"><UserPlus className="h-3.5 w-3.5" /> Asignación</p>
                    <select value={selected.assignedAgentId ?? ""} onChange={(e) => assignAgent(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm">
                      <option value="" className="bg-[#0b1023]">Sin asignar</option>
                      {workspaceAgents.map((a) => (
                        <option key={a.id} value={a.id} className="bg-[#0b1023]">{a.name} · {a.role}</option>
                      ))}
                    </select>
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

                  <Card className="p-3">
                    <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-400"><StickyNote className="h-3.5 w-3.5" /> Notas internas</p>
                    <p className="mt-2 whitespace-pre-line rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-zinc-200">{selected.internalNotes || "Sin notas todavía."}</p>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Agregá una nota…" className="mt-2 min-h-14 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-xs" />
                    <Button onClick={saveNote} className="mt-2 w-full text-xs">Guardar nota</Button>
                  </Card>
                </div>
              </div>
            </Card>

            <div className="grid gap-3 md:grid-cols-2">
              <Card className="p-4">
                <p className="text-sm font-semibold inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-300" /> Próxima tarea</p>
                <p className="mt-1 text-sm text-zinc-200">{selected.nextTask}</p>
                <p className="mt-2 text-xs text-zinc-400">Recomendación AI: priorizá esta conversación, score {selected.leadScore} y {formatSla(selected.slaMinutesRemaining).text.toLowerCase()}.</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm font-semibold inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-cyan-300" /> Timeline de actividad</p>
                <div className="mt-2 space-y-2 text-xs text-zinc-300">
                  {selected.activity.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
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
          </div>
        ) : (
          <Card className="p-8 text-center text-sm text-zinc-400">Seleccioná una conversación para ver el detalle.</Card>
        )}
      </div>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
