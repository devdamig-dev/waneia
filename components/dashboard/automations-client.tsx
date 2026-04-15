"use client";

import { useMemo, useState } from "react";
import { Beaker, Copy, FlaskConical, PlayCircle } from "lucide-react";
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

type RuleStatus = "draft" | "testing" | "active" | "paused";
type LogicOperator = "AND" | "OR";
type Condition = { id: string; field: string; operator: string; value: string };
type RichRule = {
  id: string;
  workspaceId: string;
  name: string;
  category: ConversationCategory;
  triggerKeywords: string[];
  conditions: Condition[];
  logicOperator: LogicOperator;
  action: string;
  responseMessage: string;
  destinationQueue: string;
  schedule: string;
  routeToHuman: boolean;
  status: RuleStatus;
  confidence: number;
  lastTriggeredAt: string;
  executionHistory: Array<{ id: string; sample: string; outcome: string; when: string }>;
};

const seedRules: RichRule[] = automationRules.map((rule, index) => ({
  id: rule.id,
  workspaceId: rule.workspaceId,
  name: rule.name,
  category: rule.category,
  triggerKeywords: rule.trigger.split(":").join(",").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3),
  conditions: [
    { id: `${rule.id}-c1`, field: "canal", operator: "es", value: "whatsapp" },
    { id: `${rule.id}-c2`, field: "idioma", operator: "es", value: "es-AR" },
  ],
  logicOperator: index % 2 === 0 ? "AND" : "OR",
  action: rule.action,
  responseMessage: "¡Gracias por escribir! Estamos procesando tu consulta.",
  destinationQueue: rule.category === "soporte humano" ? "Equipo Comercial" : "Bot IA",
  schedule: "24/7",
  routeToHuman: rule.category === "soporte humano",
  status: rule.active ? "active" : "paused",
  confidence: rule.confidence,
  lastTriggeredAt: "Hoy, 12:14",
  executionHistory: [
    { id: `${rule.id}-h1`, sample: "Necesito precio", outcome: "Auto-respuesta enviada", when: "Hace 12 min" },
    { id: `${rule.id}-h2`, sample: "Quiero hablar con asesor", outcome: "Derivado a humano", when: "Hace 40 min" },
  ],
}));

