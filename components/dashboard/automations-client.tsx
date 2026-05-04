"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Copy, Play, Plus, Sparkles, X } from "lucide-react";
import { CategoryBadge } from "@/components/dashboard/category-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { automationRules as seedRules } from "@/data/mock-data";
import {
  AutomationAction,
  AutomationCondition,
  AutomationRule,
  AutomationStatus,
  AutomationTrigger,
  ConversationCategory,
} from "@/types/entities";
import { useWorkspace } from "@/components/dashboard/workspace-context";

const statusTone: Record<AutomationStatus, string> = {
  borrador: "border-zinc-300/40 bg-zinc-500/10 text-zinc-200",
  test: "border-amber-300/40 bg-amber-500/10 text-amber-100",
  activa: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100",
  pausada: "border-rose-300/40 bg-rose-500/10 text-rose-100",
};

const statusLabel: Record<AutomationStatus, string> = {
  borrador: "Borrador",
  test: "En prueba",
  activa: "Activa",
  pausada: "Pausada",
};

const tabOptions: Array<{ label: string; value: "todas" | AutomationStatus }> = [
  { label: "Todas", value: "todas" },
  { label: "Activas", value: "activa" },
  { label: "En prueba", value: "test" },
  { label: "Borradores", value: "borrador" },
  { label: "Pausadas", value: "pausada" },
];

type BuilderTab = "disparador" | "condiciones" | "acciones" | "prueba" | "historial";
const builderTabs: Array<{ key: BuilderTab; label: string }> = [
  { key: "disparador", label: "1 · Disparador" },
  { key: "condiciones", label: "2 · Condiciones" },
  { key: "acciones", label: "3 · Acciones" },
  { key: "prueba", label: "4 · Prueba" },
  { key: "historial", label: "5 · Historial" },
];

const intentByCategory: Record<ConversationCategory, string> = {
  presupuesto: "solicitud_de_cotización",
  pedido: "consulta_de_pedido",
  consulta: "exploración_de_oferta",
  "soporte humano": "derivación_humana",
};

