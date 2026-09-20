"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Clock3,
  Copy,
  MessageCircleMore,
  Play,
  Plus,
  Tag,
  TrendingUp,
  UserRound,
  Workflow,
  X,
} from "lucide-react";
import { automationRules as seedRules } from "@/data/mock-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Toast } from "@/components/ui/toast";
import {
  AutomationAction,
  AutomationRule,
  AutomationStatus,
  AutomationTrigger,
  ConversationCategory,
} from "@/types/entities";

type Filter = "todas" | "activa" | "pausada" | "borrador";

const STORAGE_KEY = "waneia.automations.v4";

const triggerLabels: Record<AutomationTrigger["type"], string> = {
  "nuevo mensaje": "Llega un nuevo mensaje",
  "palabras clave": "El mensaje contiene",
  intent: "Se detecta una intención",
  "sin respuesta": "No hay respuesta durante",
  "cambio de etapa": "La oportunidad cambia de etapa",
  segmento: "El contacto pertenece a",
  horario: "Se cumple un horario",
};

const actionLabels: Record<AutomationAction["type"], string> = {
  responder: "Enviar mensaje",
  "asignar agente": "Asignar responsable",
  "agregar etiqueta": "Agregar etiqueta",
  "crear lead": "Crear oportunidad",
  "notificar equipo": "Avisar al equipo",
  "crear tarea": "Crear seguimiento",
  "mover etapa": "Mover oportunidad",
};

const actionIcons: Record<AutomationAction["type"], typeof Workflow> = {
  responder: MessageCircleMore,
  "asignar agente": UserRound,
  "agregar etiqueta": Tag,
  "crear lead": TrendingUp,
  "notificar equipo": BellRing,
  "crear tarea": Clock3,
  "mover etapa": TrendingUp,
};

const statusTone: Record<AutomationStatus, string> = {
  borrador: "border-zinc-300/20 bg-zinc-500/10 text-zinc-300",
  test: "border-amber-300/20 bg-amber-500/10 text-amber-100",
  activa: "border-emerald-300/20 bg-emerald-500/10 text-emerald-100",
  pausada: "border-rose-300/20 bg-rose-500/10 text-rose-100",
};

const starterPresets: Array<{
  id: string;
  title: string;
  description: string;
  trigger: AutomationTrigger;
  actions: Array<Omit<AutomationAction, "id">>;
  response: string;
}> = [
  {
    id: "new-whatsapp",
    title: "Nuevo WhatsApp",
    description: "Asigna el chat y deja el lead listo para trabajar.",
    trigger: { type: "nuevo mensaje", value: "WhatsApp" },
    actions: [
      { type: "asignar agente", value: "Responsable disponible" },
      { type: "crear lead", value: "Etapa Nuevo" },
    ],
    response: "",
  },
  {
    id: "no-response",
    title: "Sin respuesta 15 min",
    description: "Avisa al equipo cuando una conversación queda esperando.",
    trigger: { type: "sin respuesta", value: "15 minutos" },
    actions: [
      { type: "notificar equipo", value: "Supervisor comercial" },
      { type: "crear tarea", value: "Retomar conversación" },
    ],
    response: "",
  },
  {
    id: "quote-followup",
    title: "Seguimiento de presupuesto",
    description: "Crea un seguimiento cuando un presupuesto queda sin respuesta.",
    trigger: { type: "sin respuesta", value: "48 horas después de cotizar" },
    actions: [
      { type: "crear tarea", value: "Retomar presupuesto" },
      { type: "responder", value: "Mensaje de seguimiento" },
    ],
    response: "Hola, ¿pudiste revisar el presupuesto? Si querés, te ayudo a resolver cualquier duda.",
  },
  {
    id: "after-hours",
    title: "Fuera de horario",
    description: "Responde y captura la consulta para que el equipo la retome.",
    trigger: { type: "horario", value: "Fuera del horario comercial" },
    actions: [
      { type: "responder", value: "Mensaje fuera de horario" },
      { type: "crear tarea", value: "Responder al iniciar la jornada" },
    ],
    response: "Recibimos tu mensaje. Ahora estamos fuera de horario, pero dejamos tu consulta registrada y te respondemos apenas volvamos.",
  },
];

