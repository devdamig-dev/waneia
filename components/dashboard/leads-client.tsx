"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronLeft, ChevronRight, ExternalLink, GitBranch, MessageCircleMore, Plus, Tag as TagIcon, X } from "lucide-react";
import { conversations as seedConversations, contacts as seedContacts, leads as seedLeads } from "@/data/mock-data";
import { teamMembers } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { usePipelines } from "@/lib/workspace-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Toast } from "@/components/ui/toast";
import { CategoryBadge } from "@/components/dashboard/category-badge";
import { ConversationCategory, Lead } from "@/types/entities";
import { PipelineStageConfig } from "@/types/config";

const stageBorderClass: Record<string, string> = {
  cyan: "border-cyan-300/40",
  sky: "border-sky-300/40",
  violet: "border-violet-300/40",
  amber: "border-amber-300/40",
  emerald: "border-emerald-300/40",
  rose: "border-rose-300/40",
  zinc: "border-zinc-300/40",
};

function slugifyStage(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export function LeadsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const { pipelines, defaultPipelineId } = usePipelines();
  const [items, setItems] = useState<Lead[]>(seedLeads);
  const [agentFilter, setAgentFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState<ConversationCategory | "todas">("todas");
  const [search, setSearch] = useState("");
  const [activePipelineId, setActivePipelineId] = useState<string>(defaultPipelineId);
  const [selectedId, setSelectedId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    phone: "",
    business: "",
    source: "WhatsApp",
    category: "presupuesto" as ConversationCategory,
    estimatedValue: 0,
    stageKey: "nuevo",
    notes: "",
  });

  useEffect(() => {
    if (!pipelines.find((p) => p.id === activePipelineId)) {
      setActivePipelineId(defaultPipelineId || pipelines[0]?.id || "");
    }
  }, [pipelines, defaultPipelineId, activePipelineId]);

  const activePipeline = pipelines.find((p) => p.id === activePipelineId) ?? pipelines[0];
  const sortedStages: PipelineStageConfig[] = useMemo(
    () => (activePipeline ? [...activePipeline.stages].sort((a, b) => a.order - b.order) : []),
    [activePipeline],
  );

  // The stage on the lead is a slug. Match against pipeline stages by their slugified name.
  const matchStage = (leadStageKey: string) =>
    sortedStages.find((s) => slugifyStage(s.name) === leadStageKey);

  const workspaceAgents = useMemo(
    () => teamMembers.filter((m) => m.workspaceId === activeWorkspaceId),
    [activeWorkspaceId],
  );

  const workspaceLeads = useMemo(
    () =>
      items.filter((l) => {
        if (l.workspaceId !== activeWorkspaceId) return false;
        if (agentFilter !== "todos" && l.assignedAgentId !== agentFilter) return false;
        if (categoryFilter !== "todas" && l.category !== categoryFilter) return false;
        if (search && !`${l.name} ${l.business} ${l.phone}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [items, activeWorkspaceId, agentFilter, categoryFilter, search],
  );

  const totalPipelineValue = useMemo(
    () =>
      workspaceLeads
        .filter((l) => {
          const stage = matchStage(l.stage);
          return !stage || stage.statusType === "abierto";
        })
        .reduce((acc, l) => acc + l.estimatedValue, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceLeads, sortedStages],
  );
  const wonValue = useMemo(
    () =>
      workspaceLeads
        .filter((l) => matchStage(l.stage)?.statusType === "ganado")
        .reduce((acc, l) => acc + l.estimatedValue, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceLeads, sortedStages],
  );
  const weightedValue = useMemo(
    () =>
      workspaceLeads.reduce((acc, l) => {
        const stage = matchStage(l.stage);
        if (!stage || stage.statusType !== "abierto") return acc;
        return acc + l.estimatedValue * (stage.probability / 100);
      }, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaceLeads, sortedStages],
  );

  const selected = items.find((l) => l.id === selectedId);

  const moveStage = (id: string, direction: -1 | 1) => {
    setItems((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const idx = sortedStages.findIndex((s) => slugifyStage(s.name) === l.stage);
        const safeIdx = idx === -1 ? 0 : idx;
        const target = sortedStages[Math.min(Math.max(safeIdx + direction, 0), sortedStages.length - 1)];
        if (!target) return l;
        return { ...l, stage: slugifyStage(target.name) as Lead["stage"] };
      }),
    );
  };

  const setStage = (id: string, stageKey: string) =>
    setItems((prev) => prev.map((l) => (l.id === id ? { ...l, stage: stageKey as Lead["stage"] } : l)));

  const createLead = () => {
    const created: Lead = {
      id: `l-${Date.now()}`,
      workspaceId: activeWorkspaceId,
      contactId: "ct-new",
      name: draft.name || "Lead sin nombre",
      phone: draft.phone || "—",
      source: draft.source,
      business: draft.business || "—",
      category: draft.category,
      stage: draft.stageKey as Lead["stage"],
      assignedAgentId: workspaceAgents[0]?.id ?? "",
      tags: [],
      estimatedValue: Number(draft.estimatedValue) || 0,
      nextFollowUp: "Hoy",
      lastInteraction: "Recién creado",
      notes: draft.notes,
    };
    setItems((prev) => [created, ...prev]);
    setOpen(false);
    setToast("Lead creado en el pipeline.");
    setDraft({ name: "", phone: "", business: "", source: "WhatsApp", category: "presupuesto", estimatedValue: 0, stageKey: sortedStages[0] ? slugifyStage(sortedStages[0].name) : "nuevo", notes: "" });
  };

  const wonStage = sortedStages.find((s) => s.statusType === "ganado");
  const lostStage = sortedStages.find((s) => s.statusType === "perdido");

  return (
    <>
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar lead, negocio, teléfono" className="min-w-56 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm" />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as ConversationCategory | "todas")} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <option value="todas" className="bg-[#0b1023]">Todas las categorías</option>
            <option value="presupuesto" className="bg-[#0b1023]">Presupuesto</option>
            <option value="pedido" className="bg-[#0b1023]">Pedido</option>
            <option value="consulta" className="bg-[#0b1023]">Consulta</option>
            <option value="soporte humano" className="bg-[#0b1023]">Soporte humano</option>
          </select>
          <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <option value="todos" className="bg-[#0b1023]">Todos los agentes</option>
            {workspaceAgents.map((a) => <option key={a.id} value={a.id} className="bg-[#0b1023]">{a.name}</option>)}
          </select>
          {pipelines.length > 1 ? (
            <select value={activePipelineId} onChange={(e) => setActivePipelineId(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm" aria-label="Pipeline">
              {pipelines.map((p) => <option key={p.id} value={p.id} className="bg-[#0b1023]">{p.name}</option>)}
            </select>
          ) : null}
          <Link href="/dashboard/configuracion/pipelines" className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10" title="Editar pipelines y etapas"><GitBranch className="h-3.5 w-3.5" />Configurar</Link>
          <Button onClick={() => setOpen(true)} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Plus className="mr-1 h-4 w-4" />Nuevo lead</Button>
        </div>
        {activePipeline ? <p className="mt-2 text-[11px] text-zinc-400">Pipeline activo: <span className="text-zinc-200">{activePipeline.name}</span> · {sortedStages.length} etapas configurables</p> : null}
      </Card>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Embudo en curso</p><p className="mt-1 text-2xl font-bold text-cyan-100">{formatCurrency(totalPipelineValue)}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Valor ponderado</p><p className="mt-1 text-2xl font-bold text-violet-100">{formatCurrency(weightedValue)}</p><p className="text-[10px] text-zinc-500">según probabilidad por etapa</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Cerrado este mes</p><p className="mt-1 text-2xl font-bold text-emerald-100">{formatCurrency(wonValue)}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Leads activos</p><p className="mt-1 text-2xl font-bold">{workspaceLeads.filter((l) => matchStage(l.stage)?.statusType === "abierto").length}</p></Card>
      </div>

      <div className="mt-4 grid gap-3 overflow-x-auto pb-2" style={{ gridTemplateColumns: `repeat(${Math.max(sortedStages.length, 1)}, minmax(220px, 1fr))` }}>
        {sortedStages.length === 0 ? (
          <Card className="p-6 text-center text-sm text-zinc-400">El pipeline activo no tiene etapas. Configurá uno desde <Link href="/dashboard/configuracion/pipelines" className="text-cyan-200 underline">/configuración/pipelines</Link>.</Card>
        ) : (
          sortedStages.map((stage) => {
            const stageKey = slugifyStage(stage.name);
            const stageLeads = workspaceLeads.filter((l) => l.stage === stageKey);
            const stageTotal = stageLeads.reduce((acc, l) => acc + l.estimatedValue, 0);
            const borderClass = stageBorderClass[stage.color] ?? stageBorderClass.cyan;
            return (
              <Card key={stage.id} className={`flex min-w-[220px] flex-col gap-2 border-t-2 p-3 ${borderClass}`}>
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{stage.name}</p>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">{stageLeads.length}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">{stage.statusType === "ganado" ? "Cierre exitoso" : stage.statusType === "perdido" ? "Oportunidad perdida" : `Probabilidad ${stage.probability}%`}</p>
                  <p className="mt-1 text-[11px] text-emerald-200">{formatCurrency(stageTotal)}</p>
                </div>
                <div className="space-y-2">
                  {stageLeads.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-white/10 bg-black/20 p-3 text-center text-[11px] text-zinc-500">Sin leads</p>
                  ) : (
                    stageLeads.map((lead) => {
                      const agent = workspaceAgents.find((a) => a.id === lead.assignedAgentId);
                      return (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedId(lead.id)}
                          className={`cursor-pointer rounded-xl border p-2.5 text-xs transition hover:bg-white/10 ${selected?.id === lead.id ? "border-cyan-300/40 bg-cyan-500/10" : "border-white/10 bg-white/5"}`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="font-semibold">{lead.name}</p>
                            <p className="text-emerald-200">{formatCurrency(lead.estimatedValue)}</p>
                          </div>
                          <p className="text-[10px] text-zinc-400">{lead.business} · {lead.source}</p>
                          <div className="mt-1.5 flex items-center justify-between gap-1">
                            <CategoryBadge category={lead.category} />
                            <span className="text-[10px] text-zinc-400">{agent?.name ?? "—"}</span>
                          </div>
                          <p className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-zinc-400"><CalendarClock className="h-3 w-3" />{lead.nextFollowUp}</p>
                          <div className="mt-2 flex justify-between gap-1">
                            <button onClick={(e) => { e.stopPropagation(); moveStage(lead.id, -1); }} className="flex-1 rounded-md border border-white/10 bg-white/5 py-0.5 text-[10px] hover:bg-white/10" aria-label="Etapa anterior"><ChevronLeft className="mx-auto h-3 w-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); moveStage(lead.id, 1); }} className="flex-1 rounded-md border border-white/10 bg-white/5 py-0.5 text-[10px] hover:bg-white/10" aria-label="Etapa siguiente"><ChevronRight className="mx-auto h-3 w-3" /></button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {selected ? (
        <Card className="mt-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">Detalle del lead</p>
              <h3 className="text-xl font-semibold">{selected.name}</h3>
              <p className="text-sm text-zinc-400">{selected.business} · {selected.phone}</p>
            </div>
            <button onClick={() => setSelectedId("")} className="rounded-lg border border-white/10 bg-white/5 p-1 text-xs" aria-label="Cerrar"><X className="h-3.5 w-3.5" /></button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Card className="p-3"><p className="text-xs text-zinc-400">Valor estimado</p><p className="mt-1 text-lg font-bold text-emerald-100">{formatCurrency(selected.estimatedValue)}</p></Card>
            <Card className="p-3"><p className="text-xs text-zinc-400">Categoría</p><p className="mt-1"><CategoryBadge category={selected.category} /></p></Card>
            <Card className="p-3"><p className="text-xs text-zinc-400">Origen</p><p className="mt-1 text-sm">{selected.source}</p></Card>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Card className="p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Etapa actual</p>
              <select value={selected.stage} onChange={(e) => setStage(selected.id, e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm">
                {sortedStages.map((s) => <option key={s.id} value={slugifyStage(s.name)} className="bg-[#0b1023]">{s.name}</option>)}
              </select>
              {matchStage(selected.stage) ? <p className="mt-1 text-[11px] text-zinc-400">Probabilidad: {matchStage(selected.stage)!.probability}% · SLA {matchStage(selected.stage)!.slaTargetMinutes} min</p> : null}
            </Card>
            <Card className="p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Asignado</p>
              <select value={selected.assignedAgentId} onChange={(e) => setItems((prev) => prev.map((l) => l.id === selected.id ? { ...l, assignedAgentId: e.target.value } : l))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm">
                {workspaceAgents.map((a) => <option key={a.id} value={a.id} className="bg-[#0b1023]">{a.name} · {a.role}</option>)}
              </select>
            </Card>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Card className="p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400 inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Próximo follow-up</p>
              <input value={selected.nextFollowUp} onChange={(e) => setItems((prev) => prev.map((l) => l.id === selected.id ? { ...l, nextFollowUp: e.target.value } : l))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm" />
            </Card>
            <Card className="p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400 inline-flex items-center gap-1"><TagIcon className="h-3.5 w-3.5" /> Etiquetas</p>
              <p className="mt-2 flex flex-wrap gap-1">
                {selected.tags.map((t) => <span key={t} className="rounded-full border border-violet-300/30 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-100">#{t}</span>)}
                {selected.tags.length === 0 ? <span className="text-xs text-zinc-500">Sin etiquetas</span> : null}
              </p>
            </Card>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {(() => {
              const linkedConv = seedConversations.find((c) => c.id === selected.conversationId || c.linkedLeadId === selected.id || (c.contactId === selected.contactId && c.workspaceId === selected.workspaceId));
              const linkedContact = seedContacts.find((c) => c.id === selected.contactId);
              return (
                <>
                  {linkedConv ? (
                    <Card className="p-3">
                      <p className="text-xs uppercase tracking-wide text-zinc-400 inline-flex items-center gap-1"><MessageCircleMore className="h-3.5 w-3.5" /> Conversación origen</p>
                      <p className="mt-2 text-sm font-medium">{linkedConv.customerName}</p>
                      <p className="line-clamp-2 text-[11px] text-zinc-400">{linkedConv.lastMessage}</p>
                      <p className="mt-1 text-[11px] text-zinc-400">Intent: {linkedConv.intent}</p>
                      <Link href={`/dashboard/conversaciones?id=${linkedConv.id}`} className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-200 hover:text-cyan-100">Abrir conversación <ExternalLink className="h-3 w-3" /></Link>
                    </Card>
                  ) : (
                    <Card className="p-3 text-xs text-zinc-400"><p>Este lead no tiene conversación de origen vinculada.</p></Card>
                  )}
                  {linkedContact ? (
                    <Card className="p-3">
                      <p className="text-xs uppercase tracking-wide text-zinc-400">Contacto</p>
                      <p className="mt-2 text-sm font-medium">{linkedContact.name}</p>
                      <p className="text-[11px] text-zinc-400">{linkedContact.business} · {linkedContact.lifecycle}</p>
                      <p className="text-[11px] text-zinc-400">Total conversaciones: {linkedContact.totalConversations}</p>
                      <Link href={`/dashboard/contactos?id=${linkedContact.id}`} className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-200 hover:text-cyan-100">Ver perfil <ExternalLink className="h-3 w-3" /></Link>
                    </Card>
                  ) : null}
                </>
              );
            })()}
          </div>

          <Card className="mt-3 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Notas</p>
            <textarea value={selected.notes} onChange={(e) => setItems((prev) => prev.map((l) => l.id === selected.id ? { ...l, notes: e.target.value } : l))} className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm" />
          </Card>

          <div className="mt-3 flex flex-wrap gap-2">
            {wonStage ? <Button onClick={() => { setStage(selected.id, slugifyStage(wonStage.name)); setToast(`${selected.name} marcado como ${wonStage.name}.`); }} className="bg-emerald-500/30 hover:bg-emerald-500/40">Marcar {wonStage.name.toLowerCase()}</Button> : null}
            {lostStage ? <Button onClick={() => { setStage(selected.id, slugifyStage(lostStage.name)); setToast(`${selected.name} marcado como ${lostStage.name}.`); }} className="bg-rose-500/30 hover:bg-rose-500/40">Marcar {lostStage.name.toLowerCase()}</Button> : null}
            <Button onClick={() => setToast("Cambios guardados.")}>Guardar cambios</Button>
          </div>
        </Card>
      ) : null}

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo lead">
        <div className="grid gap-3">
          <FormField label="Nombre"><input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          <FormField label="Teléfono"><input value={draft.phone} onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          <FormField label="Negocio"><input value={draft.business} onChange={(e) => setDraft((p) => ({ ...p, business: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Origen"><input value={draft.source} onChange={(e) => setDraft((p) => ({ ...p, source: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Valor estimado (AR$)"><input type="number" value={draft.estimatedValue} onChange={(e) => setDraft((p) => ({ ...p, estimatedValue: Number(e.target.value) }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Categoría"><select value={draft.category} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value as ConversationCategory }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5"><option value="presupuesto" className="bg-[#0b1023]">presupuesto</option><option value="pedido" className="bg-[#0b1023]">pedido</option><option value="consulta" className="bg-[#0b1023]">consulta</option><option value="soporte humano" className="bg-[#0b1023]">soporte humano</option></select></FormField>
            <FormField label="Etapa inicial"><select value={draft.stageKey} onChange={(e) => setDraft((p) => ({ ...p, stageKey: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">{sortedStages.map((s) => <option key={s.id} value={slugifyStage(s.name)} className="bg-[#0b1023]">{s.name}</option>)}</select></FormField>
          </div>
          <FormField label="Notas"><textarea value={draft.notes} onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
        </div>
        <Button onClick={createLead} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40">Crear lead</Button>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
