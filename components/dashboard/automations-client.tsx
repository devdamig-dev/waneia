"use client";

import { useEffect, useMemo, useState } from "react";
import { CategoryBadge } from "@/components/dashboard/category-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { automationRules } from "@/data/mock-data";
import { ConversationCategory } from "@/types/entities";
import { useWorkspace } from "@/components/dashboard/workspace-context";

type RuleStatus = "activa" | "pausada" | "borrador";
type RichRule = {
  id: string;
  name: string;
  category: ConversationCategory;
  triggerType: string;
  triggerKeywords: string;
  action: string;
  priority: "alta" | "media" | "baja";
  schedule: string;
  destinationQueue: string;
  routeToHuman: boolean;
  responseMessage: string;
  confidence: number;
  status: RuleStatus;
  lastExecuted: string;
  totalExecutions: number;
  exampleMessage: string;
  executionHistory: Array<{ id: string; detectedMessage: string; result: string; when: string }>;
  conditions: string[];
  lastTriggeredAt: string;
};

const seedRules: RichRule[] = automationRules.map((rule, index) => ({
  id: rule.id,
  name: rule.name,
  category: rule.category,
  triggerType: "palabras clave",
  triggerKeywords: rule.trigger,
  action: rule.action,
  priority: index % 2 === 0 ? "alta" : "media",
  schedule: "24/7",
  destinationQueue: rule.category === "soporte humano" ? "Equipo Comercial" : "Bot IA",
  routeToHuman: rule.category === "soporte humano",
  responseMessage: "¡Gracias por escribir! Ya detectamos tu consulta y te damos una respuesta precisa.",
  confidence: rule.confidence,
  status: rule.active ? "activa" : "pausada",
  lastExecuted: "Hoy, 11:42",
  totalExecutions: 48 + index * 9,
  exampleMessage: "Hola, quería consultar precio",
  executionHistory: [
    { id: `${rule.id}-h1`, detectedMessage: "Necesito presupuesto", result: "Clasificado y respuesta enviada", when: "Hace 10 min" },
    { id: `${rule.id}-h2`, detectedMessage: "Quiero hablar con asesor", result: "Derivado a humano", when: "Hace 34 min" },
  ],
  conditions: [rule.trigger, "Canal: WhatsApp", "Idioma: es-AR"],
  lastTriggeredAt: "Hoy, 12:04",
}));

const tabOptions: Array<{ label: string; value: "todas" | RuleStatus }> = [
  { label: "Todas", value: "todas" },
  { label: "Activas", value: "activa" },
  { label: "Pausadas", value: "pausada" },
  { label: "Borradores", value: "borrador" },
];

