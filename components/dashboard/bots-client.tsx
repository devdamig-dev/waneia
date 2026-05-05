"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  Bot,
  ChevronDown,
  ChevronUp,
  Copy,
  Flag,
  GitBranch,
  HelpCircle,
  ListTree,
  MessageSquare,
  Play,
  Plus,
  Tag as TagIcon,
  Timer,
  Trash2,
  UserPlus,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { useBotFlows } from "@/lib/workspace-config";
import { BotFlow, BotFlowStatus, BotNode, BotNodeType } from "@/types/config";

const nodeMeta: Record<BotNodeType, { label: string; icon: typeof MessageSquare; tone: string; helper: string }> = {
  trigger: { label: "Disparador", icon: Zap, tone: "border-cyan-300/40 bg-cyan-500/10 text-cyan-100", helper: "Define qué evento inicia el flujo." },
  message: { label: "Mensaje", icon: MessageSquare, tone: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100", helper: "Envía un mensaje al cliente." },
  question: { label: "Pregunta", icon: HelpCircle, tone: "border-violet-300/40 bg-violet-500/10 text-violet-100", helper: "Hace una pregunta y espera respuesta." },
  condition: { label: "Condición", icon: GitBranch, tone: "border-amber-300/40 bg-amber-500/10 text-amber-100", helper: "Bifurca según una condición." },
  buttons: { label: "Botones", icon: ListTree, tone: "border-violet-300/40 bg-violet-500/10 text-violet-100", helper: "Muestra opciones tappables al cliente." },
  assign: { label: "Asignar a operador", icon: UserPlus, tone: "border-cyan-300/40 bg-cyan-500/10 text-cyan-100", helper: "Asigna la conversación a una cola u operador." },
  tag: { label: "Agregar etiqueta", icon: TagIcon, tone: "border-rose-300/40 bg-rose-500/10 text-rose-100", helper: "Agrega un tag al contacto/lead." },
  create_lead: { label: "Crear lead", icon: Plus, tone: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100", helper: "Crea un lead en el pipeline." },
  wait: { label: "Espera", icon: Timer, tone: "border-zinc-300/40 bg-zinc-500/10 text-zinc-200", helper: "Pausa el flujo durante un tiempo." },
  end: { label: "Fin", icon: Flag, tone: "border-rose-300/40 bg-rose-500/10 text-rose-100", helper: "Cierra el flujo." },
};

const statusTone: Record<BotFlowStatus, string> = {
  borrador: "border-zinc-300/30 bg-zinc-500/10 text-zinc-200",
  activa: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100",
  pausada: "border-amber-300/40 bg-amber-500/10 text-amber-100",
};

const statusLabel: Record<BotFlowStatus, string> = {
  borrador: "Borrador",
  activa: "Activa",
  pausada: "Pausada",
};

export function BotsClient() {
  const { flows, setFlows } = useBotFlows();
  const [selectedId, setSelectedId] = useState<string>(flows[0]?.id ?? "");
  const [openCreate, setOpenCreate] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string>("");
  const [zoom, setZoom] = useState(100);
  const [testInput, setTestInput] = useState("");
  const [testTrace, setTestTrace] = useState<Array<{ nodeId: string; preview: string }>>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (flows.length === 0) {
      setSelectedId("");
      setActiveNodeId("");
    } else if (!flows.find((f) => f.id === selectedId)) {
      setSelectedId(flows[0].id);
      setActiveNodeId(flows[0].nodes[0]?.id ?? "");
    }
  }, [flows, selectedId]);

  const flow = useMemo(() => flows.find((f) => f.id === selectedId), [flows, selectedId]);
  const activeNode = useMemo(() => flow?.nodes.find((n) => n.id === activeNodeId) ?? flow?.nodes[0], [flow, activeNodeId]);

  const updateFlow = (id: string, patch: Partial<BotFlow>) =>
    setFlows((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch, updatedAt: new Date().toISOString() } : f)));

  const updateNode = (flowId: string, nodeId: string, patch: Partial<BotNode>) =>
    setFlows((prev) =>
      prev.map((f) => (f.id === flowId ? { ...f, updatedAt: new Date().toISOString(), nodes: f.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)) } : f)),
    );

  const addNode = (type: BotNodeType) => {
    if (!flow) return;
    const newNode: BotNode = {
      id: `n-${Date.now()}`,
      type,
      label: nodeMeta[type].label,
      body: type === "message" ? "Hola {{nombre}}, ¿en qué te puedo ayudar?" : type === "question" ? "¿Podrías indicarnos tu consulta?" : "",
      options: type === "buttons" || type === "question" ? ["Opción 1", "Opción 2"] : undefined,
    };
    setFlows((prev) => prev.map((f) => (f.id === flow.id ? { ...f, nodes: [...f.nodes, newNode], updatedAt: new Date().toISOString() } : f)));
    setActiveNodeId(newNode.id);
  };

  const moveNode = (flowId: string, nodeId: string, dir: -1 | 1) =>
    setFlows((prev) =>
      prev.map((f) => {
        if (f.id !== flowId) return f;
        const idx = f.nodes.findIndex((n) => n.id === nodeId);
        if (idx < 0) return f;
        const target = idx + dir;
        if (target < 0 || target >= f.nodes.length) return f;
        const nodes = [...f.nodes];
        [nodes[idx], nodes[target]] = [nodes[target], nodes[idx]];
        return { ...f, nodes, updatedAt: new Date().toISOString() };
      }),
    );

  const removeNode = (flowId: string, nodeId: string) => {
    setFlows((prev) => prev.map((f) => (f.id === flowId ? { ...f, nodes: f.nodes.filter((n) => n.id !== nodeId), updatedAt: new Date().toISOString() } : f)));
  };

  const duplicateFlow = (id: string) => {
    const f = flows.find((x) => x.id === id);
    if (!f) return;
    const cloned: BotFlow = {
      ...f,
      id: `bf-${Date.now()}`,
      name: `${f.name} (copia)`,
      status: "borrador",
      updatedAt: new Date().toISOString(),
      nodes: f.nodes.map((n) => ({ ...n, id: `n-${Math.random().toString(36).slice(2, 8)}` })),
    };
    setFlows((prev) => [cloned, ...prev]);
    setSelectedId(cloned.id);
    setToast("Flujo duplicado como borrador.");
  };

  const removeFlow = (id: string) => {
    setFlows((prev) => prev.filter((f) => f.id !== id));
    setToast("Flujo eliminado.");
  };

  const createFlow = (data: { name: string; trigger: string }) => {
    const flow: BotFlow = {
      id: `bf-${Date.now()}`,
      name: data.name || "Nuevo flujo",
      description: "Flujo creado desde el constructor.",
      status: "borrador",
      trigger: data.trigger || "Mensaje nuevo",
      nodes: [
        { id: "n-trigger", type: "trigger", label: "Disparador", body: data.trigger || "Mensaje nuevo del cliente." },
        { id: "n-msg", type: "message", label: "Saludo inicial", body: "¡Hola! ¿En qué te puedo ayudar?" },
        { id: "n-end", type: "end", label: "Fin", body: "Cierra el flujo." },
      ],
      updatedAt: new Date().toISOString(),
    };
    setFlows((prev) => [flow, ...prev]);
    setSelectedId(flow.id);
    setOpenCreate(false);
    setToast("Flujo creado.");
  };

  const runTest = () => {
    if (!flow) return;
    if (!testInput.trim()) {
      setToast("Ingresá un mensaje de prueba.");
      return;
    }
    const trace: Array<{ nodeId: string; preview: string }> = [];
    let stop = false;
    flow.nodes.forEach((n) => {
      if (stop) return;
      if (n.type === "trigger") trace.push({ nodeId: n.id, preview: `Trigger: "${testInput}"` });
      else if (n.type === "message") trace.push({ nodeId: n.id, preview: `Bot: ${n.body}` });
      else if (n.type === "question") trace.push({ nodeId: n.id, preview: `Bot pregunta: ${n.body}` });
      else if (n.type === "buttons") trace.push({ nodeId: n.id, preview: `Bot opciones: ${(n.options ?? []).join(" · ")}` });
      else if (n.type === "condition") trace.push({ nodeId: n.id, preview: `Condición evaluada: ${(n.options ?? []).join(" / ")}` });
      else if (n.type === "assign") { trace.push({ nodeId: n.id, preview: `→ Asigna: ${n.body}` }); stop = true; }
      else if (n.type === "tag") trace.push({ nodeId: n.id, preview: `Etiqueta: ${n.body}` });
      else if (n.type === "create_lead") trace.push({ nodeId: n.id, preview: `Crea lead: ${n.body}` });
      else if (n.type === "wait") trace.push({ nodeId: n.id, preview: `Espera ${n.body}` });
      else if (n.type === "end") { trace.push({ nodeId: n.id, preview: "Fin del flujo" }); stop = true; }
    });
    setTestTrace(trace);
  };

  const empty = flows.length === 0;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="p-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Flujos de bot</p>
            <button onClick={() => setOpenCreate(true)} className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-100"><Plus className="inline h-3 w-3" /> Nuevo</button>
          </div>
          <div className="mt-3 space-y-1">
            {flows.length === 0 ? <p className="px-3 py-4 text-center text-xs text-zinc-500">Sin flujos creados.</p> : flows.map((f) => (
              <button key={f.id} onClick={() => setSelectedId(f.id)} className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${selectedId === f.id ? "bg-cyan-500/20 text-cyan-100" : "hover:bg-white/10"}`}>
                <p className="font-medium">{f.name}</p>
                <p className="text-[11px] text-zinc-400">{f.nodes.length} nodos · {statusLabel[f.status]}</p>
              </button>
            ))}
          </div>
        </Card>

        {empty ? (
          <Card className="p-10 text-center">
            <Workflow className="mx-auto h-10 w-10 text-zinc-500" />
            <p className="mt-3 text-lg font-semibold">Todavía no creaste ningún flujo</p>
            <p className="mt-1 text-sm text-zinc-400">Construí flujos visuales para automatizar primer respuesta, calificación y derivación de tus conversaciones.</p>
            <Button onClick={() => setOpenCreate(true)} className="mt-4 bg-emerald-500/30 hover:bg-emerald-500/40"><Plus className="mr-1 h-4 w-4" />Crear primer flujo</Button>
          </Card>
        ) : flow ? (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <input value={flow.name} onChange={(e) => updateFlow(flow.id, { name: e.target.value })} className="w-full bg-transparent text-xl font-semibold focus:outline-none" />
                  <input value={flow.description} onChange={(e) => updateFlow(flow.id, { description: e.target.value })} className="mt-1 w-full bg-transparent text-xs text-zinc-400 focus:outline-none" />
                  <FormField label="Disparador" hint="Evento que inicia el flujo automáticamente.">
                    <input value={flow.trigger} onChange={(e) => updateFlow(flow.id, { trigger: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm" />
                  </FormField>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusTone[flow.status]}`}>{statusLabel[flow.status]}</span>
                  <div className="flex gap-1">
                    <Button onClick={() => updateFlow(flow.id, { status: "activa" })} className="bg-emerald-500/30 hover:bg-emerald-500/40">Activar</Button>
                    <Button onClick={() => updateFlow(flow.id, { status: "pausada" })} className="bg-amber-500/30 hover:bg-amber-500/40">Pausar</Button>
                    <Button onClick={() => duplicateFlow(flow.id)}><Copy className="mr-1 h-4 w-4" />Duplicar</Button>
                    <button onClick={() => removeFlow(flow.id)} className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-2 text-rose-100" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
              <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Constructor de flujo</p>
                  <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1 text-[11px]">
                    <button onClick={() => setZoom((z) => Math.max(80, z - 10))} className="rounded px-2">−</button>
                    <span className="px-1 text-zinc-400">{zoom}%</span>
                    <button onClick={() => setZoom((z) => Math.min(120, z + 10))} className="rounded px-2">+</button>
                  </div>
                </div>
                <div className="mt-3 max-h-[480px] space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3" style={{ fontSize: `${zoom * 0.01}rem` }}>
                  {flow.nodes.map((node, idx) => {
                    const meta = nodeMeta[node.type];
                    const Icon = meta.icon;
                    const isActive = activeNode?.id === node.id;
                    return (
                      <div key={node.id}>
                        <Card onClick={() => setActiveNodeId(node.id)} className={`group cursor-pointer p-3 transition ${isActive ? "border-cyan-300/40 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <span className={`rounded-lg border px-1.5 py-0.5 text-[10px] ${meta.tone}`}><Icon className="inline h-3 w-3" /> {meta.label}</span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium">{node.label}</p>
                                <p className="line-clamp-2 text-[11px] text-zinc-400">{node.body}</p>
                                {node.options && node.options.length > 0 ? (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {node.options.map((o) => <span key={o} className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-300">{o}</span>)}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); moveNode(flow.id, node.id, -1); }} disabled={idx === 0} className="rounded border border-white/10 bg-white/5 p-1 text-[11px] disabled:opacity-30" aria-label="Subir"><ChevronUp className="h-3 w-3" /></button>
                              <button onClick={(e) => { e.stopPropagation(); moveNode(flow.id, node.id, 1); }} disabled={idx === flow.nodes.length - 1} className="rounded border border-white/10 bg-white/5 p-1 text-[11px] disabled:opacity-30" aria-label="Bajar"><ChevronDown className="h-3 w-3" /></button>
                              {node.type !== "trigger" ? (
                                <button onClick={(e) => { e.stopPropagation(); removeNode(flow.id, node.id); }} className="rounded border border-white/10 bg-white/5 p-1 text-[11px] text-rose-200" aria-label="Eliminar"><X className="h-3 w-3" /></button>
                              ) : null}
                            </div>
                          </div>
                        </Card>
                        {idx < flow.nodes.length - 1 ? <ArrowDown className="mx-auto my-1 h-4 w-4 text-zinc-600" /> : null}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-400">Agregar bloque</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(Object.keys(nodeMeta) as BotNodeType[]).filter((t) => t !== "trigger").map((t) => {
                      const Icon = nodeMeta[t].icon;
                      return (
                        <button key={t} onClick={() => addNode(t)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] hover:bg-white/10"><Icon className="h-3 w-3" />{nodeMeta[t].label}</button>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                {activeNode ? (
                  <Card className="p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-400">Edición de bloque</p>
                    <p className="mt-1 text-sm font-semibold">{nodeMeta[activeNode.type].label}</p>
                    <p className="text-[11px] text-zinc-400">{nodeMeta[activeNode.type].helper}</p>
                    <div className="mt-3 grid gap-2">
                      <FormField label="Etiqueta interna">
                        <input value={activeNode.label} onChange={(e) => updateNode(flow.id, activeNode.id, { label: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
                      </FormField>
                      <FormField label="Contenido">
                        <textarea value={activeNode.body} onChange={(e) => updateNode(flow.id, activeNode.id, { body: e.target.value })} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
                      </FormField>
                      {(activeNode.type === "buttons" || activeNode.type === "question" || activeNode.type === "condition") ? (
                        <FormField label="Opciones / ramas (separadas por coma)">
                          <input value={(activeNode.options ?? []).join(", ")} onChange={(e) => updateNode(flow.id, activeNode.id, { options: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
                        </FormField>
                      ) : null}
                    </div>
                  </Card>
                ) : null}

                <Card className="p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-400 inline-flex items-center gap-1"><Bot className="h-3.5 w-3.5" /> Probar bot</p>
                  <p className="mt-1 text-[11px] text-zinc-400">Escribí un mensaje como cliente y mirá la traza simulada.</p>
                  <div className="mt-2 flex gap-2">
                    <input value={testInput} onChange={(e) => setTestInput(e.target.value)} placeholder="Hola, ¿pueden enviarme precio?" className="flex-1 rounded-xl border border-white/10 bg-white/5 p-2 text-sm" />
                    <Button onClick={runTest} className="bg-cyan-500/30 hover:bg-cyan-500/40"><Play className="mr-1 h-4 w-4" />Probar</Button>
                  </div>
                  {testTrace.length > 0 ? (
                    <div className="mt-3 space-y-1 rounded-lg border border-white/10 bg-black/30 p-3 text-xs">
                      {testTrace.map((t, i) => <p key={i} className="text-zinc-200">{i + 1}. {t.preview}</p>)}
                    </div>
                  ) : null}
                </Card>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Nuevo flujo de bot">
        <CreateFlowForm onCreate={createFlow} />
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}

function CreateFlowForm({ onCreate }: { onCreate: (data: { name: string; trigger: string }) => void }) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("Mensaje nuevo del cliente");
  return (
    <div className="grid gap-3">
      <FormField label="Nombre del flujo">
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
      </FormField>
      <FormField label="Disparador" hint="Evento que dispara el flujo. Ej: 'Mensaje nuevo', 'Lead movido a Ganado +7d'.">
        <input value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
      </FormField>
      <Button onClick={() => onCreate({ name, trigger })} className="bg-emerald-500/30 hover:bg-emerald-500/40">Crear flujo</Button>
    </div>
  );
}
