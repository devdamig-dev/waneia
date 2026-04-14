"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Clock3, Flame, Sparkles, UserPlus, WandSparkles } from "lucide-react";
import { conversations } from "@/data/mock-data";
import { CategoryBadge } from "@/components/dashboard/category-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConversationCategory, ConversationStatus } from "@/types/entities";
import { Toast } from "@/components/ui/toast";
import { useWorkspace } from "@/components/dashboard/workspace-context";

type PipelineStatus = "new" | "in progress" | "pending" | "won" | "lost" | "closed";

const filters: Array<{ label: string; value: "all" | ConversationCategory }> = [
  { label: "Todas", value: "all" },
  { label: "Presupuestos", value: "presupuesto" },
  { label: "Pedidos", value: "pedido" },
  { label: "Consultas", value: "consulta" },
  { label: "Soporte humano", value: "soporte humano" },
];

const intentByCategory: Record<ConversationCategory, string> = {
  presupuesto: "Intención comercial alta",
  pedido: "Seguimiento post-venta",
  consulta: "Exploración de producto",
  "soporte humano": "Escalamiento asistido",
};

const operators = ["Lucía", "Nicolás", "Camila", "Equipo comercial"];

export function ConversationsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [selectedId, setSelectedId] = useState("");
  const [pipelineByConversation, setPipelineByConversation] = useState<Record<string, PipelineStatus>>({});
  const [operatorByConversation, setOperatorByConversation] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");

  const workspaceConversations = useMemo(() => conversations.filter((c) => c.workspaceId === activeWorkspaceId), [activeWorkspaceId]);
  const filtered = useMemo(() => workspaceConversations.filter((c) => (activeFilter === "all" ? true : c.category === activeFilter)), [activeFilter, workspaceConversations]);
  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0];

  useEffect(() => {
    setSelectedId(workspaceConversations[0]?.id ?? "");
    setPipelineByConversation(
      Object.fromEntries(
        workspaceConversations.map((conversation, index) => [
          conversation.id,
          (index % 6 === 0 ? "new" : index % 6 === 1 ? "in progress" : index % 6 === 2 ? "pending" : index % 6 === 3 ? "won" : index % 6 === 4 ? "lost" : "closed") as PipelineStatus,
        ]),
      ),
    );
    setOperatorByConversation(Object.fromEntries(workspaceConversations.map((conversation, index) => [conversation.id, operators[index % operators.length]])));
  }, [activeWorkspaceId, workspaceConversations]);

  const urgencyByStatus: Record<ConversationStatus, "alta" | "media" | "baja"> = {
    nuevo: "alta",
    "esperando respuesta": "alta",
    "en seguimiento": "media",
    cerrado: "baja",
    "in progress": "media",
    pending: "alta",
    won: "baja",
    lost: "baja",
    new: "alta",
    closed: "baja",
  };

  const suggestedActionByCategory: Record<ConversationCategory, string> = {
    presupuesto: "Enviar cotización y CTA de cierre en menos de 10 minutos.",
    pedido: "Confirmar ETA y reforzar postventa para evitar churn.",
    consulta: "Aplicar secuencia de calificación y descubrir necesidad real.",
    "soporte humano": "Derivar inmediato a operador senior y mantener SLA.",
  };

  const leadScore = (id: string) => 65 + (id.charCodeAt(id.length - 1) % 30);
  const timerLabel = (id: string) => `${2 + (id.charCodeAt(0) % 5)}m ${10 + (id.charCodeAt(1) % 40)}s`;

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card className="p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button key={filter.label} onClick={() => setActiveFilter(filter.value)} className={`rounded-full px-3 py-1.5 text-sm transition ${activeFilter === filter.value ? "bg-emerald-400/20 text-emerald-100" : "bg-white/5 text-zinc-300 hover:bg-white/10"}`}>{filter.label}</button>
            ))}
          </div>

          <div className="space-y-2">
            {filtered.map((conversation) => {
              const urgency = urgencyByStatus[conversation.status as ConversationStatus];
              const pipeline = pipelineByConversation[conversation.id] ?? "new";
              return (
                <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className={`w-full rounded-xl border p-4 text-left transition hover:-translate-y-0.5 ${selected?.id === conversation.id ? "border-emerald-300/40 bg-emerald-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{conversation.customerName}</p>
                      <p className="text-xs text-zinc-400">{conversation.phone} · Asignado a {operatorByConversation[conversation.id]}</p>
                    </div>
                    <p className="text-xs text-zinc-400">SLA {timerLabel(conversation.id)}</p>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{conversation.lastMessage}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <CategoryBadge category={conversation.category} />
                    <StatusBadge status={conversation.status} />
                    <span className="rounded-full border border-violet-300/30 bg-violet-500/10 px-2 py-1 text-violet-100">Pipeline: {pipeline}</span>
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-cyan-100">Lead score {leadScore(conversation.id)}</span>
                    <span className={`rounded-full border px-2 py-1 ${urgency === "alta" ? "border-rose-300/40 bg-rose-500/10 text-rose-100" : urgency === "media" ? "border-amber-300/40 bg-amber-500/10 text-amber-100" : "border-zinc-300/30 bg-zinc-500/10 text-zinc-200"}`}>Urgencia {urgency}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {selected ? (
          <Card className="p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{selected.customerName}</h3>
                <p className="text-sm text-zinc-400">Intent detectado: {intentByCategory[selected.category]} · Operador: {operatorByConversation[selected.id]}</p>
              </div>
              <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100">SLA activo: {timerLabel(selected.id)}</span>
            </div>

            <Card className="mb-3 border-cyan-300/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
              <p className="inline-flex items-center gap-2 font-medium"><Bot className="h-4 w-4" /> Siguiente acción sugerida</p>
              <p className="mt-1">{suggestedActionByCategory[selected.category]}</p>
            </Card>

            <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
              {selected.messages.map((message) => (
                <div key={message.id} className={`max-w-[85%] rounded-xl p-3 text-sm ${message.sender === "customer" ? "bg-white/10" : message.sender === "system" ? "ml-auto bg-cyan-500/20" : "ml-auto bg-emerald-500/20"}`}>
                  <p>{message.content}</p>
                  <p className="mt-1 text-xs text-zinc-400">{message.timestamp}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <Card className="p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Pipeline comercial</p>
                <select value={pipelineByConversation[selected.id] ?? "new"} onChange={(event) => setPipelineByConversation((prev) => ({ ...prev, [selected.id]: event.target.value as PipelineStatus }))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm">
                  <option value="new" className="bg-[#0b1023]">new</option>
                  <option value="in progress" className="bg-[#0b1023]">in progress</option>
                  <option value="pending" className="bg-[#0b1023]">pending</option>
                  <option value="won" className="bg-[#0b1023]">won</option>
                  <option value="lost" className="bg-[#0b1023]">lost</option>
                  <option value="closed" className="bg-[#0b1023]">closed</option>
                </select>
              </Card>
              <Card className="p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Asignación de operador</p>
                <div className="mt-2 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-zinc-400" />
                  <select value={operatorByConversation[selected.id] ?? operators[0]} onChange={(event) => setOperatorByConversation((prev) => ({ ...prev, [selected.id]: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm">
                    {operators.map((operator) => <option key={operator} value={operator} className="bg-[#0b1023]">{operator}</option>)}
                  </select>
                </div>
              </Card>
            </div>

            <Card className="mt-3 p-3">
              <p className="text-sm font-semibold inline-flex items-center gap-2"><WandSparkles className="h-4 w-4 text-emerald-300" /> AI recommendation panel</p>
              <p className="mt-2 text-sm text-zinc-300">Probabilidad de cierre estimada: {leadScore(selected.id)}%. Riesgo SLA: {urgencyByStatus[selected.status as ConversationStatus] === "alta" ? "alto" : "moderado"}. Recomendación: seguimiento humano + plantilla contextual.</p>
            </Card>

            <Card className="mt-3 p-3">
              <p className="text-sm font-semibold">Timeline de actividad</p>
              <div className="mt-2 space-y-2 text-xs text-zinc-300">
                <p className="inline-flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /> Mensaje clasificado automáticamente por intención.</p>
                <p className="inline-flex items-center gap-2"><Flame className="h-3.5 w-3.5" /> Lead score actualizado por engagement reciente.</p>
                <p className="inline-flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Recomendación IA publicada en panel comercial.</p>
              </div>
            </Card>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <Button onClick={() => setToast("Respuesta enviada con plantilla inteligente.")}>Responder</Button>
              <Button onClick={() => setToast("Conversación asignada a operador.")}>Asignar</Button>
              <Button onClick={() => setToast("Follow up agendado para 30 minutos.")}>Follow up</Button>
              <Button onClick={() => setToast("Conversación marcada como won.")}>Marcar won</Button>
              <Button onClick={() => setToast("Conversación cerrada y archivada.")}>Cerrar</Button>
              <Button onClick={() => setToast("Lead enviado a pipeline de propuesta.")}>Mover pipeline</Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center text-sm text-zinc-400">No hay conversaciones para este filtro.</Card>
        )}
      </div>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