export function AutomationsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const [rules, setRules] = useState(seedRules);
  const [selectedId, setSelectedId] = useState(seedRules[0]?.id ?? "");
  const [editing, setEditing] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [toast, setToast] = useState("");
  const [testMessage, setTestMessage] = useState("Quiero precio y tiempos de entrega");

  const workspaceRules = useMemo(() => rules.filter((r) => r.workspaceId === activeWorkspaceId || r.id.startsWith("new-")), [rules, activeWorkspaceId]);
  const selected = workspaceRules.find((rule) => rule.id === selectedId) ?? workspaceRules[0];

  const updateRule = (next: RichRule) => setRules((prev) => prev.map((rule) => (rule.id === next.id ? next : rule)));
  const duplicateRule = (rule: RichRule) => {
    const duplicate: RichRule = { ...rule, id: `new-${Date.now()}`, name: `${rule.name} (copy)`, status: "draft" };
    setRules((prev) => [duplicate, ...prev]);
    setSelectedId(duplicate.id);
    setToast("Automatización duplicada.");
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">Builder V3: separá Trigger, Lógica y Acción para operar reglas de forma segura.</p>
        <Button onClick={() => setOpenCreate(true)} className="bg-emerald-500/20 hover:bg-emerald-500/30">Nueva regla</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          {workspaceRules.map((rule) => (
            <Card key={rule.id} className={`cursor-pointer p-4 transition hover:-translate-y-0.5 hover:bg-white/10 ${selected?.id === rule.id ? "border-cyan-300/30 bg-cyan-500/10" : ""}`} onClick={() => { setSelectedId(rule.id); setEditing(false); }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{rule.name}</p>
                  <p className="text-xs text-zinc-400">Queue {rule.destinationQueue} · Last trigger {rule.lastTriggeredAt}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${rule.status === "active" ? "bg-emerald-500/20 text-emerald-100" : rule.status === "testing" ? "bg-violet-500/20 text-violet-100" : rule.status === "paused" ? "bg-amber-500/20 text-amber-100" : "bg-zinc-500/20 text-zinc-200"}`}>{rule.status}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><CategoryBadge category={rule.category} /><span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-cyan-100">{rule.logicOperator}</span><span className="rounded-full border border-violet-300/30 bg-violet-500/10 px-2 py-1 text-violet-100">{rule.conditions.length} condiciones</span></div>
            </Card>
          ))}
        </div>

        {selected ? (
          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-semibold">{selected.name}</h3>
              <div className="flex gap-2">
                <Button onClick={() => duplicateRule(selected)} className="inline-flex gap-1"><Copy className="h-4 w-4" />Duplicar</Button>
                <Button onClick={() => setEditing((v) => !v)}>{editing ? "Cancelar" : "Editar"}</Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Estado">
                <select value={selected.status} disabled={!editing} onChange={(e) => updateRule({ ...selected, status: e.target.value as RuleStatus })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <option value="draft" className="bg-[#0b1023]">draft</option>
                  <option value="testing" className="bg-[#0b1023]">testing</option>
                  <option value="active" className="bg-[#0b1023]">active</option>
                  <option value="paused" className="bg-[#0b1023]">paused</option>
                </select>
              </FormField>
              <FormField label="Categoría"><select value={selected.category} disabled={!editing} onChange={(e) => updateRule({ ...selected, category: e.target.value as ConversationCategory })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5"><option value="presupuesto" className="bg-[#0b1023]">presupuesto</option><option value="pedido" className="bg-[#0b1023]">pedido</option><option value="consulta" className="bg-[#0b1023]">consulta</option><option value="soporte humano" className="bg-[#0b1023]">soporte humano</option></select></FormField>
            </div>

            <Card className="mt-3 p-3">
              <p className="text-sm font-semibold">1) Trigger</p>
              <input disabled={!editing} value={selected.triggerKeywords.join(", ")} onChange={(e) => updateRule({ ...selected, triggerKeywords: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" placeholder="precio, presupuesto, costo" />
              <FormField label="Horario"><input disabled={!editing} value={selected.schedule} onChange={(e) => updateRule({ ...selected, schedule: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" /></FormField>
            </Card>

            <Card className="mt-3 p-3">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold">2) Lógica</p><select value={selected.logicOperator} disabled={!editing} onChange={(e) => updateRule({ ...selected, logicOperator: e.target.value as LogicOperator })} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs"><option value="AND" className="bg-[#0b1023]">AND</option><option value="OR" className="bg-[#0b1023]">OR</option></select></div>
              <div className="mt-2 space-y-2">
                {selected.conditions.map((condition) => (
                  <div key={condition.id} className="grid gap-2 rounded-lg border border-white/10 bg-white/5 p-2 md:grid-cols-3">
                    <input disabled={!editing} value={condition.field} onChange={(e) => updateRule({ ...selected, conditions: selected.conditions.map((c) => c.id === condition.id ? { ...c, field: e.target.value } : c) })} className="rounded-lg border border-white/10 bg-black/20 p-2 text-xs" />
                    <input disabled={!editing} value={condition.operator} onChange={(e) => updateRule({ ...selected, conditions: selected.conditions.map((c) => c.id === condition.id ? { ...c, operator: e.target.value } : c) })} className="rounded-lg border border-white/10 bg-black/20 p-2 text-xs" />
                    <input disabled={!editing} value={condition.value} onChange={(e) => updateRule({ ...selected, conditions: selected.conditions.map((c) => c.id === condition.id ? { ...c, value: e.target.value } : c) })} className="rounded-lg border border-white/10 bg-black/20 p-2 text-xs" />
                  </div>
                ))}
              </div>
              <Button disabled={!editing} onClick={() => updateRule({ ...selected, conditions: [...selected.conditions, { id: `${selected.id}-c-${Date.now()}`, field: "campo", operator: "es", value: "valor" }] })} className="mt-2">Agregar condición</Button>
            </Card>

            <Card className="mt-3 p-3">
              <p className="text-sm font-semibold">3) Acción</p>
              <FormField label="Destino"><input disabled={!editing} value={selected.destinationQueue} onChange={(e) => updateRule({ ...selected, destinationQueue: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" /></FormField>
              <textarea disabled={!editing} value={selected.responseMessage} onChange={(e) => updateRule({ ...selected, responseMessage: e.target.value })} className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
              <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"><span className="text-sm">Derivar a humano</span><ToggleSwitch checked={selected.routeToHuman} onChange={(v) => updateRule({ ...selected, routeToHuman: v })} /></div>
            </Card>

            <Card className="mt-3 p-3">
              <p className="text-sm font-semibold inline-flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Manual test mode</p>
              <input value={testMessage} onChange={(e) => setTestMessage(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
              <Button className="mt-2 inline-flex gap-1" onClick={() => setToast(`Test ejecutado: ${selected.logicOperator} con ${selected.conditions.length} condiciones`) }><PlayCircle className="h-4 w-4" />Probar regla</Button>
            </Card>

            <Card className="mt-3 p-3">
              <p className="text-sm font-semibold inline-flex items-center gap-2"><Beaker className="h-4 w-4" /> Historial de ejecuciones</p>
              <div className="mt-2 space-y-2">{selected.executionHistory.map((h) => <div key={h.id} className="rounded-lg border border-white/10 bg-white/5 p-2 text-xs"><p>{h.sample}</p><p className="text-zinc-400">{h.outcome} · {h.when}</p></div>)}</div>
            </Card>
          </Card>
        ) : (
          <Card className="p-6 text-sm text-zinc-400">No hay automatizaciones para este workspace.</Card>
        )}
      </div>

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Nueva automatización V3">
        <p className="text-sm text-zinc-300">Se crea en estado <strong>draft</strong> para revisión segura antes de publicar.</p>
        <Button className="mt-4 w-full" onClick={() => {
          const created: RichRule = { id: `new-${Date.now()}`, workspaceId: activeWorkspaceId, name: "Nueva regla V3", category: "consulta", triggerKeywords: ["consulta"], conditions: [{ id: `c-${Date.now()}`, field: "canal", operator: "es", value: "whatsapp" }], logicOperator: "AND", action: "Responder y calificar", responseMessage: "Gracias por escribir", destinationQueue: "Bot IA", schedule: "24/7", routeToHuman: false, status: "draft", confidence: 80, lastTriggeredAt: "Sin ejecuciones", executionHistory: [] };
          setRules((prev) => [created, ...prev]);
          setSelectedId(created.id);
          setOpenCreate(false);
          setToast("Regla creada en draft.");
        }}>Crear</Button>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
