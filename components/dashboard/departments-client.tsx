"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useBotFlows, useCategories, useDepartments } from "@/lib/workspace-config";
import { teamMembers } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { Department, DepartmentRole } from "@/types/config";

const colorOptions = ["emerald", "cyan", "violet", "amber", "rose", "sky", "zinc"];
const colorChip: Record<string, string> = {
  emerald: "bg-emerald-500/40", cyan: "bg-cyan-500/40", violet: "bg-violet-500/40",
  amber: "bg-amber-500/40", rose: "bg-rose-500/40", sky: "bg-sky-500/40", zinc: "bg-zinc-500/40",
};

const roleLabels: Record<DepartmentRole, string> = {
  responsable: "Responsable",
  supervisor: "Supervisor",
  operador: "Operador",
  lectura: "Solo lectura",
};

const roleStyles: Record<DepartmentRole, string> = {
  responsable: "border-amber-300/40 bg-amber-500/15 text-amber-100",
  supervisor: "border-cyan-300/40 bg-cyan-500/15 text-cyan-100",
  operador: "border-emerald-300/40 bg-emerald-500/15 text-emerald-100",
  lectura: "border-zinc-300/40 bg-zinc-500/15 text-zinc-200",
};

export function DepartmentsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const { departments, setDepartments } = useDepartments();
  const { categories } = useCategories();
  const { flows } = useBotFlows();
  const [selectedId, setSelectedId] = useState<string>(departments[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", color: "cyan", workingHours: "Lun-Vie 09:00-18:00", slaMinutes: 30 });
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
      color: draft.color,
      active: true,
      workingHours: draft.workingHours,
      memberIds: [],
      members: [],
      categoryIds: [],
      slaMinutes: draft.slaMinutes,
      defaultBotId: null,
      routingRule: "",
    };
    setDepartments((prev) => [...prev, dep]);
    setSelectedId(dep.id);
    setOpen(false);
    setDraft({ name: "", description: "", color: "cyan", workingHours: "Lun-Vie 09:00-18:00", slaMinutes: 30 });
    setToast("Departamento creado.");
  };

  const toggleMember = (memberId: string) => {
    if (!department) return;
    const exists = department.members.find((m) => m.memberId === memberId);
    const nextMembers = exists
      ? department.members.filter((m) => m.memberId !== memberId)
      : [...department.members, { memberId, role: "operador" as DepartmentRole }];
    update(department.id, {
      members: nextMembers,
      memberIds: nextMembers.map((m) => m.memberId),
    });
  };

  const setMemberRole = (memberId: string, role: DepartmentRole) => {
    if (!department) return;
    update(department.id, {
      members: department.members.map((m) => (m.memberId === memberId ? { ...m, role } : m)),
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
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${colorChip[d.color] ?? colorChip.cyan}`} />
                  <p className="font-medium flex-1">{d.name}</p>
                  {!d.active ? <span className="text-[10px] text-zinc-500">pausado</span> : null}
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-400">{d.members.length} miembros · SLA {d.slaMinutes}m</p>
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">{department.active ? "Activo" : "Pausado"}</span>
                <ToggleSwitch checked={department.active} onChange={(v) => update(department.id, { active: v })} />
                <button onClick={() => remove(department.id)} className="rounded-xl border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <FormField label="Color">
                <select value={department.color} onChange={(e) => update(department.id, { color: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
                  {colorOptions.map((o) => <option key={o} value={o} className="bg-[#0b1023]">{o}</option>)}
                </select>
              </FormField>
              <FormField label="SLA (min)" hint="Tiempo máximo de respuesta esperado.">
                <input type="number" value={department.slaMinutes} onChange={(e) => update(department.id, { slaMinutes: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
              </FormField>
              <FormField label="Horario" hint="Texto descriptivo para el equipo.">
                <input value={department.workingHours} onChange={(e) => update(department.id, { workingHours: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
              </FormField>
              <FormField label="Bot por defecto" hint="Flujo que atiende cuando no hay operador.">
                <select value={department.defaultBotId ?? ""} onChange={(e) => update(department.id, { defaultBotId: e.target.value || null })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
                  <option value="" className="bg-[#0b1023]">Sin bot</option>
                  {flows.map((f) => <option key={f.id} value={f.id} className="bg-[#0b1023]">{f.name}</option>)}
                </select>
              </FormField>
              <FormField label="Regla de ruteo" hint="Texto descriptivo del enrutamiento.">
                <input value={department.routingRule} onChange={(e) => update(department.id, { routingRule: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" placeholder="category in [presupuesto, pedido]" />
              </FormField>
            </div>

            <Card className="mt-3 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Miembros y roles</p>
              <p className="mt-1 text-[11px] text-zinc-500">Tocá un miembro para incluirlo o quitarlo. Cambiá el rol con el selector.</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {workspaceMembers.length === 0 ? <p className="text-xs text-zinc-500">No hay miembros en este workspace.</p> : workspaceMembers.map((m) => {
                  const assigned = department.members.find((x) => x.memberId === m.id);
                  return (
                    <div key={m.id} className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${assigned ? "border-cyan-300/40 bg-cyan-500/10 text-cyan-100" : "border-white/10 bg-white/5 text-zinc-300"}`}>
                      <button onClick={() => toggleMember(m.id)} className="hover:underline">{m.name} · {m.role}</button>
                      {assigned ? (
                        <select value={assigned.role} onChange={(e) => setMemberRole(m.id, e.target.value as DepartmentRole)} className={`ml-1 rounded-full border px-1.5 py-0 text-[10px] ${roleStyles[assigned.role]}`}>
                          <option value="responsable" className="bg-[#0b1023]">Responsable</option>
                          <option value="supervisor" className="bg-[#0b1023]">Supervisor</option>
                          <option value="operador" className="bg-[#0b1023]">Operador</option>
                          <option value="lectura" className="bg-[#0b1023]">Solo lectura</option>
                        </select>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {department.members.length > 0 ? (
                <div className="mt-3 grid gap-1 md:grid-cols-4 text-[11px]">
                  {(["responsable", "supervisor", "operador", "lectura"] as DepartmentRole[]).map((r) => (
                    <Card key={r} className="p-2">
                      <p className="text-zinc-400">{roleLabels[r]}</p>
                      <p className="mt-1 text-sm font-semibold">{department.members.filter((m) => m.role === r).length}</p>
                    </Card>
                  ))}
                </div>
              ) : null}
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
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Color">
              <select value={draft.color} onChange={(e) => setDraft((p) => ({ ...p, color: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
                {colorOptions.map((o) => <option key={o} value={o} className="bg-[#0b1023]">{o}</option>)}
              </select>
            </FormField>
            <FormField label="SLA (min)"><input type="number" value={draft.slaMinutes} onChange={(e) => setDraft((p) => ({ ...p, slaMinutes: Number(e.target.value) }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Horario"><input value={draft.workingHours} onChange={(e) => setDraft((p) => ({ ...p, workingHours: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          </div>
        </div>
        <Button onClick={create} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40">Crear departamento</Button>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