export function AutomationsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const [rules, setRules] = useState<AutomationRule[]>(seedRules);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<Filter>("todas");
  const [selectedId, setSelectedId] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRules(JSON.parse(raw) as AutomationRule[]);
    } catch {
      // La demo puede funcionar sin persistencia.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    } catch {
      // Continuamos aunque localStorage no esté disponible.
    }
  }, [rules, hydrated]);

  const workspaceRules = useMemo(
    () =>
      rules.filter(
        (rule) =>
          rule.workspaceId === activeWorkspaceId &&
          (filter === "todas" || rule.status === filter || (filter === "borrador" && rule.status === "test")),
      ),
    [rules, activeWorkspaceId, filter],
  );

  const selected = rules.find((rule) => rule.id === selectedId);

  const stats = useMemo(() => {
    const all = rules.filter((rule) => rule.workspaceId === activeWorkspaceId);
    const active = all.filter((rule) => rule.status === "activa");
    return {
      active: active.length,
      runs: active.reduce((sum, rule) => sum + rule.triggeredCount, 0),
      avgReply: active.length ? Math.round(active.reduce((sum, rule) => sum + rule.replyRate, 0) / active.length) : 0,
    };
  }, [rules, activeWorkspaceId]);

  const updateRule = (id: string, patch: Partial<AutomationRule>) => {
    setRules((previous) => previous.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  };

  const openRule = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
    setTestInput("");
    setTestResult("");
  };

  const toggleActive = (rule: AutomationRule, active: boolean) => {
    updateRule(rule.id, { status: active ? "activa" : "pausada" });
    setToast(active ? "Automatización activada." : "Automatización pausada.");
  };

  const addAction = () => {
    if (!selected) return;
    const action: AutomationAction = {
      id: `ac-${Date.now()}`,
      type: "crear tarea",
      value: "Nuevo seguimiento",
    };
    updateRule(selected.id, { actions: [...selected.actions, action] });
  };

  const updateAction = (actionId: string, patch: Partial<AutomationAction>) => {
    if (!selected) return;
    updateRule(selected.id, {
      actions: selected.actions.map((action) => (action.id === actionId ? { ...action, ...patch } : action)),
    });
  };

  const removeAction = (actionId: string) => {
    if (!selected) return;
    updateRule(selected.id, { actions: selected.actions.filter((action) => action.id !== actionId) });
  };

  const duplicateRule = () => {
    if (!selected) return;
    const copy: AutomationRule = {
      ...selected,
      id: `a-${Date.now()}`,
      name: `${selected.name} (copia)`,
      status: "borrador",
      triggeredCount: 0,
      replyRate: 0,
      conversionEstimate: 0,
      lastExecuted: "Sin ejecutar",
      history: [],
      conditions: selected.conditions.map((condition, index) => ({ ...condition, id: `co-${Date.now()}-${index}` })),
      actions: selected.actions.map((action, index) => ({ ...action, id: `ac-${Date.now()}-${index}` })),
    };
    setRules((previous) => [copy, ...previous]);
    setSelectedId(copy.id);
    setToast("Copia creada como borrador.");
  };

  const createFromPreset = (presetId: string) => {
    const preset = starterPresets.find((item) => item.id === presetId);
    if (!preset) return;
    const created: AutomationRule = {
      id: `a-${Date.now()}`,
      workspaceId: activeWorkspaceId,
      name: preset.title,
      description: preset.description,
      status: "borrador",
      category: "consulta",
      trigger: preset.trigger,
      conditions: [],
      actions: preset.actions.map((action, index) => ({ ...action, id: `ac-${Date.now()}-${index}` })),
      responseMessage: preset.response,
      triggeredCount: 0,
      replyRate: 0,
      conversionEstimate: 0,
      lastExecuted: "Sin ejecutar",
      history: [],
    };
    setRules((previous) => [created, ...previous]);
    setSelectedId(created.id);
    setOpenCreate(false);
    setDrawerOpen(true);
    setToast("Automatización creada. Revisala y activala cuando esté lista.");
  };

  const runTest = () => {
    if (!selected || !testInput.trim()) {
      setToast("Escribí un mensaje o escenario para probar.");
      return;
    }
    const text = testInput.toLowerCase();
    let matched = true;

    if (selected.trigger.type === "palabras clave") {
      matched = selected.trigger.value
        .toLowerCase()
        .split(/[,;]/)
        .map((value) => value.trim())
        .filter(Boolean)
        .some((value) => text.includes(value));
    }

    if (selected.trigger.type === "intent") {
      matched = selected.trigger.value
        .toLowerCase()
        .split(/\s+/)
        .filter((value) => value.length > 3)
        .some((value) => text.includes(value));
    }

    setTestResult(
      matched
        ? `Se ejecutaría: ${selected.actions.map((action) => actionLabels[action.type]).join(" → ")}.`
        : "Este caso no activaría la automatización.",
    );
  };

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Activas</p>
            <p className="mt-2 text-2xl font-bold">{stats.active}</p>
            <p className="mt-1 text-xs text-zinc-500">reglas trabajando ahora</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Ejecuciones</p>
            <p className="mt-2 text-2xl font-bold text-cyan-100">{stats.runs}</p>
            <p className="mt-1 text-xs text-zinc-500">acciones automáticas registradas</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Respuesta</p>
            <p className="mt-2 text-2xl font-bold text-emerald-100">{stats.avgReply}%</p>
            <p className="mt-1 text-xs text-zinc-500">promedio en reglas activas</p>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
            {[
              { value: "todas" as const, label: "Todas" },
              { value: "activa" as const, label: "Activas" },
              { value: "pausada" as const, label: "Pausadas" },
              { value: "borrador" as const, label: "Borradores" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`rounded-lg px-3 py-1.5 ${filter === item.value ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-300 hover:bg-white/10"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Button onClick={() => setOpenCreate(true)} className="bg-emerald-500/30 hover:bg-emerald-500/40">
            <Plus className="mr-1 h-4 w-4" />
            Nueva automatización
          </Button>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          {workspaceRules.length === 0 ? (
            <Card className="p-8 text-center text-sm text-zinc-500 xl:col-span-2">No hay automatizaciones para este filtro.</Card>
          ) : workspaceRules.map((rule) => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => openRule(rule.id)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{rule.name}</p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusTone[rule.status]}`}>{rule.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{rule.description}</p>
                </button>
                <ToggleSwitch checked={rule.status === "activa"} onChange={(value) => toggleActive(rule, value)} />
              </div>

              <button onClick={() => openRule(rule.id)} className="mt-4 block w-full text-left">
                <div className="rounded-xl border border-cyan-300/10 bg-cyan-500/5 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-cyan-300">Cuando</p>
                  <p className="mt-1 text-sm">{triggerLabels[rule.trigger.type]}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{rule.trigger.value}</p>
                </div>

                <div className="mx-5 h-3 border-l border-dashed border-white/20" />

                <div className="rounded-xl border border-emerald-300/10 bg-emerald-500/5 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-emerald-300">Entonces</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {rule.actions.map((action) => (
                      <span key={action.id} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-zinc-300">
                        {actionLabels[action.type]}
                      </span>
                    ))}
                  </div>
                </div>
              </button>

              <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500">
                <span>{rule.triggeredCount} ejecuciones</span>
                <span>{rule.lastExecuted}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Drawer
        open={drawerOpen && Boolean(selected)}
        onClose={() => setDrawerOpen(false)}
        title={selected?.name ?? "Automatización"}
        description="Definí qué pasa y qué debe hacer Waneia."
        width="max-w-xl"
        footer={
          selected ? (
            <div className="flex gap-2">
              <Button onClick={duplicateRule}><Copy className="mr-1 h-4 w-4" />Duplicar</Button>
              <Button
                onClick={() => {
                  updateRule(selected.id, { status: "activa" });
                  setToast("Automatización activada.");
                }}
                className="flex-1 bg-emerald-500/30 hover:bg-emerald-500/40"
              >
                Activar
              </Button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-3">
            <Card className="p-3">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">Nombre</p>
              <input
                value={selected.name}
                onChange={(event) => updateRule(selected.id, { name: event.target.value })}
                className="mt-1 w-full bg-transparent text-base font-semibold outline-none"
              />
              <textarea
                value={selected.description}
                onChange={(event) => updateRule(selected.id, { description: event.target.value })}
                className="mt-2 min-h-12 w-full resize-none bg-transparent text-xs text-zinc-400 outline-none"
              />
            </Card>

            <Card className="border-cyan-300/15 bg-cyan-500/5 p-3">
              <p className="text-[10px] uppercase tracking-wide text-cyan-300">Cuando pasa esto</p>
              <select
                value={selected.trigger.type}
                onChange={(event) =>
                  updateRule(selected.id, {
                    trigger: { ...selected.trigger, type: event.target.value as AutomationTrigger["type"] },
                  })
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-sm"
              >
                <option value="nuevo mensaje">Llega un nuevo mensaje</option>
                <option value="palabras clave">El mensaje contiene palabras</option>
                <option value="intent">Se detecta una intención</option>
                <option value="sin respuesta">No hay respuesta durante</option>
                <option value="cambio de etapa">Cambia una etapa de venta</option>
                <option value="horario">Se cumple un horario</option>
                <option value="segmento">El contacto pertenece a un grupo</option>
              </select>
              <input
                value={selected.trigger.value}
                onChange={(event) => updateRule(selected.id, { trigger: { ...selected.trigger, value: event.target.value } })}
                placeholder="Ej.: 15 minutos, presupuesto, fuera de horario"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <select
                value={selected.category}
                onChange={(event) => updateRule(selected.id, { category: event.target.value as ConversationCategory })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-xs"
              >
                <option value="consulta">Consulta general</option>
                <option value="presupuesto">Venta / presupuesto</option>
                <option value="pedido">Pedido</option>
                <option value="soporte humano">Atención humana</option>
              </select>
            </Card>

            <div className="flex justify-center">
              <span className="h-6 border-l border-dashed border-white/20" />
            </div>

            <Card className="border-emerald-300/15 bg-emerald-500/5 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wide text-emerald-300">Waneia hace esto</p>
                <button onClick={addAction} className="text-xs text-cyan-200">+ acción</button>
              </div>
              <div className="mt-3 space-y-2">
                {selected.actions.map((action) => {
                  const Icon = actionIcons[action.type];
                  return (
                    <div key={action.id} className="grid grid-cols-[30px_150px_1fr_30px] items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <select
                        value={action.type}
                        onChange={(event) => updateAction(action.id, { type: event.target.value as AutomationAction["type"] })}
                        className="rounded-xl border border-white/10 bg-[#0b1023] px-2 py-2 text-xs"
                      >
                        <option value="responder">Enviar mensaje</option>
                        <option value="asignar agente">Asignar responsable</option>
                        <option value="agregar etiqueta">Agregar etiqueta</option>
                        <option value="crear lead">Crear oportunidad</option>
                        <option value="crear tarea">Crear seguimiento</option>
                        <option value="mover etapa">Mover oportunidad</option>
                        <option value="notificar equipo">Avisar al equipo</option>
                      </select>
                      <input
                        value={action.value}
                        onChange={(event) => updateAction(action.id, { value: event.target.value })}
                        className="min-w-0 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs"
                      />
                      <button onClick={() => removeAction(action.id)} className="rounded-lg border border-white/10 bg-white/5 p-1.5">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {selected.actions.some((action) => action.type === "responder") ? (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Mensaje</p>
                  <textarea
                    value={selected.responseMessage}
                    onChange={(event) => updateRule(selected.id, { responseMessage: event.target.value })}
                    className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm"
                  />
                </div>
              ) : null}
            </Card>

            <Card className="p-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <Play className="h-3.5 w-3.5 text-violet-300" />
                Probar antes de activar
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  value={testInput}
                  onChange={(event) => setTestInput(event.target.value)}
                  placeholder="Ej.: Hola, quiero un presupuesto"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
                />
                <Button onClick={runTest}>Probar</Button>
              </div>
              {testResult ? (
                <p className={`mt-2 rounded-lg border p-2 text-xs ${testResult.startsWith("Se ejecutaría") ? "border-emerald-300/20 bg-emerald-500/5 text-emerald-100" : "border-zinc-300/20 bg-white/5 text-zinc-400"}`}>
                  {testResult}
                </p>
              ) : null}
            </Card>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <p className="text-xs font-medium">Automatización activa</p>
                <p className="text-[10px] text-zinc-500">Podés pausarla sin borrar la configuración.</p>
              </div>
              <ToggleSwitch checked={selected.status === "activa"} onChange={(value) => toggleActive(selected, value)} />
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Nueva automatización">
        <p className="text-sm text-zinc-400">Empezá con un caso común y después ajustalo a tu negocio.</p>
        <div className="mt-4 grid gap-2">
          {starterPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => createFromPreset(preset.id)}
              className="rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-cyan-300/20 hover:bg-white/10"
            >
              <p className="text-sm font-semibold">{preset.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{preset.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {preset.actions.map((action, index) => (
                  <span key={index} className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-zinc-400">
                    {actionLabels[action.type]}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
