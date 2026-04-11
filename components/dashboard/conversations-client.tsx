"use client";

import { useMemo, useState } from "react";
import { conversations } from "@/data/mock-data";
import { CategoryBadge } from "@/components/dashboard/category-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConversationCategory } from "@/types/entities";

const filters: Array<{ label: string; value: "all" | ConversationCategory }> = [
  { label: "Todas", value: "all" },
  { label: "Presupuestos", value: "presupuesto" },
  { label: "Pedidos", value: "pedido" },
  { label: "Consultas", value: "consulta" },
  { label: "Soporte humano", value: "soporte humano" },
];

export function ConversationsClient() {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [selectedId, setSelectedId] = useState(conversations[0]?.id ?? "");

  const filtered = useMemo(
    () => conversations.filter((c) => (activeFilter === "all" ? true : c.category === activeFilter)),
    [activeFilter],
  );

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
      <Card className="p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(filter.value)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                activeFilter === filter.value ? "bg-emerald-400/20 text-emerald-100" : "bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {filtered.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedId(conversation.id)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                selected?.id === conversation.id
                  ? "border-emerald-300/40 bg-emerald-400/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{conversation.customerName}</p>
                  <p className="text-xs text-zinc-400">{conversation.phone}</p>
                </div>
                <p className="text-xs text-zinc-500">{new Date(conversation.updatedAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{conversation.lastMessage}</p>
              <div className="mt-3 flex gap-2">
                <CategoryBadge category={conversation.category} />
                <StatusBadge status={conversation.status} />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {selected ? (
        <Card className="p-5">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">{selected.customerName}</h3>
              <p className="text-sm text-zinc-400">{selected.businessName} · {selected.phone}</p>
            </div>
            <div className="flex gap-2">
              <CategoryBadge category={selected.category} />
              <StatusBadge status={selected.status} />
            </div>
          </div>
          {selected.estimatedOpportunity && (
            <p className="mb-4 rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
              Oportunidad estimada: {selected.estimatedOpportunity}
            </p>
          )}
          <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
            {selected.messages.map((message) => (
              <div key={message.id} className={`max-w-[85%] rounded-xl p-3 text-sm ${message.sender === "customer" ? "bg-white/10" : message.sender === "system" ? "bg-cyan-500/20 ml-auto" : "ml-auto bg-emerald-500/20"}`}>
                <p>{message.content}</p>
                <p className="mt-1 text-xs text-zinc-400">{message.timestamp}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Notas internas</p>
            <textarea defaultValue={selected.internalNotes} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-200" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button>Marcar en seguimiento</Button>
            <Button>Cerrar conversación</Button>
            <Button>Derivar a humano</Button>
            <Button>Etiquetar</Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
