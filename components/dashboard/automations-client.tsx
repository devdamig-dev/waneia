"use client";

import { useMemo, useState } from "react";
import { CategoryBadge } from "@/components/dashboard/category-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { automationRules } from "@/data/mock-data";
import { AutomationRule, ConversationCategory } from "@/types/entities";

const triggerOptions = [
  "precio / presupuesto",
  "estado del pedido",
  "consulta general",
  "derivación a asesor",
];

export function AutomationsClient() {
  const [rules, setRules] = useState<AutomationRule[]>(automationRules);
  const [selectedId, setSelectedId] = useState(rules[0]?.id ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const selected = useMemo(() => rules.find((rule) => rule.id === selectedId) ?? rules[0], [rules, selectedId]);

  const [draft, setDraft] = useState({
    name: selected?.name ?? "",
    trigger: selected?.trigger ?? triggerOptions[0],
    action: selected?.action ?? "",
    confidence: selected?.confidence ?? 90,
    category: selected?.category ?? ("consulta" as ConversationCategory),
    active: selected?.active ?? true,
  });

  const [newRule, setNewRule] = useState({
    name: "",
    trigger: triggerOptions[0],
    action: "",
    category: "consulta" as ConversationCategory,
  });

  const selectRule = (id: string) => {
    const rule = rules.find((item) => item.id === id);
    if (!rule) return;
    setSelectedId(id);
    setEditing(false);
    setDraft(rule);
  };

  const saveRule = () => {
    if (!selected) return;
    setSaving(true);
    setTimeout(() => {
      setRules((prev) => prev.map((rule) => (rule.id === selected.id ? { ...rule, ...draft } : rule)));
      setSaving(false);
      setEditing(false);
      setToast("Automatización actualizada correctamente.");
    }, 700);
  };

  const createRule = () => {
    setCreating(true);
    setTimeout(() => {
      const next: AutomationRule = {
        id: `a${rules.length + 1}`,
        name: newRule.name || `Nueva regla ${rules.length + 1}`,
        trigger: newRule.trigger,
        action: newRule.action || "Responder con mensaje inicial y solicitar más contexto.",
        active: true,
        category: newRule.category,
        confidence: 85,
      };
      setRules((prev) => [next, ...prev]);
      setSelectedId(next.id);
      setDraft(next);
      setNewRule({ name: "", trigger: triggerOptions[0], action: "", category: "consulta" });
      setCreating(false);
      setOpenCreate(false);
      setToast("Nueva automatización creada.");
    }, 900);
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-end">
        <Button className="bg-emerald-500/20 hover:bg-emerald-500/30" onClick={() => setOpenCreate(true)}>
          Crear automatización
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {rules.map((rule) => (
            <Card
              key={rule.id}
              className={`cursor-pointer p-5 transition hover:-translate-y-0.5 hover:bg-white/10 ${selected?.id === rule.id ? "border-cyan-300/35 bg-cyan-500/10" : ""}`}
              onClick={() => selectRule(rule.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{rule.name}</h3>
                <span className={`rounded-full px-2 py-1 text-xs ${rule.active ? "bg-emerald-500/20 text-emerald-100" : "bg-zinc-500/20 text-zinc-300"}`}>
                  {rule.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{rule.trigger}</p>
              <div className="mt-3 flex items-center justify-between">
                <CategoryBadge category={rule.category} />
                <span className="text-xs text-cyan-200">Confianza {rule.confidence}%</span>
              </div>
            </Card>
          ))}
        </div>

        {selected ? (
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Detalle de automatización</h3>
              <Button onClick={() => setEditing((v) => !v)}>{editing ? "Cancelar" : "Editar"}</Button>
            </div>

            <div className="space-y-3 text-sm">
              <FormField label="Nombre">
                <input
                  disabled={!editing}
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 disabled:opacity-80"
                />
              </FormField>
              <FormField label="Trigger">
                <select
                  disabled={!editing}
                  value={draft.trigger}
                  onChange={(e) => setDraft((prev) => ({ ...prev, trigger: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 disabled:opacity-80"
                >
                  {triggerOptions.map((option) => (
                    <option key={option} value={option} className="bg-[#0b1023]">
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Acción">
                <textarea
                  disabled={!editing}
                  value={draft.action}
                  onChange={(e) => setDraft((prev) => ({ ...prev, action: e.target.value }))}
                  className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 disabled:opacity-80"
                />
              </FormField>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div>
                  <p className="text-sm">Estado</p>
                  <p className="text-xs text-zinc-400">Activar o pausar automatización</p>
                </div>
                <ToggleSwitch checked={draft.active} onChange={(checked) => setDraft((prev) => ({ ...prev, active: checked }))} />
              </div>
              <FormField label="Confianza IA (%)">
                <input
                  type="number"
                  min={50}
                  max={100}
                  disabled={!editing}
                  value={draft.confidence}
                  onChange={(e) => setDraft((prev) => ({ ...prev, confidence: Number(e.target.value || 0) }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 disabled:opacity-80"
                />
              </FormField>
            </div>

            <Button onClick={saveRule} disabled={!editing || saving} className="mt-4 w-full bg-cyan-500/20 hover:bg-cyan-500/30">
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </Card>
        ) : null}
      </div>

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Crear automatización">
        <div className="space-y-3">
          <FormField label="Nombre">
            <input value={newRule.name} onChange={(e) => setNewRule((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
          </FormField>
          <FormField label="Trigger">
            <select value={newRule.trigger} onChange={(e) => setNewRule((prev) => ({ ...prev, trigger: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
              {triggerOptions.map((option) => (
                <option key={option} value={option} className="bg-[#0b1023]">{option}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Acción">
            <textarea value={newRule.action} onChange={(e) => setNewRule((prev) => ({ ...prev, action: e.target.value }))} className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
          </FormField>
          <FormField label="Categoría">
            <select value={newRule.category} onChange={(e) => setNewRule((prev) => ({ ...prev, category: e.target.value as ConversationCategory }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
              <option value="presupuesto" className="bg-[#0b1023]">presupuesto</option>
              <option value="pedido" className="bg-[#0b1023]">pedido</option>
              <option value="consulta" className="bg-[#0b1023]">consulta</option>
              <option value="soporte humano" className="bg-[#0b1023]">soporte humano</option>
            </select>
          </FormField>
        </div>
        <Button onClick={createRule} disabled={creating} className="mt-4 w-full bg-emerald-500/20 hover:bg-emerald-500/30">
          {creating ? "Creando..." : "Guardar automatización"}
        </Button>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