export function AutomationsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const [rules, setRules] = useState<AutomationRule[]>(seedRules);
  const [tab, setTab] = useState<(typeof tabOptions)[number]["value"]>("todas");
  const [selectedId, setSelectedId] = useState("");
  const [builderTab, setBuilderTab] = useState<BuilderTab>("disparador");
  const [toast, setToast] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<{
    matched: boolean;
    matchedKeyword?: string;
    intent: string;
    confidence: number;
    actions: AutomationAction[];
    response: string;
  } | null>(null);

  const workspaceRules = useMemo(
    () => rules.filter((r) => r.workspaceId === activeWorkspaceId && (tab === "todas" || r.status === tab)),
    [rules, activeWorkspaceId, tab],
  );

  useEffect(() => {
    setSelectedId(workspaceRules[0]?.id ?? "");
    setBuilderTab("disparador");
    setTestResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId, tab]);

  const selected = useMemo(() => rules.find((r) => r.id === selectedId), [rules, selectedId]);

  const updateRule = (id: string, patch: Partial<AutomationRule>) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const toggleActive = (id: string, active: boolean) =>
    updateRule(id, { status: active ? "activa" : "pausada" });

  const updateTrigger = (id: string, trigger: AutomationTrigger) => updateRule(id, { trigger });

  const addCondition = (id: string) => {
    if (!selected) return;
    const newCond: AutomationCondition = {
      id: `co-${Date.now()}`,
      logic: "AND",
      field: "lead_score",
      operator: ">=",
      value: "60",
    };
    updateRule(id, { conditions: [...selected.conditions, newCond] });
  };

  const removeCondition = (id: string, condId: string) => {
    if (!selected) return;
    updateRule(id, { conditions: selected.conditions.filter((c) => c.id !== condId) });
  };

  const updateCondition = (id: string, condId: string, patch: Partial<AutomationCondition>) => {
    if (!selected) return;
    updateRule(id, {
      conditions: selected.conditions.map((c) => (c.id === condId ? { ...c, ...patch } : c)),
    });
  };

  const addAction = (id: string) => {
    if (!selected) return;
    const action: AutomationAction = { id: `ac-${Date.now()}`, type: "responder", value: "Plantilla por defecto" };
    updateRule(id, { actions: [...selected.actions, action] });
  };

  const removeAction = (id: string, acId: string) => {
    if (!selected) return;
    updateRule(id, { actions: selected.actions.filter((a) => a.id !== acId) });
  };

  const updateAction = (id: string, acId: string, patch: Partial<AutomationAction>) => {
    if (!selected) return;
    updateRule(id, {
      actions: selected.actions.map((a) => (a.id === acId ? { ...a, ...patch } : a)),
    });
  };

  const runTest = () => {
    if (!selected) return;
    if (!testInput.trim()) {
      setToast("Ingresá un mensaje de prueba.");
      return;
    }
    const text = testInput.toLowerCase();
    const keywords = selected.trigger.value.toLowerCase().split(/[,;]/).map((k) => k.trim()).filter(Boolean);
    const matchedKeyword = keywords.find((k) => text.includes(k));
    const matched = Boolean(matchedKeyword) || (selected.trigger.type !== "palabras clave" && selected.trigger.value.toLowerCase().split(/\s+/).some((w) => text.includes(w)));
    const baseConfidence = matched ? 70 + Math.min(20, (matchedKeyword?.length ?? 5) * 3) : 25;
    setTestResult({
      matched,
      matchedKeyword,
      intent: intentByCategory[selected.category],
      confidence: Math.min(98, baseConfidence + (selected.conditions.length * 2)),
      actions: selected.actions,
      response: selected.responseMessage,
    });
  };

  const createRule = (data: { name: string; category: ConversationCategory; trigger: string; response: string }) => {
    const created: AutomationRule = {
      id: `a-${Date.now()}`,
      workspaceId: activeWorkspaceId,
      name: data.name || "Nueva automatización",
      description: "Borrador creado desde la UI.",
      status: "borrador",
      category: data.category,
      trigger: { type: "palabras clave", value: data.trigger },
      conditions: [],
      actions: [{ id: `ac-${Date.now()}`, type: "responder", value: "Respuesta por defecto" }],
      responseMessage: data.response || "¡Gracias por tu mensaje! Ya estamos procesando tu consulta.",
      triggeredCount: 0,
      replyRate: 0,
      conversionEstimate: 0,
      lastExecuted: "Sin ejecutar",
      history: [],
    };
    setRules((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setOpenCreate(false);
    setBuilderTab("disparador");
    setToast("Automatización creada como borrador.");
  };

  const duplicateRule = (id: string) => {
    const r = rules.find((x) => x.id === id);
    if (!r) return;
    const cloned: AutomationRule = {
      ...r,
      id: `a-${Date.now()}`,
      name: `${r.name} (copia)`,
      status: "borrador",
      triggeredCount: 0,
      replyRate: 0,
      conversionEstimate: 0,
      lastExecuted: "Sin ejecutar",
      history: [],
      conditions: r.conditions.map((c) => ({ ...c, id: `co-${Math.random().toString(36).slice(2, 8)}` })),
      actions: r.actions.map((a) => ({ ...a, id: `ac-${Math.random().toString(36).slice(2, 8)}` })),
    };
    setRules((prev) => [cloned, ...prev]);
    setSelectedId(cloned.id);
    setToast("Regla duplicada como borrador.");
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
          {tabOptions.map((o) => (
            <button key={o.value} onClick={() => setTab(o.value)} className={`rounded-lg px-3 py-1.5 ${tab === o.value ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-300 hover:bg-white/10"}`}>{o.label}</button>
          ))}
        </div>
        <Button onClick={() => setOpenCreate(true)} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Plus className="mr-1 h-4 w-4" />Nueva automatización</Button>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <div className="space-y-3">
          {workspaceRules.length === 0 ? (
            <Card className="p-6 text-center text-sm text-zinc-400">No hay reglas para este filtro.</Card>
          ) : (
            workspaceRules.map((r) => (
              <Card key={r.id} onClick={() => setSelectedId(r.id)} className={`cursor-pointer p-4 transition hover:bg-white/10 ${selected?.id === r.id ? "border-cyan-300/40 bg-cyan-500/10" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-[11px] text-zinc-400">Disparador {r.trigger.type}: {r.trigger.value}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusTone[r.status]}`}>{statusLabel[r.status]}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <CategoryBadge category={r.category} />
                  <span className="text-[11px] text-zinc-400">{r.triggeredCount} ejecuciones · {r.replyRate}% respuesta</span>
                </div>
              </Card>
            ))
          )}
        </div>

        {selected ? (
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <input value={selected.name} onChange={(e) => updateRule(selected.id, { name: e.target.value })} className="w-full bg-transparent text-xl font-semibold focus:outline-none" />
                <input value={selected.description} onChange={(e) => updateRule(selected.id, { description: e.target.value })} className="mt-1 w-full bg-transparent text-xs text-zinc-400 focus:outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusTone[selected.status]}`}>{statusLabel[selected.status]}</span>
                <ToggleSwitch checked={selected.status === "activa"} onChange={(v) => toggleActive(selected.id, v)} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
              {builderTabs.map((bt) => (
                <button key={bt.key} onClick={() => setBuilderTab(bt.key)} className={`rounded-lg px-3 py-1.5 ${builderTab === bt.key ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-300 hover:bg-white/10"}`}>{bt.label}</button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {builderTab === "disparador" ? (
                <Card className="p-3">
                  <p className="text-xs uppercase tracking-wide text-cyan-300">Disparador</p>
                  <p className="text-[11px] text-zinc-400">Define el evento que activa la regla.</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-[160px_1fr]">
                    <select value={selected.trigger.type} onChange={(e) => updateTrigger(selected.id, { ...selected.trigger, type: e.target.value as AutomationTrigger["type"] })} className="rounded-xl border border-white/10 bg-white/5 p-2 text-sm">
                      <option value="palabras clave" className="bg-[#0b1023]">Palabras clave</option>
                      <option value="intent" className="bg-[#0b1023]">Intent detectado</option>
                      <option value="segmento" className="bg-[#0b1023]">Pertenece a segmento</option>
                      <option value="horario" className="bg-[#0b1023]">Horario / cron</option>
                    </select>
                    <input value={selected.trigger.value} onChange={(e) => updateTrigger(selected.id, { ...selected.trigger, value: e.target.value })} className="rounded-xl border border-white/10 bg-white/5 p-2 text-sm" />
                  </div>
                  <FormField label="Categoría asociada">
                    <select value={selected.category} onChange={(e) => updateRule(selected.id, { category: e.target.value as ConversationCategory })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
                      <option value="presupuesto" className="bg-[#0b1023]">Presupuesto</option>
                      <option value="pedido" className="bg-[#0b1023]">Pedido</option>
                      <option value="consulta" className="bg-[#0b1023]">Consulta</option>
                      <option value="soporte humano" className="bg-[#0b1023]">Soporte humano</option>
                    </select>
                  </FormField>
                </Card>
              ) : null}

              {builderTab === "condiciones" ? (
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-violet-300">Condiciones</p>
                      <p className="text-[11px] text-zinc-400">Filtros adicionales (lead_score, segmento, horario, etc.). Sin condiciones la regla se ejecuta siempre.</p>
                    </div>
                    <button onClick={() => addCondition(selected.id)} className="text-xs text-cyan-200">+ Agregar condición</button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {selected.conditions.length === 0 ? <p className="rounded-lg border border-dashed border-white/10 bg-black/20 p-3 text-xs text-zinc-500">Sin condiciones aplicadas.</p> : selected.conditions.map((c, idx) => (
                      <div key={c.id} className="grid gap-2 md:grid-cols-[80px_1fr_100px_1fr_28px]">
                        <select disabled={idx === 0} value={c.logic} onChange={(e) => updateCondition(selected.id, c.id, { logic: e.target.value as "AND" | "OR" })} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs disabled:opacity-50"><option className="bg-[#0b1023]">AND</option><option className="bg-[#0b1023]">OR</option></select>
                        <input value={c.field} onChange={(e) => updateCondition(selected.id, c.id, { field: e.target.value })} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs" placeholder="campo" />
                        <input value={c.operator} onChange={(e) => updateCondition(selected.id, c.id, { operator: e.target.value })} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs" placeholder="operador" />
                        <input value={c.value} onChange={(e) => updateCondition(selected.id, c.id, { value: e.target.value })} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs" placeholder="valor" />
                        <button onClick={() => removeCondition(selected.id, c.id)} className="rounded-lg border border-white/10 bg-white/5 p-1 text-xs"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}

              {builderTab === "acciones" ? (
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-emerald-300">Acciones</p>
                      <p className="text-[11px] text-zinc-400">Qué hace WANEIA cuando la regla se cumple.</p>
                    </div>
                    <button onClick={() => addAction(selected.id)} className="text-xs text-cyan-200">+ Agregar acción</button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {selected.actions.map((a) => (
                      <div key={a.id} className="grid gap-2 md:grid-cols-[160px_1fr_28px]">
                        <select value={a.type} onChange={(e) => updateAction(selected.id, a.id, { type: e.target.value as AutomationAction["type"] })} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
                          <option value="responder" className="bg-[#0b1023]">Responder</option>
                          <option value="asignar agente" className="bg-[#0b1023]">Asignar operador</option>
                          <option value="agregar etiqueta" className="bg-[#0b1023]">Agregar etiqueta</option>
                          <option value="crear lead" className="bg-[#0b1023]">Crear lead</option>
                          <option value="notificar equipo" className="bg-[#0b1023]">Notificar equipo</option>
                        </select>
                        <input value={a.value} onChange={(e) => updateAction(selected.id, a.id, { value: e.target.value })} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs" />
                        <button onClick={() => removeAction(selected.id, a.id)} className="rounded-lg border border-white/10 bg-white/5 p-1 text-xs"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 border-t border-white/10 pt-3">
                    <p className="text-xs uppercase tracking-wide text-zinc-400">Mensaje de respuesta</p>
                    <textarea value={selected.responseMessage} onChange={(e) => updateRule(selected.id, { responseMessage: e.target.value })} className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm" />
                    <div className="mt-2 max-w-sm rounded-2xl bg-emerald-500/15 p-3 text-sm text-emerald-50">
                      {selected.responseMessage}
                    </div>
                  </div>
                </Card>
              ) : null}

              {builderTab === "prueba" ? (
                <Card className="p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-400 inline-flex items-center gap-1"><Bot className="h-3.5 w-3.5" /> Prueba manual</p>
                  <p className="text-[11px] text-zinc-400">Escribí un mensaje como si fuera de un cliente. WANEIA simula la coincidencia, intent, confianza y acciones que ejecutaría.</p>
                  <div className="mt-3 flex gap-2">
                    <input value={testInput} onChange={(e) => setTestInput(e.target.value)} placeholder="Ej.: Hola, quería el precio del placard" className="flex-1 rounded-xl border border-white/10 bg-white/5 p-2 text-sm" />
                    <Button onClick={runTest} className="bg-cyan-500/30 hover:bg-cyan-500/40"><Play className="mr-1 h-4 w-4" />Probar</Button>
                  </div>
                  {testResult ? (
                    <div className="mt-3 space-y-2">
                      <Card className={`p-3 ${testResult.matched ? "border-emerald-300/30 bg-emerald-500/5" : "border-rose-300/30 bg-rose-500/5"}`}>
                        <p className={`text-sm font-semibold ${testResult.matched ? "text-emerald-100" : "text-rose-100"}`}>
                          {testResult.matched ? "✅ Coincide con esta regla" : "❌ No coincide con esta regla"}
                        </p>
                        <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                          <p><span className="text-zinc-400">Regla:</span> {selected.name}</p>
                          <p><span className="text-zinc-400">Intent detectado:</span> {testResult.intent}</p>
                          <p><span className="text-zinc-400">Confianza:</span> {testResult.confidence}%</p>
                        </div>
                        {testResult.matchedKeyword ? <p className="mt-1 text-[11px] text-emerald-200">Palabra clave coincidente: <span className="font-mono">{testResult.matchedKeyword}</span></p> : null}
                      </Card>
                      <Card className="p-3">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">Acciones que ejecutaría</p>
                        <ul className="mt-2 space-y-1 text-sm">
                          {testResult.actions.map((a) => <li key={a.id} className="text-zinc-200">→ {a.type}: <span className="text-zinc-400">{a.value}</span></li>)}
                        </ul>
                      </Card>
                      <Card className="p-3">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">Respuesta que enviaría</p>
                        <p className="mt-2 max-w-sm rounded-2xl bg-emerald-500/15 p-3 text-sm text-emerald-50">{testResult.response}</p>
                      </Card>
                    </div>
                  ) : null}
                </Card>
              ) : null}

              {builderTab === "historial" ? (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <Card className="p-3 text-xs"><p className="text-zinc-400">Ejecuciones totales</p><p className="mt-1 text-lg font-bold">{selected.triggeredCount}</p></Card>
                    <Card className="p-3 text-xs"><p className="text-zinc-400">Tasa de respuesta</p><p className="mt-1 text-lg font-bold text-emerald-100">{selected.replyRate}%</p></Card>
                    <Card className="p-3 text-xs"><p className="text-zinc-400">Conversión estimada</p><p className="mt-1 text-lg font-bold text-violet-100">{selected.conversionEstimate}%</p></Card>
                  </div>
                  <Card className="p-3">
                    <p className="text-xs uppercase tracking-wide text-zinc-400 inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Eventos recientes</p>
                    <div className="mt-2 space-y-2 text-xs">
                      {selected.history.length === 0 ? <p className="text-zinc-500">Sin ejecuciones todavía.</p> : selected.history.map((h) => (
                        <div key={h.id} className="rounded-lg border border-white/10 bg-white/5 p-2">
                          <p className="text-zinc-200">"{h.detectedMessage}"</p>
                          <p className="text-zinc-400">{h.result} · {h.when}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <p className="text-[11px] text-zinc-500">Última ejecución: {selected.lastExecuted}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => { updateRule(selected.id, { status: "activa" }); setToast("Automatización publicada."); }} className="bg-emerald-500/30 hover:bg-emerald-500/40">Publicar</Button>
                <Button onClick={() => { updateRule(selected.id, { status: "test" }); setToast("Modo prueba activo."); }}>Modo prueba</Button>
                <Button onClick={() => { updateRule(selected.id, { status: "pausada" }); setToast("Automatización pausada."); }} className="bg-rose-500/30 hover:bg-rose-500/40">Pausar</Button>
                <Button onClick={() => duplicateRule(selected.id)}><Copy className="mr-1 h-4 w-4" />Duplicar</Button>
                <Button onClick={() => setToast("Cambios guardados.")}>Guardar cambios</Button>
              </div>
            </div>
          </Card>
        ) : null}
      </div>

      <CreateAutomationModal open={openCreate} onClose={() => setOpenCreate(false)} onSubmit={createRule} />
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}

function CreateAutomationModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (data: { name: string; category: ConversationCategory; trigger: string; response: string }) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ConversationCategory>("consulta");
  const [trigger, setTrigger] = useState("");
  const [response, setResponse] = useState("");

  return (
    <Modal open={open} onClose={onClose} title="Nueva automatización">
      <div className="grid gap-3">
        <FormField label="Nombre"><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
        <FormField label="Categoría">
          <select value={category} onChange={(e) => setCategory(e.target.value as ConversationCategory)} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
            <option value="presupuesto" className="bg-[#0b1023]">Presupuesto</option>
            <option value="pedido" className="bg-[#0b1023]">Pedido</option>
            <option value="consulta" className="bg-[#0b1023]">Consulta</option>
            <option value="soporte humano" className="bg-[#0b1023]">Soporte humano</option>
          </select>
        </FormField>
        <FormField label="Palabras clave (separadas por coma)" hint="WANEIA detecta cualquiera de estas palabras en el mensaje del cliente."><input value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" placeholder="precio, presupuesto, costo" /></FormField>
        <FormField label="Mensaje de respuesta"><textarea value={response} onChange={(e) => setResponse(e.target.value)} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
      </div>
      <Button onClick={() => onSubmit({ name, category, trigger, response })} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40">Crear automatización</Button>
    </Modal>
  );
}
