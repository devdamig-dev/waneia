"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useCategories, useConfigurableTemplates } from "@/lib/workspace-config";
import { ConfigurableTemplate } from "@/types/config";

const variableHints = ["nombre", "negocio", "pedido", "fecha", "producto", "precio", "agente"];

export function TemplatesClient() {
  const { templates, setTemplates } = useConfigurableTemplates();
  const { categories } = useCategories();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("todas");
  const [filterCh, setFilterCh] = useState<"todos" | "whatsapp" | "general">("todos");
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => templates.filter((t) => {
    if (filterCat !== "todas" && t.category !== filterCat) return false;
    if (filterCh !== "todos" && t.channel !== filterCh) return false;
    if (search && !`${t.name} ${t.body} ${t.shortcut ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [templates, filterCat, filterCh, search]);

  const selected = templates.find((t) => t.id === selectedId) ?? filtered[0];

  const update = (id: string, patch: Partial<ConfigurableTemplate>) =>
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const remove = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedId === id) setSelectedId(templates.find((t) => t.id !== id)?.id ?? "");
    setToast("Plantilla eliminada.");
  };

  const create = (data: { name: string; category: string; channel: ConfigurableTemplate["channel"]; body: string; shortcut: string }) => {
    const variables = Array.from(new Set([...data.body.matchAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g)].map((m) => m[1])));
    const t: ConfigurableTemplate = {
      id: `tpl-${Date.now()}`,
      name: data.name || "Nueva plantilla",
      category: data.category || "general",
      channel: data.channel,
      approved: data.channel !== "whatsapp",
      body: data.body,
      variables,
      shortcut: data.shortcut || undefined,
    };
    setTemplates((prev) => [t, ...prev]);
    setSelectedId(t.id);
    setOpen(false);
    setToast("Plantilla creada.");
  };

  const previewBody = selected?.body
    .replace(/{{\s*nombre\s*}}/gi, "Carla")
    .replace(/{{\s*negocio\s*}}/gi, "Mueblería Norte")
    .replace(/{{\s*pedido\s*}}/gi, "9871")
    .replace(/{{\s*fecha\s*}}/gi, "12/05")
    .replace(/{{\s*producto\s*}}/gi, "placard 2.5m")
    .replace(/{{\s*precio\s*}}/gi, "AR$ 420.000")
    .replace(/{{\s*agente\s*}}/gi, "Lucía") ?? "";

  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Plantillas</p><p className="mt-1 text-2xl font-bold">{templates.length}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">WhatsApp aprobadas</p><p className="mt-1 text-2xl font-bold text-emerald-100">{templates.filter((t) => t.channel === "whatsapp" && t.approved).length}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Atajos /</p><p className="mt-1 text-2xl font-bold text-cyan-100">{templates.filter((t) => t.shortcut).length}</p></Card>
      </div>

      <Card className="mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <Search className="h-4 w-4 text-zinc-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nombre, atajo o contenido" className="w-full bg-transparent outline-none" />
          </div>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <option value="todas" className="bg-[#0b1023]">Todas las categorías</option>
            <option value="general" className="bg-[#0b1023]">General</option>
            {categories.map((c) => <option key={c.id} value={c.id} className="bg-[#0b1023]">{c.name}</option>)}
          </select>
          <select value={filterCh} onChange={(e) => setFilterCh(e.target.value as "todos" | "whatsapp" | "general")} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <option value="todos" className="bg-[#0b1023]">Todos los canales</option>
            <option value="whatsapp" className="bg-[#0b1023]">WhatsApp (HSM)</option>
            <option value="general" className="bg-[#0b1023]">General</option>
          </select>
          <Button onClick={() => setOpen(true)} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Plus className="mr-1 h-4 w-4" />Nueva plantilla</Button>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-2">
          {filtered.length === 0 ? <Card className="p-6 text-center text-sm text-zinc-400">Sin plantillas.</Card> : filtered.map((t) => (
            <Card key={t.id} onClick={() => setSelectedId(t.id)} className={`cursor-pointer p-3 transition hover:bg-white/10 ${selected?.id === t.id ? "border-cyan-300/40 bg-cyan-500/10" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{t.name} {t.shortcut ? <span className="ml-2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">{t.shortcut}</span> : null}</p>
                  <p className="text-[11px] text-zinc-400">{t.channel === "whatsapp" ? "WhatsApp" : "General"} · {t.variables.length > 0 ? `vars: ${t.variables.join(", ")}` : "sin variables"}</p>
                </div>
                {t.channel === "whatsapp" ? (
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${t.approved ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100" : "border-amber-300/40 bg-amber-500/10 text-amber-100"}`}>{t.approved ? "Aprobada" : "En revisión"}</span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-300">{t.body}</p>
            </Card>
          ))}
        </div>

        {selected ? (
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Plantilla</p>
                <input value={selected.name} onChange={(e) => update(selected.id, { name: e.target.value })} className="w-full bg-transparent text-xl font-semibold focus:outline-none" />
              </div>
              <button onClick={() => remove(selected.id)} className="rounded-xl border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <FormField label="Categoría">
                <select value={selected.category} onChange={(e) => update(selected.id, { category: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
                  <option value="general" className="bg-[#0b1023]">General</option>
                  {categories.map((c) => <option key={c.id} value={c.id} className="bg-[#0b1023]">{c.name}</option>)}
                </select>
              </FormField>
              <FormField label="Canal">
                <select value={selected.channel} onChange={(e) => update(selected.id, { channel: e.target.value as ConfigurableTemplate["channel"] })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
                  <option value="general" className="bg-[#0b1023]">General</option>
                  <option value="whatsapp" className="bg-[#0b1023]">WhatsApp (HSM)</option>
                </select>
              </FormField>
              <FormField label="Atajo /" hint="Para usar desde el composer del inbox.">
                <input value={selected.shortcut ?? ""} onChange={(e) => update(selected.id, { shortcut: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm font-mono" placeholder="/cot" />
              </FormField>
            </div>

            <FormField label="Cuerpo del mensaje" hint="Usá variables {{nombre}}, {{producto}}, etc.">
              <textarea value={selected.body} onChange={(e) => {
                const next = e.target.value;
                const variables = Array.from(new Set([...next.matchAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g)].map((m) => m[1])));
                update(selected.id, { body: next, variables });
              }} className="mt-1 min-h-32 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
            </FormField>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-[11px] text-zinc-400">Insertar variable:</span>
              {variableHints.map((v) => (
                <button key={v} onClick={() => update(selected.id, { body: `${selected.body}{{${v}}}` })} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-200 hover:bg-white/10">{`{{${v}}}`}</button>
              ))}
            </div>

            {selected.channel === "whatsapp" ? (
              <Card className="mt-3 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Aprobada por Meta (HSM)</p>
                    <p className="text-zinc-400">Las plantillas de WhatsApp deben estar aprobadas para enviarse fuera de la ventana de 24h.</p>
                  </div>
                  <ToggleSwitch checked={selected.approved} onChange={(v) => update(selected.id, { approved: v })} />
                </div>
              </Card>
            ) : null}

            <Card className="mt-3 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Vista previa</p>
              <div className="mt-2 max-w-sm rounded-2xl bg-emerald-500/15 p-3 text-sm text-emerald-50">{previewBody}</div>
              <p className="mt-2 text-[11px] text-zinc-500">Variables detectadas: {selected.variables.length === 0 ? "ninguna" : selected.variables.join(", ")}</p>
            </Card>
          </Card>
        ) : null}
      </div>

      <CreateTemplateModal open={open} onClose={() => setOpen(false)} categories={categories} onCreate={create} />
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}

function CreateTemplateModal({ open, onClose, categories, onCreate }: { open: boolean; onClose: () => void; categories: ReturnType<typeof useCategories>["categories"]; onCreate: (data: { name: string; category: string; channel: ConfigurableTemplate["channel"]; body: string; shortcut: string }) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [channel, setChannel] = useState<ConfigurableTemplate["channel"]>("general");
  const [body, setBody] = useState("");
  const [shortcut, setShortcut] = useState("");

  return (
    <Modal open={open} onClose={onClose} title="Nueva plantilla">
      <div className="grid gap-3">
        <FormField label="Nombre"><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Categoría">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
              <option value="general" className="bg-[#0b1023]">General</option>
              {categories.map((c) => <option key={c.id} value={c.id} className="bg-[#0b1023]">{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Canal">
            <select value={channel} onChange={(e) => setChannel(e.target.value as ConfigurableTemplate["channel"])} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
              <option value="general" className="bg-[#0b1023]">General</option>
              <option value="whatsapp" className="bg-[#0b1023]">WhatsApp (HSM)</option>
            </select>
          </FormField>
        </div>
        <FormField label="Atajo /"><input value={shortcut} onChange={(e) => setShortcut(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 font-mono" placeholder="/cot" /></FormField>
        <FormField label="Cuerpo del mensaje"><textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-32 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" placeholder="Hola {{nombre}}, ..." /></FormField>
      </div>
      <Button onClick={() => onCreate({ name, category, channel, body, shortcut })} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40">Crear plantilla</Button>
    </Modal>
  );
}
