"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { useBotFlows, useCategories, useDepartments } from "@/lib/workspace-config";
import { teamMembers } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { Department } from "@/types/config";

export function DepartmentsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const { departments, setDepartments } = useDepartments();
  const { categories } = useCategories();
  const { flows } = useBotFlows();
  const [selectedId, setSelectedId] = useState<string>(departments[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", slaMinutes: 30 });
  const [toast, setToast] = useState("");

  const workspaceMembers = useMemo(() => teamMembers.filter((m) => m.workspaceId === activeWorkspaceId), [activeWorkspaceId]);
  const department = departments.find((d) => d.id === selectedId);

  const update = (id: string, patch: Partial<Department>) =>
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const remove = (id: string) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    if (selectedId === id) setSelectedId(departments.find((d) => d.id !== id)?.id ?? "");
    setToast("Departamento eliminado.");
  };

  const create = () => {
    const dep: Department = {
      id: `dep-${Date.now()}`,
      name: draft.name || "Nuevo departamento",
      description: draft.description,
      memberIds: [],
      categoryIds: [],
      slaMinutes: draft.slaMinutes,
      defaultBotId: null,
      routingRule: "",
    };
    setDepartments((prev) => [...prev, dep]);
    setSelectedId(dep.id);
    setOpen(false);
    setDraft({ name: "", description: "", slaMinutes: 30 });
    setToast("Departamento creado.");
  };

  const toggleMember = (id: string) => {
    if (!department) return;
    update(department.id, {
      memberIds: department.memberIds.includes(id) ? department.memberIds.filter((m) => m !== id) : [...department.memberIds, id],
    });
  };

  const toggleCategory = (id: string) => {
    if (!department) return;
    update(department.id, {
      categoryIds: department.categoryIds.includes(id) ? department.categoryIds.filter((c) => c !== id) : [...department.categoryIds, id],
    });
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="p-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Departamentos</p>
            <button onClick={() => setOpen(true)} className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-100"><Plus className="inline h-3 w-3" /> Nuevo</button>
          </div>
          <div className="mt-3 space-y-1">
            {departments.length === 0 ? <p className="px-3 py-4 text-center text-xs text-zinc-500">Sin departamentos creados.</p> : departments.map((d) => (
              <button key={d.id} onClick={() => setSelectedId(d.id)} className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${selectedId === d.id ? "bg-cyan-500/20 text-cyan-100" : "hover:bg-white/10"}`}>
                <p className="font-medium">{d.name}</p>
                <p className="text-[11px] text-zinc-400">{d.memberIds.length} miembros · SLA {d.slaMinutes}m</p>
              </button>
            ))}
          </div>
        </Card>

        {department ? (
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Departamento</p>
                <input value={department.name} onChange={(e) => update(department.id, { name: e.target.value })} className="w-full bg-transparent text-xl font-semibold focus:outline-none" />
                <input value={department.description} onChange={(e) => update(department.id, { description: e.target.value })} className="mt-1 w-full bg-transparent text-xs text-zinc-400 focus:outline-none" placeholder="Descripción del departamento" />
              </div>
              <button onClick={() => remove(department.id)} className="rounded-xl border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <FormField label="SLA (min)" hint="Tiempo máximo de respuesta esperado.">
                <input type="number" value={department.slaMinutes} onChange={(e) => update(department.id, { slaMinutes: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
              </FormField>
              <FormField label="Bot por defecto" hint="Flujo que atiende a este departamento si no hay operador disponible.">
                <select value={department.defaultBotId ?? ""} onChange={(e) => update(department.id, { defaultBotId: e.target.value || null })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
                  <option value="" className="bg-[#0b1023]">Sin bot</option>
                  {flows.map((f) => <option key={f.id} value={f.id} className="bg-[#0b1023]">{f.name}</option>)}
                </select>
              </FormField>
            </div>

            <FormField label="Regla de ruteo" hint="Texto descriptivo de cómo se enrutan las conversaciones.">
              <input value={department.routingRule} onChange={(e) => update(department.id, { routingRule: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" placeholder="category in [presupuesto, pedido]" />
            </FormField>

            <Card className="mt-3 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Miembros asignados</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {workspaceMembers.length === 0 ? <p className="text-xs text-zinc-500">No hay miembros en este workspace.</p> : workspaceMembers.map((m) => (
                  <button key={m.id} onClick={() => toggleMember(m.id)} className={`rounded-full border px-3 py-1 text-xs ${department.memberIds.includes(m.id) ? "border-cyan-300/40 bg-cyan-500/10 text-cyan-100" : "border-white/10 bg-white/5 text-zinc-300"}`}>
                    {m.name} · {m.role}
                  </button>
                ))}
              </div>
            </Card>

            <Card className="mt-3 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Categorías que recibe</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button key={c.id} onClick={() => toggleCategory(c.id)} className={`rounded-full border px-3 py-1 text-xs ${department.categoryIds.includes(c.id) ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100" : "border-white/10 bg-white/5 text-zinc-300"}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </Card>
          </Card>
        ) : null}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo departamento">
        <div className="grid gap-3">
          <FormField label="Nombre"><input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" placeholder="Ej.: Postventa" /></FormField>
          <FormField label="Descripción"><input value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          <FormField label="SLA (min)"><input type="number" value={draft.slaMinutes} onChange={(e) => setDraft((p) => ({ ...p, slaMinutes: Number(e.target.value) }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
        </div>
        <Button onClick={create} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40">Crear departamento</Button>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
