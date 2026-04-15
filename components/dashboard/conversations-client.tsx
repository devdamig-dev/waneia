"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bot, CalendarClock, CheckCircle2, Clock3, Sparkles, UserPlus, WandSparkles } from "lucide-react";
import { conversations } from "@/data/mock-data";
import { CategoryBadge } from "@/components/dashboard/category-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConversationCategory } from "@/types/entities";
import { Toast } from "@/components/ui/toast";
import { useWorkspace } from "@/components/dashboard/workspace-context";

type PipelineStatus = "new" | "in progress" | "pending" | "won" | "lost" | "closed";
type Priority = "alta" | "media" | "baja";
type Intent = "venta" | "soporte" | "seguimiento" | "consultivo";

const operators = ["Lucía", "Nicolás", "Camila", "Equipo comercial"];
const pipelineStages: PipelineStatus[] = ["new", "in progress", "pending", "won", "lost", "closed"];

const sectionLabels = {
  urgent: "Urgentes",
  today: "Hoy",
  pending: "Pendientes",
  won: "Ganadas",
  lost: "Perdidas",
} as const;

const mapPriorityToClass: Record<Priority, string> = {
  alta: "border-rose-300/40 bg-rose-500/10 text-rose-100",
  media: "border-amber-300/40 bg-amber-500/10 text-amber-100",
  baja: "border-zinc-300/40 bg-zinc-500/10 text-zinc-200",
};

