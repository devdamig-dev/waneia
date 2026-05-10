"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { useCategories, useTags } from "@/lib/workspace-config";
import { Category, TagItem } from "@/types/config";

const colorOptions = ["cyan", "emerald", "violet", "amber", "rose", "sky", "zinc"];
const colorChip: Record<string, string> = {
  cyan: "bg-cyan-500/40", emerald: "bg-emerald-500/40", violet: "bg-violet-500/40",
  amber: "bg-amber-500/40", rose: "bg-rose-500/40", sky: "bg-sky-500/40", zinc: "bg-zinc-500/40",
};
const iconOptions = ["DollarSign", "Package", "MessageCircle", "LifeBuoy", "AlertTriangle", "Heart", "Star", "Tag", "Bot", "Bell"];

export function CategoriesClient() {
  const { categories, setCategories } = useCategories();
  const { tags, setTags } = useTags();
  const [open, setOpen] = useState(false);
  const [openTag, setOpenTag] = useState(false);
  const [draft, setDraft] = useState({ name: "", color: "cyan", icon: "Tag" });
  const [draftTag, setDraftTag] = useState<{ name: string; color: string; appliesTo: TagItem["appliesTo"] }>({ name: "", color: "violet", appliesTo: ["conversaciones"] });
  const [toast, setToast] = useState("");

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  const move = (id: string, dir: -1 | 1) => {
    setCategories((prev) => {
      const next = [...prev].sort((a, b) => a.order - b.order);
      const idx = next.findIndex((c) => c.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx].order, next[target].order] = [next[target].order, next[idx].order];
      return next;
    });
  };

  const update = (id: string, patch: Partial<Category>) => setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id: string) => { setCategories((prev) => prev.filter((c) => c.id !== id)); setToast("Categoría eliminada."); };
  const setDefault = (id: string) => { setCategories((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id }))); setToast("Categoría por defecto actualizada."); };

  const create = () => {
    const cat: Category = {
      id: `cat-${Date.now()}`,
      name: draft.name || "Nueva categoría",
      color: draft.color,
      icon: draft.icon,
      isDefault: false,
      order: categories.length,
      slaMinutes: 30,
      defaultPriority: "media",
      automationRef: "—",
      usage: { conversations: 0, leads: 0, automations: 0, campaigns: 0 },
    };
    setCategories((prev) => [...prev, cat]);
    setOpen(false);
    setDraft({ name: "", color: "cyan", icon: "Tag" });
    setToast("Categoría creada.");
  };

  const createTag = () => {
    if (!draftTag.name.trim()) { setToast("Nombre vacío."); return; }
    const t: TagItem = { id: `tg-${Date.now()}`, name: draftTag.name.trim(), color: draftTag.color, appliesTo: draftTag.appliesTo };
    setTags((prev) => [...prev, t]);
    setOpenTag(false);
    setDraftTag({ name: "", color: "violet", appliesTo: ["conversaciones"] });
    setToast("Etiqueta creada.");
  };

  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Categorías</p><p className="mt-1 text-2xl font-bold">{categories.length}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Por defecto</p><p className="mt-1 text-lg font-semibold">{categories.find((c) => c.isDefault)?.name ?? "—"}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Etiquetas</p><p className="mt-1 text-2xl font-bold">{tags.length}</p></Card>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Categorías</h3>
          <p className="text-xs text-zinc-400">Se usan para clasificar conversaciones, leads y campañas. Reordená con flechas para priorizar.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Plus className="mr-1 h-4 w-4" />Nueva categoría</Button>
      </div>

      <Card className="mt-3 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-zinc-400">
              <th className="p-3">Orden</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Color</th>
              <th className="p-3">SLA (min)</th>
              <th className="p-3">Prioridad</th>
              <th className="p-3">Automatización por defecto</th>
              <th className="p-3">Uso</th>
              <th className="p-3">Default</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sorted.map((c, idx) => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="p-2">
                  <div className="flex flex-col">
                    <button onClick={() => move(c.id, -1)} disabled={idx === 0} className="rounded border border-white/10 bg-white/5 p-0.5 text-[11px] disabled:opacity-30" aria-label="Subir"><ChevronUp className="h-3 w-3" /></button>
                    <button onClick={() => move(c.id, 1)} disabled={idx === sorted.length - 1} className="mt-0.5 rounded border border-white/10 bg-white/5 p-0.5 text-[11px] disabled:opacity-30" aria-label="Bajar"><ChevronDown className="h-3 w-3" /></button>
                  </div>
                </td>
                <td className="p-2"><input value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 p-1.5 text-sm" /></td>
                <td className="p-2">
                  <select value={c.color} onChange={(e) => update(c.id, { color: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-xs">
                    {colorOptions.map((o) => <option key={o} value={o} className="bg-[#0b1023]">{o}</option>)}
                  </select>
                  <span className={`ml-2 inline-block h-3 w-3 rounded-full ${colorChip[c.color]}`} />
                </td>
                <td className="p-2"><input type="number" value={c.slaMinutes} onChange={(e) => update(c.id, { slaMinutes: Number(e.target.value) })} className="w-16 rounded-lg border border-white/10 bg-white/5 p-1.5 text-sm" /></td>
                <td className="p-2">
                  <select value={c.defaultPriority} onChange={(e) => update(c.id, { defaultPriority: e.target.value as "alta" | "media" | "baja" })} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-xs">
                    <option value="alta" className="bg-[#0b1023]">alta</option>
                    <option value="media" className="bg-[#0b1023]">media</option>
                    <option value="baja" className="bg-[#0b1023]">baja</option>
                  </select>
                </td>
                <td className="p-2"><input value={c.automationRef} onChange={(e) => update(c.id, { automationRef: e.target.value })} className="w-56 rounded-lg border border-white/10 bg-white/5 p-1.5 text-xs" placeholder="Plantilla / asignar / etiqueta" /></td>
                <td className="p-2 text-[11px] text-zinc-400">conv {c.usage.conversations} · leads {c.usage.leads} · aut {c.usage.automations}</td>
                <td className="p-2">
                  <button onClick={() => setDefault(c.id)} aria-label="Marcar default" className={`rounded-lg border px-2 py-1 text-[11px] ${c.isDefault ? "border-amber-300/40 bg-amber-500/10 text-amber-100" : "border-white/10 bg-white/5 text-zinc-400"}`}>
                    <Star className={`inline h-3.5 w-3.5 ${c.isDefault ? "fill-amber-300/60" : ""}`} />
                  </button>
                </td>
                <td className="p-2 text-right"><button onClick={() => remove(c.id)} className="rounded-lg border border-white/10 bg-white/5 p-1 text-rose-200 hover:bg-rose-500/10" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-4 p-3 text-xs text-zinc-400">
        Las categorías se sincronizan con Conversaciones, Leads, Automatizaciones y Campañas.
        Para configurar pipelines y stages usá <Link href="/dashboard/configuracion/pipelines" className="text-cyan-200 underline">/configuración/pipelines</Link>.
      </Card>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Etiquetas</h3>
          <p className="text-xs text-zinc-400">Etiquetas reutilizables para conversaciones, leads y contactos.</p>
        </div>
        <Button onClick={() => setOpenTag(true)} className="bg-cyan-500/30 hover:bg-cyan-500/40"><Plus className="mr-1 h-4 w-4" />Nueva etiqueta</Button>
      </div>

      <Card className="mt-3 p-3">
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <div key={t.id} className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${colorChip[t.color]}/40 border-white/10`}>
              <span>#{t.name}</span>
              <span className="text-[10px] text-zinc-200/80">{t.appliesTo.join(", ")}</span>
              <button onClick={() => { setTags((prev) => prev.filter((x) => x.id !== t.id)); setToast("Etiqueta eliminada."); }} className="text-zinc-200 hover:text-rose-100" aria-label="Eliminar">✕</button>
            </div>
          ))}
          {tags.length === 0 ? <p className="text-xs text-zinc-500">Sin etiquetas creadas.</p> : null}
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva categoría">
        <div className="grid gap-3">
          <FormField label="Nombre"><input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Color">
              <select value={draft.color} onChange={(e) => setDraft((p) => ({ ...p, color: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
                {colorOptions.map((o) => <option key={o} value={o} className="bg-[#0b1023]">{o}</option>)}
              </select>
            </FormField>
            <FormField label="Icono">
              <select value={draft.icon} onChange={(e) => setDraft((p) => ({ ...p, icon: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
                {iconOptions.map((o) => <option key={o} value={o} className="bg-[#0b1023]">{o}</option>)}
              </select>
            </FormField>
          </div>
        </div>
        <Button onClick={create} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40">Crear</Button>
      </Modal>

      <Modal open={openTag} onClose={() => setOpenTag(false)} title="Nueva etiqueta">
        <div className="grid gap-3">
          <FormField label="Nombre"><input value={draftTag.name} onChange={(e) => setDraftTag((p) => ({ ...p, name: e.target.value }))} placeholder="alta-intencion" className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          <FormField label="Color">
            <select value={draftTag.color} onChange={(e) => setDraftTag((p) => ({ ...p, color: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
              {colorOptions.map((o) => <option key={o} value={o} className="bg-[#0b1023]">{o}</option>)}
            </select>
          </FormField>
          <FormField label="Aplica a">
            <div className="flex flex-wrap gap-2">
              {(["conversaciones", "leads", "contactos"] as TagItem["appliesTo"]).map((scope) => (
                <button key={scope} onClick={() => setDraftTag((p) => ({ ...p, appliesTo: p.appliesTo.includes(scope) ? p.appliesTo.filter((s) => s !== scope) : [...p.appliesTo, scope] }))} className={`rounded-full border px-3 py-1 text-xs ${draftTag.appliesTo.includes(scope) ? "border-cyan-300/40 bg-cyan-500/10 text-cyan-100" : "border-white/10 bg-white/5 text-zinc-300"}`}>{scope}</button>
              ))}
            </div>
          </FormField>
        </div>
        <Button onClick={createTag} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40">Crear</Button>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
