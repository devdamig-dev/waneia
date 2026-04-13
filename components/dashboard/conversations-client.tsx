"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bot, CalendarClock, Sparkles, WandSparkles } from "lucide-react";
import { conversations } from "@/data/mock-data";
import { CategoryBadge } from "@/components/dashboard/category-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConversationCategory } from "@/types/entities";
import { Toast } from "@/components/ui/toast";

const filters: Array<{ label: string; value: "all" | ConversationCategory }> = [
  { label: "Todas", value: "all" },
  { label: "Presupuestos", value: "presupuesto" },
  { label: "Pedidos", value: "pedido" },
  { label: "Consultas", value: "consulta" },
  { label: "Soporte humano", value: "soporte humano" },
];

const initialNotesByConversation = Object.fromEntries(conversations.map((c) => [c.id, c.internalNotes]));
const initialScoreByConversation = Object.fromEntries(conversations.map((c, i) => [c.id, 55 + (i % 5) * 9]));

export function ConversationsClient() {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [selectedId, setSelectedId] = useState(conversations[0]?.id ?? "");
  const [notesByConversation, setNotesByConversation] = useState<Record<string, string>>(initialNotesByConversation);
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => conversations.filter((c) => (activeFilter === "all" ? true : c.category === activeFilter)), [activeFilter]);
  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0];

  const urgencyByStatus: Record<string, "alta" | "media" | "baja"> = {
    nuevo: "alta",
    "esperando respuesta": "alta",
    "en seguimiento": "media",
    cerrado: "baja",
  };

  const suggestNextAction = (category: ConversationCategory) => {
    if (category === "presupuesto") return "Enviar propuesta en menos de 15 minutos";
    if (category === "pedido") return "Confirmar estado y estimar entrega";
    if (category === "soporte humano") return "Asignar asesor senior por SLA";
    return "Responder FAQ y ofrecer siguiente paso comercial";
  };

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
              const score = initialScoreByConversation[conversation.id];
              const urgency = urgencyByStatus[conversation.status];
              return (
                <button key={conversation.id} onClick={() => setSelectedId(conversation.id)} className={`w-full rounded-xl border p-4 text-left transition ${selected?.id === conversation.id ? "border-emerald-300/40 bg-emerald-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{conversation.customerName}</p>
                      <p className="text-xs text-zinc-400">{conversation.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">{new Date(conversation.updatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</p>
                      <p className={`mt-1 text-[11px] ${urgency === "alta" ? "text-rose-200" : urgency === "media" ? "text-amber-200" : "text-zinc-400"}`}>Prioridad {urgency}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{conversation.lastMessage}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <CategoryBadge category={conversation.category} />
                    <StatusBadge status={conversation.status} />
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-100">Lead score {score}</span>
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
                <p className="text-sm text-zinc-400">{selected.businessName} · {selected.phone}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <CategoryBadge category={selected.category} />
                <StatusBadge status={selected.status} />
                <span className="rounded-full border border-rose-300/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-100">Urgencia {urgencyByStatus[selected.status]}</span>
              </div>
            </div>

            <div className="mb-3 rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
              <p className="inline-flex items-center gap-2 font-medium"><Bot className="h-4 w-4" /> WANEIA sugiere</p>
              <p className="mt-1">Siguiente paso recomendado: {suggestNextAction(selected.category)}</p>
              <p className="mt-1 text-xs">Motivo de clasificación: coincidencia semántica con categoría “{selected.category}”.</p>
            </div>

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
                <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Notas internas mejoradas</p>
                <textarea value={notesByConversation[selected.id] ?? ""} onChange={(event) => setNotesByConversation((previous) => ({ ...previous, [selected.id]: event.target.value }))} className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-200" />
              </Card>
              <Card className="p-3">
                <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Timeline de actividad</p>
                <div className="space-y-2 text-xs text-zinc-300">
                  <p className="inline-flex items-center gap-2"><CalendarClock className="h-3.5 w-3.5" /> Mensaje recibido y clasificado automáticamente.</p>
                  <p className="inline-flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Se estimó oportunidad comercial y prioridad.</p>
                  <p className="inline-flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" /> Pendiente de respuesta humana según SLA.</p>
                </div>
              </Card>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <Button onClick={() => setToast("Plantilla de respuesta aplicada.")}>Responder</Button>
              <Button onClick={() => setToast("Conversación derivada a equipo humano.")}>Derivar</Button>
              <Button onClick={() => setToast("Marcada en seguimiento comercial.")}>Marcar seguimiento</Button>
              <Button onClick={() => setToast("Marcada como venta potencial.")}>Marcar como venta</Button>
              <Button onClick={() => setToast("Conversación cerrada con éxito.")}>Cerrar</Button>
              <Button onClick={() => setToast("Etiqueta aplicada automáticamente por IA.")}>Etiquetar</Button>
            </div>

            <Card className="mt-4 p-3">
              <p className="text-sm font-semibold inline-flex items-center gap-2"><WandSparkles className="h-4 w-4 text-emerald-300" /> AI recommendation panel</p>
              <p className="mt-2 text-sm text-zinc-300">Clasificación automática detectada con confianza del {70 + (initialScoreByConversation[selected.id] % 25)}%. Recomendación: responder con propuesta personalizada y CTA de cierre.</p>
            </Card>
          </Card>
        ) : null}
      </div>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