export function ConversationsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const [selectedId, setSelectedId] = useState("");
  const [operatorFilter, setOperatorFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState<"todas" | Priority>("todas");
  const [pipelineFilter, setPipelineFilter] = useState<"todos" | PipelineStatus>("todos");
  const [intentFilter, setIntentFilter] = useState<"todos" | Intent>("todos");
  const [toast, setToast] = useState("");
  const [pipelineByConversation, setPipelineByConversation] = useState<Record<string, PipelineStatus>>({});
  const [operatorByConversation, setOperatorByConversation] = useState<Record<string, string>>({});

  const workspaceConversations = useMemo(() => conversations.filter((c) => c.workspaceId === activeWorkspaceId), [activeWorkspaceId]);

  const getPriority = (id: string): Priority => {
    const n = id.charCodeAt(id.length - 1) % 3;
    return n === 0 ? "alta" : n === 1 ? "media" : "baja";
  };
  const getIntent = (category: ConversationCategory): Intent => {
    if (category === "presupuesto") return "venta";
    if (category === "pedido") return "seguimiento";
    if (category === "soporte humano") return "soporte";
    return "consultivo";
  };
  const leadScore = (id: string) => 68 + (id.charCodeAt(id.length - 1) % 28);
  const sla = (id: string) => `${1 + (id.charCodeAt(0) % 6)}h ${5 + (id.charCodeAt(1) % 35)}m`;
  const nextTask = (category: ConversationCategory) => {
    if (category === "presupuesto") return { text: "Enviar propuesta con CTA", due: "en 25m" };
    if (category === "pedido") return { text: "Confirmar ETA", due: "en 40m" };
    if (category === "soporte humano") return { text: "Derivar a asesor senior", due: "en 10m" };
    return { text: "Calificar necesidad", due: "en 1h" };
  };

  useEffect(() => {
    setSelectedId(workspaceConversations[0]?.id ?? "");
    setOperatorByConversation(Object.fromEntries(workspaceConversations.map((c, i) => [c.id, operators[i % operators.length]])));
    setPipelineByConversation(Object.fromEntries(workspaceConversations.map((c, i) => [c.id, pipelineStages[i % pipelineStages.length]])));
  }, [workspaceConversations]);

  const filtered = useMemo(() => {
    return workspaceConversations.filter((conversation) => {
      const pipeline = pipelineByConversation[conversation.id] ?? "new";
      const priority = getPriority(conversation.id);
      const intent = getIntent(conversation.category);
      const operator = operatorByConversation[conversation.id] ?? operators[0];
      return (
        (operatorFilter === "todos" || operator === operatorFilter) &&
        (priorityFilter === "todas" || priority === priorityFilter) &&
        (pipelineFilter === "todos" || pipeline === pipelineFilter) &&
        (intentFilter === "todos" || intent === intentFilter)
      );
    });
  }, [workspaceConversations, operatorFilter, priorityFilter, pipelineFilter, intentFilter, pipelineByConversation, operatorByConversation]);

  const grouped = useMemo(() => {
    const by = {
      urgent: filtered.filter((c) => getPriority(c.id) === "alta" && (pipelineByConversation[c.id] ?? "new") !== "won" && (pipelineByConversation[c.id] ?? "new") !== "lost"),
      today: filtered.filter((c) => (pipelineByConversation[c.id] ?? "new") === "in progress" || (pipelineByConversation[c.id] ?? "new") === "new"),
      pending: filtered.filter((c) => (pipelineByConversation[c.id] ?? "new") === "pending"),
      won: filtered.filter((c) => (pipelineByConversation[c.id] ?? "new") === "won"),
      lost: filtered.filter((c) => (pipelineByConversation[c.id] ?? "new") === "lost"),
    };
    return by;
  }, [filtered, pipelineByConversation]);

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0];

  const timeline = selected
    ? [
        { at: "09:12", text: "Ingreso de conversación por WhatsApp" },
        { at: "09:13", text: `Intención detectada: ${getIntent(selected.category)}` },
        { at: "09:16", text: `Asignado a ${operatorByConversation[selected.id] ?? operators[0]}` },
        { at: "09:20", text: "AI recomendó siguiente paso de cierre" },
      ]
    : [];

  return (
    <>
      <div className="space-y-4">
        <Card className="p-4">
          <div className="grid gap-2 md:grid-cols-4">
            <select value={operatorFilter} onChange={(e) => setOperatorFilter(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-sm"><option value="todos" className="bg-[#0b1023]">Operador: todos</option>{operators.map((o) => <option key={o} value={o} className="bg-[#0b1023]">{o}</option>)}</select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as "todas" | Priority)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-sm"><option value="todas" className="bg-[#0b1023]">Prioridad: todas</option><option value="alta" className="bg-[#0b1023]">alta</option><option value="media" className="bg-[#0b1023]">media</option><option value="baja" className="bg-[#0b1023]">baja</option></select>
            <select value={pipelineFilter} onChange={(e) => setPipelineFilter(e.target.value as "todos" | PipelineStatus)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-sm"><option value="todos" className="bg-[#0b1023]">Pipeline: todos</option>{pipelineStages.map((p) => <option key={p} value={p} className="bg-[#0b1023]">{p}</option>)}</select>
            <select value={intentFilter} onChange={(e) => setIntentFilter(e.target.value as "todos" | Intent)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-sm"><option value="todos" className="bg-[#0b1023]">Intent: todos</option><option value="venta" className="bg-[#0b1023]">venta</option><option value="soporte" className="bg-[#0b1023]">soporte</option><option value="seguimiento" className="bg-[#0b1023]">seguimiento</option><option value="consultivo" className="bg-[#0b1023]">consultivo</option></select>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            {(Object.keys(grouped) as Array<keyof typeof grouped>).map((key) => (
              <Card key={key} className="p-4">
                <div className="mb-3 flex items-center justify-between"><h4 className="font-semibold">{sectionLabels[key]}</h4><span className="text-xs text-zinc-400">{grouped[key].length}</span></div>
                <div className="space-y-2">
                  {grouped[key].length === 0 ? <div className="rounded-xl border border-dashed border-white/10 p-3 text-xs text-zinc-500">No hay conversaciones en esta cola.</div> : grouped[key].map((conversation) => {
                    const task = nextTask(conversation.category);
                    const overdue = getPriority(conversation.id) === "alta" && (pipelineByConversation[conversation.id] ?? "new") !== "won";
                    return (
                      <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className={`w-full rounded-xl border p-3 text-left transition ${selected?.id === conversation.id ? "border-emerald-300/40 bg-emerald-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{conversation.customerName}</p>
                            <p className="text-xs text-zinc-400">{operatorByConversation[conversation.id]} · Intent {getIntent(conversation.category)}</p>
                          </div>
                          <span className={`rounded-full border px-2 py-1 text-[11px] ${mapPriorityToClass[getPriority(conversation.id)]}`}>{getPriority(conversation.id)}</span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-300">{conversation.lastMessage}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-cyan-100">Lead score {leadScore(conversation.id)}</span>
                          <span className={`rounded-full border px-2 py-1 ${overdue ? "border-rose-300/40 bg-rose-500/10 text-rose-100" : "border-zinc-300/30 bg-zinc-500/10 text-zinc-200"}`}>SLA {overdue ? "overdue" : sla(conversation.id)}</span>
                          <span className="rounded-full border border-violet-300/30 bg-violet-500/10 px-2 py-1 text-violet-100">Next: {task.text} ({task.due})</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          {selected ? (
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">{selected.customerName}</h3>
                  <p className="text-sm text-zinc-400">{selected.phone} · Owner: {operatorByConversation[selected.id]}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="rounded-full border border-white/10 bg-white/5 px-2 py-1">Pipeline {pipelineByConversation[selected.id] ?? "new"}</p>
                  <p className="mt-1 text-zinc-400">SLA {sla(selected.id)}</p>
                </div>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <CategoryBadge category={selected.category} />
                <StatusBadge status={selected.status} />
              </div>

              <Card className="mt-3 border-cyan-300/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                <p className="font-medium inline-flex items-center gap-2"><WandSparkles className="h-4 w-4" /> AI recommendation box</p>
                <p className="mt-1">Priorizá esta conversación en la próxima ventana de 15 minutos. Siguiente mejor acción: <strong>{nextTask(selected.category).text}</strong>. Riesgo de abandono: {getPriority(selected.id) === "alta" ? "alto" : "moderado"}.</p>
              </Card>

              <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
                {selected.messages.map((message) => (
                  <div key={message.id} className={`max-w-[85%] rounded-xl p-3 text-sm ${message.sender === "customer" ? "bg-white/10" : message.sender === "system" ? "ml-auto bg-cyan-500/20" : "ml-auto bg-emerald-500/20"}`}>
                    <p>{message.content}</p>
                    <p className="mt-1 text-xs text-zinc-400">{message.timestamp}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <Card className="p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Asignación</p>
                  <div className="mt-2 flex items-center gap-2"><UserPlus className="h-4 w-4 text-zinc-400" /><select value={operatorByConversation[selected.id] ?? operators[0]} onChange={(event) => setOperatorByConversation((prev) => ({ ...prev, [selected.id]: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm">{operators.map((operator) => <option key={operator} value={operator} className="bg-[#0b1023]">{operator}</option>)}</select></div>
                </Card>
                <Card className="p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Pipeline</p>
                  <select value={pipelineByConversation[selected.id] ?? "new"} onChange={(event) => setPipelineByConversation((prev) => ({ ...prev, [selected.id]: event.target.value as PipelineStatus }))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm">{pipelineStages.map((p) => <option key={p} value={p} className="bg-[#0b1023]">{p}</option>)}</select>
                </Card>
              </div>

              <Card className="mt-3 p-3">
                <p className="text-sm font-semibold">Timeline de actividad</p>
                <div className="mt-2 space-y-2 text-xs text-zinc-300">{timeline.map((entry) => <div key={entry.at + entry.text} className="rounded-lg border border-white/10 bg-white/5 p-2"><p className="text-zinc-100">{entry.text}</p><p className="text-zinc-500">{entry.at}</p></div>)}</div>
              </Card>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <Button onClick={() => setToast("Respuesta enviada.")}>Responder</Button>
                <Button onClick={() => setToast("Conversación asignada.")}>Asignar</Button>
                <Button onClick={() => setToast("Seguimiento programado.")}>Follow up</Button>
                <Button onClick={() => setToast("Marcada como ganada.")}>Marcar won</Button>
                <Button onClick={() => setToast("Conversación cerrada.")}>Cerrar</Button>
                <Button onClick={() => setToast("Siguiente tarea agendada.")}>Crear tarea</Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center text-sm text-zinc-400">No hay conversaciones para esta combinación de filtros.</Card>
          )}
        </div>
      </div>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