export function AutomationsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const [rules, setRules] = useState<RichRule[]>(seedRules);
  const [tab, setTab] = useState<(typeof tabOptions)[number]["value"]>("todas");
  const [selectedId, setSelectedId] = useState(rules[0]?.id ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const workspaceRules = useMemo(() => rules.filter((r) => automationRules.find((base) => base.id === r.id)?.workspaceId === activeWorkspaceId || r.id.startsWith("a-")), [rules, activeWorkspaceId]);
  const filteredRules = useMemo(() => workspaceRules.filter((r) => (tab === "todas" ? true : r.status === tab)), [workspaceRules, tab]);
  const selected = filteredRules.find((rule) => rule.id === selectedId) ?? filteredRules[0];

  const [draft, setDraft] = useState<RichRule>(seedRules[0]);

  useEffect(() => {
    setSelectedId(filteredRules[0]?.id ?? "");
    if (filteredRules[0]) setDraft(filteredRules[0]);
  }, [activeWorkspaceId]);
  const [newRule, setNewRule] = useState({
    name: "",
    category: "consulta" as ConversationCategory,
    triggerType: "palabras clave",
    triggerKeywords: "",
    action: "Responder FAQ y solicitar datos.",
    priority: "media" as RichRule["priority"],
    schedule: "24/7",
    routeToHuman: false,
    destinationQueue: "Bot IA",
    responseMessage: "",
    conditions: "",
  });

  const loadRule = (id: string) => {
    const rule = rules.find((item) => item.id === id);
    if (!rule) return;
    setSelectedId(id);
    setDraft(rule);
    setEditing(false);
  };

  const saveRule = () => {
    setSaving(true);
    setTimeout(() => {
      setRules((prev) => prev.map((rule) => (rule.id === draft.id ? draft : rule)));
      setEditing(false);
      setSaving(false);
      setToast("Regla guardada con éxito.");
    }, 800);
  };

  const createRule = () => {
    setCreating(true);
    setTimeout(() => {
      const created: RichRule = {
        id: `a-${Date.now()}`,
        name: newRule.name || "Nueva regla",
        category: newRule.category,
        triggerType: newRule.triggerType,
        triggerKeywords: newRule.triggerKeywords,
        action: newRule.action,
        priority: newRule.priority,
        schedule: newRule.schedule,
        destinationQueue: newRule.destinationQueue,
        routeToHuman: newRule.routeToHuman,
        responseMessage: newRule.responseMessage || "¡Gracias por escribir! Ya estamos procesando tu consulta.",
        status: "borrador",
        confidence: 80,
        lastExecuted: "Aún no ejecutada",
        totalExecutions: 0,
        exampleMessage: "¿Me pasás más información?",
        executionHistory: [],
        conditions: newRule.conditions ? newRule.conditions.split(",").map((item) => item.trim()) : ["Condición inicial"],
        lastTriggeredAt: "Sin ejecuciones",
      };
      setRules((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setDraft(created);
      setOpenCreate(false);
      setCreating(false);
      setToast("Automatización creada como borrador.");
    }, 900);
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          {tabOptions.map((option) => (
            <button key={option.label} onClick={() => setTab(option.value)} className={`rounded-lg px-3 py-1.5 text-sm transition ${tab === option.value ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-300 hover:bg-white/10"}`}>{option.label}</button>
          ))}
        </div>
        <Button className="bg-emerald-500/20 hover:bg-emerald-500/30" onClick={() => setOpenCreate(true)}>Crear automatización</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">
          {filteredRules.map((rule) => (
            <Card key={rule.id} onClick={() => loadRule(rule.id)} className={`cursor-pointer p-4 transition hover:-translate-y-0.5 hover:bg-white/10 ${selected?.id === rule.id ? "border-cyan-300/30 bg-cyan-500/10" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{rule.name}</p>
                  <p className="text-xs text-zinc-400">{rule.triggerType} · Prioridad {rule.priority}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${rule.status === "activa" ? "bg-emerald-500/20 text-emerald-100" : rule.status === "pausada" ? "bg-amber-500/20 text-amber-100" : "bg-zinc-500/20 text-zinc-200"}`}>{rule.status}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <CategoryBadge category={rule.category} />
                <span className="text-xs text-cyan-200">Confianza de automatización: {rule.confidence}%</span>
              </div>
            </Card>
          ))}
        </div>

        {selected ? (
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">{selected.name}</h3>
              <div className="flex gap-2">
                <Button onClick={() => setEditing((v) => !v)}>{editing ? "Cancelar" : "Editar"}</Button>
                <ToggleSwitch checked={draft.status === "activa"} onChange={(v) => setDraft((prev) => ({ ...prev, status: v ? "activa" : "pausada" }))} />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Nombre"><input disabled={!editing} value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
              <FormField label="Categoría">
                <select disabled={!editing} value={draft.category} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value as ConversationCategory }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <option value="presupuesto" className="bg-[#0b1023]">presupuesto</option><option value="pedido" className="bg-[#0b1023]">pedido</option><option value="consulta" className="bg-[#0b1023]">consulta</option><option value="soporte humano" className="bg-[#0b1023]">soporte humano</option>
                </select>
              </FormField>
              <FormField label="Trigger type"><input disabled={!editing} value={draft.triggerType} onChange={(e) => setDraft((p) => ({ ...p, triggerType: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
              <FormField label="Trigger keywords"><input disabled={!editing} value={draft.triggerKeywords} onChange={(e) => setDraft((p) => ({ ...p, triggerKeywords: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
              <FormField label="Prioridad">
                <select disabled={!editing} value={draft.priority} onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value as RichRule["priority"] }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <option value="alta" className="bg-[#0b1023]">alta</option><option value="media" className="bg-[#0b1023]">media</option><option value="baja" className="bg-[#0b1023]">baja</option>
                </select>
              </FormField>
              <FormField label="Horario de ejecución"><input disabled={!editing} value={draft.schedule} onChange={(e) => setDraft((p) => ({ ...p, schedule: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
              <FormField label="Canal / cola destino"><input disabled={!editing} value={draft.destinationQueue} onChange={(e) => setDraft((p) => ({ ...p, destinationQueue: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
              <FormField label="Confianza mínima (%)"><input type="number" disabled={!editing} value={draft.confidence} onChange={(e) => setDraft((p) => ({ ...p, confidence: Number(e.target.value || 0) }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            </div>

            <FormField label="Acción automática"><textarea disabled={!editing} value={draft.action} onChange={(e) => setDraft((p) => ({ ...p, action: e.target.value }))} className="mt-3 min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Mensaje de respuesta"><textarea disabled={!editing} value={draft.responseMessage} onChange={(e) => setDraft((p) => ({ ...p, responseMessage: e.target.value }))} className="mt-3 min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div><p>Derivar a humano</p><p className="text-xs text-zinc-400">Siguiente paso recomendado para casos sensibles</p></div>
              <ToggleSwitch checked={draft.routeToHuman} onChange={(v) => setDraft((p) => ({ ...p, routeToHuman: v }))} />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Card className="p-3"><p className="text-xs text-zinc-400">Última ejecución</p><p className="text-sm">{draft.lastExecuted}</p><p className="mt-1 text-xs text-zinc-500">Last triggered: {draft.lastTriggeredAt}</p><p className="mt-1 text-xs text-zinc-500">Total ejecuciones: {draft.totalExecutions}</p></Card>
              <Card className="p-3"><p className="text-xs text-zinc-400">Ejemplo disparador</p><p className="text-sm">“{draft.exampleMessage}”</p><p className="mt-1 text-xs text-cyan-200">Motivo de clasificación: keywords detectadas</p></Card>
            </div>

            <Card className="mt-3 p-3">
              <p className="text-sm font-semibold">Conditions block</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {draft.conditions.map((condition) => (
                  <span key={condition} className="rounded-full border border-violet-300/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-100">{condition}</span>
                ))}
              </div>
              <input disabled={!editing} value={draft.conditions.join(", ")} onChange={(e) => setDraft((p) => ({ ...p, conditions: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" placeholder="Agregar condiciones separadas por coma" />
            </Card>

            <Card className="mt-3 p-3">
              <p className="text-sm font-semibold">Vista previa de respuesta</p>
              <p className="mt-2 rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">{draft.responseMessage}</p>
            </Card>

            <Card className="mt-3 p-3">
              <p className="text-sm font-semibold">Últimos eventos</p>
              <div className="mt-2 space-y-2">
                {draft.executionHistory.length === 0 ? (
                  <p className="text-xs text-zinc-500">Sin eventos todavía para esta regla.</p>
                ) : draft.executionHistory.map((event) => (
                  <div key={event.id} className="rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
                    <p className="text-zinc-200">Mensaje detectado: {event.detectedMessage}</p>
                    <p className="text-zinc-400">Resultado: {event.result} · {event.when}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Button disabled={!editing || saving} onClick={saveRule} className="mt-4 w-full bg-cyan-500/20 hover:bg-cyan-500/30">{saving ? "Guardando..." : "Guardar cambios"}</Button>
          </Card>
        ) : (
          <Card className="p-6 text-sm text-zinc-400">No hay reglas para el filtro seleccionado.</Card>
        )}
      </div>

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Nueva automatización">
        <div className="grid gap-3">
          <FormField label="Nombre"><input value={newRule.name} onChange={(e) => setNewRule((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          <FormField label="Categoría"><select value={newRule.category} onChange={(e) => setNewRule((p) => ({ ...p, category: e.target.value as ConversationCategory }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5"><option value="presupuesto" className="bg-[#0b1023]">presupuesto</option><option value="pedido" className="bg-[#0b1023]">pedido</option><option value="consulta" className="bg-[#0b1023]">consulta</option><option value="soporte humano" className="bg-[#0b1023]">soporte humano</option></select></FormField>
          <FormField label="Trigger type"><input value={newRule.triggerType} onChange={(e) => setNewRule((p) => ({ ...p, triggerType: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          <FormField label="Trigger keywords"><input value={newRule.triggerKeywords} onChange={(e) => setNewRule((p) => ({ ...p, triggerKeywords: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          <FormField label="Conditions block"><input value={newRule.conditions} onChange={(e) => setNewRule((p) => ({ ...p, conditions: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" placeholder="Canal: WhatsApp, País: AR" /></FormField>
          <FormField label="Acción automática"><textarea value={newRule.action} onChange={(e) => setNewRule((p) => ({ ...p, action: e.target.value }))} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          <FormField label="Mensaje de respuesta"><textarea value={newRule.responseMessage} onChange={(e) => setNewRule((p) => ({ ...p, responseMessage: e.target.value }))} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
        </div>
        <Button onClick={createRule} disabled={creating} className="mt-4 w-full bg-emerald-500/20 hover:bg-emerald-500/30">{creating ? "Creando..." : "Crear automatización"}</Button>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
