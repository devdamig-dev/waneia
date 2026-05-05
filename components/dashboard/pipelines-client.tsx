"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Copy, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { usePipelines } from "@/lib/workspace-config";
import { Pipeline, PipelineStageConfig, PipelineStageStatusType } from "@/types/config";

const colorOptions = ["cyan", "sky", "violet", "amber", "emerald", "rose", "zinc"];
const colorChip: Record<string, string> = {
  cyan: "bg-cyan-500/40", sky: "bg-sky-500/40", violet: "bg-violet-500/40",
  amber: "bg-amber-500/40", emerald: "bg-emerald-500/40", rose: "bg-rose-500/40", zinc: "bg-zinc-500/40",
};

export function PipelinesClient() {
  const { pipelines, defaultPipelineId, setPipelines, setDefaultPipelineId } = usePipelines();
  const [selectedId, setSelectedId] = useState<string>(defaultPipelineId);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!pipelines.find((p) => p.id === selectedId)) setSelectedId(pipelines[0]?.id ?? "");
  }, [pipelines, selectedId]);

  const pipeline = pipelines.find((p) => p.id === selectedId);

  const updatePipeline = (id: string, patch: Partial<Pipeline>) =>
    setPipelines((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const updateStage = (pipelineId: string, stageId: string, patch: Partial<PipelineStageConfig>) =>
    setPipelines((prev) =>
      prev.map((p) => (p.id === pipelineId ? { ...p, stages: p.stages.map((s) => (s.id === stageId ? { ...s, ...patch } : s)) } : p)),
    );

  const moveStage = (pipelineId: string, stageId: string, dir: -1 | 1) =>
    setPipelines((prev) =>
      prev.map((p) => {
        if (p.id !== pipelineId) return p;
        const sorted = [...p.stages].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((s) => s.id === stageId);
        if (idx < 0) return p;
        const target = idx + dir;
        if (target < 0 || target >= sorted.length) return p;
        const a = sorted[idx];
        const b = sorted[target];
        return { ...p, stages: p.stages.map((s) => (s.id === a.id ? { ...s, order: b.order } : s.id === b.id ? { ...s, order: a.order } : s)) };
      }),
    );

  const removeStage = (pipelineId: string, stageId: string) =>
    setPipelines((prev) => prev.map((p) => (p.id === pipelineId ? { ...p, stages: p.stages.filter((s) => s.id !== stageId) } : p)));

  const addStage = (pipelineId: string) => {
    setPipelines((prev) =>
      prev.map((p) => {
        if (p.id !== pipelineId) return p;
        const order = (p.stages[p.stages.length - 1]?.order ?? -1) + 1;
        const stage: PipelineStageConfig = {
          id: `st-${Date.now()}`,
          name: "Nueva etapa",
          color: "cyan",
          probability: 30,
          slaTargetMinutes: 240,
          automationTrigger: "—",
          statusType: "abierto",
          order,
        };
        return { ...p, stages: [...p.stages, stage] };
      }),
    );
  };

  const removePipeline = (id: string) => {
    if (pipelines.length === 1) { setToast("Debe existir al menos un pipeline."); return; }
    setPipelines((prev) => prev.filter((p) => p.id !== id));
    if (defaultPipelineId === id) setDefaultPipelineId(pipelines.find((p) => p.id !== id)?.id ?? "");
    setToast("Pipeline eliminado.");
  };

  const duplicatePipeline = (id: string) => {
    const original = pipelines.find((p) => p.id === id);
    if (!original) return;
    const cloned: Pipeline = {
      ...original,
      id: `pl-${Date.now()}`,
      name: `${original.name} (copia)`,
      isDefault: false,
      stages: original.stages.map((s) => ({ ...s, id: `st-${Math.random().toString(36).slice(2, 8)}` })),
    };
    setPipelines((prev) => [...prev, cloned]);
    setSelectedId(cloned.id);
    setToast("Pipeline duplicado.");
  };

  const createPipeline = () => {
    const pipeline: Pipeline = {
      id: `pl-${Date.now()}`,
      name: draft.name || "Nuevo pipeline",
      isDefault: false,
      stages: [
        { id: `st-${Date.now()}-1`, name: "Nuevo", color: "cyan", probability: 10, slaTargetMinutes: 60, automationTrigger: "—", statusType: "abierto", order: 0 },
        { id: `st-${Date.now()}-2`, name: "En curso", color: "amber", probability: 50, slaTargetMinutes: 480, automationTrigger: "—", statusType: "abierto", order: 1 },
        { id: `st-${Date.now()}-3`, name: "Ganado", color: "emerald", probability: 100, slaTargetMinutes: 0, automationTrigger: "—", statusType: "ganado", order: 2 },
        { id: `st-${Date.now()}-4`, name: "Perdido", color: "rose", probability: 0, slaTargetMinutes: 0, automationTrigger: "—", statusType: "perdido", order: 3 },
      ],
    };
    setPipelines((prev) => [...prev, pipeline]);
    setSelectedId(pipeline.id);
    setOpen(false);
    setDraft({ name: "" });
    setToast("Pipeline creado.");
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="p-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Pipelines</p>
            <button onClick={() => setOpen(true)} className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-100"><Plus className="inline h-3 w-3" /> Nuevo</button>
          </div>
          <div className="mt-3 space-y-1">
            {pipelines.map((p) => (
              <button key={p.id} onClick={() => setSelectedId(p.id)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${selectedId === p.id ? "bg-cyan-500/20 text-cyan-100" : "hover:bg-white/10"}`}>
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-[11px] text-zinc-400">{p.stages.length} etapas</p>
                </div>
                {defaultPipelineId === p.id ? <Star className="h-3.5 w-3.5 fill-amber-300/60 text-amber-300" /> : null}
              </button>
            ))}
          </div>
        </Card>

        {pipeline ? (
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Pipeline</p>
                <input value={pipeline.name} onChange={(e) => updatePipeline(pipeline.id, { name: e.target.value })} className="w-full bg-transparent text-xl font-semibold focus:outline-none" />
                <p className="text-[11px] text-zinc-500">{pipeline.stages.length} etapas · ID: {pipeline.id}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setDefaultPipelineId(pipeline.id)} disabled={defaultPipelineId === pipeline.id} className={defaultPipelineId === pipeline.id ? "bg-amber-500/30" : ""}>
                  <Star className={`mr-1 h-4 w-4 ${defaultPipelineId === pipeline.id ? "fill-amber-300/60" : ""}`} /> {defaultPipelineId === pipeline.id ? "Pipeline por defecto" : "Marcar como default"}
                </Button>
                <Button onClick={() => duplicatePipeline(pipeline.id)}><Copy className="mr-1 h-4 w-4" />Duplicar</Button>
                <button onClick={() => removePipeline(pipeline.id)} className="rounded-xl border border-rose-300/30 bg-rose-500/10 px-2 text-rose-100" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            <Card className="mt-3 overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-zinc-400">
                    <th className="p-2">Orden</th>
                    <th className="p-2">Etapa</th>
                    <th className="p-2">Color</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Probabilidad</th>
                    <th className="p-2">SLA (min)</th>
                    <th className="p-2">Disparador automatización</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[...pipeline.stages].sort((a, b) => a.order - b.order).map((s, idx, arr) => (
                    <tr key={s.id} className="hover:bg-white/5">
                      <td className="p-2">
                        <div className="flex flex-col">
                          <button onClick={() => moveStage(pipeline.id, s.id, -1)} disabled={idx === 0} className="rounded border border-white/10 bg-white/5 p-0.5 text-[11px] disabled:opacity-30" aria-label="Subir"><ChevronUp className="h-3 w-3" /></button>
                          <button onClick={() => moveStage(pipeline.id, s.id, 1)} disabled={idx === arr.length - 1} className="mt-0.5 rounded border border-white/10 bg-white/5 p-0.5 text-[11px] disabled:opacity-30" aria-label="Bajar"><ChevronDown className="h-3 w-3" /></button>
                        </div>
                      </td>
                      <td className="p-2"><input value={s.name} onChange={(e) => updateStage(pipeline.id, s.id, { name: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 p-1.5 text-sm" /></td>
                      <td className="p-2">
                        <select value={s.color} onChange={(e) => updateStage(pipeline.id, s.id, { color: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-xs">
                          {colorOptions.map((o) => <option key={o} value={o} className="bg-[#0b1023]">{o}</option>)}
                        </select>
                        <span className={`ml-2 inline-block h-3 w-3 rounded-full ${colorChip[s.color]}`} />
                      </td>
                      <td className="p-2">
                        <select value={s.statusType} onChange={(e) => updateStage(pipeline.id, s.id, { statusType: e.target.value as PipelineStageStatusType })} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-xs">
                          <option value="abierto" className="bg-[#0b1023]">abierto</option>
                          <option value="ganado" className="bg-[#0b1023]">ganado</option>
                          <option value="perdido" className="bg-[#0b1023]">perdido</option>
                        </select>
                      </td>
                      <td className="p-2"><input type="number" min={0} max={100} value={s.probability} onChange={(e) => updateStage(pipeline.id, s.id, { probability: Number(e.target.value) })} className="w-16 rounded-lg border border-white/10 bg-white/5 p-1.5 text-sm" />%</td>
                      <td className="p-2"><input type="number" min={0} value={s.slaTargetMinutes} onChange={(e) => updateStage(pipeline.id, s.id, { slaTargetMinutes: Number(e.target.value) })} className="w-20 rounded-lg border border-white/10 bg-white/5 p-1.5 text-sm" /></td>
                      <td className="p-2"><input value={s.automationTrigger} onChange={(e) => updateStage(pipeline.id, s.id, { automationTrigger: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 p-1.5 text-xs" /></td>
                      <td className="p-2 text-right"><button onClick={() => removeStage(pipeline.id, s.id)} className="rounded-lg border border-white/10 bg-white/5 p-1 text-rose-200 hover:bg-rose-500/10" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => addStage(pipeline.id)} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Plus className="mr-1 h-4 w-4" />Agregar etapa</Button>
              <Button onClick={() => setToast("Pipeline guardado.")}>Guardar cambios</Button>
            </div>

            <Card className="mt-3 p-3 text-xs text-zinc-400">
              Estos pipelines alimentan los cards de Leads. Marcá el pipeline por defecto para que aparezca en el módulo de pipeline kanban.
            </Card>
          </Card>
        ) : null}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo pipeline">
        <FormField label="Nombre del pipeline">
          <input value={draft.name} onChange={(e) => setDraft({ name: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" placeholder="Ej.: Pipeline mayoristas" />
        </FormField>
        <Button onClick={createPipeline} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40">Crear pipeline con etapas por defecto</Button>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
