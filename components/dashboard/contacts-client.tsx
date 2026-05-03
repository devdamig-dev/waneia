"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { contacts as seedContacts, segments as seedSegments } from "@/data/mock-data";
import { teamMembers } from "@/data/saas-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Toast } from "@/components/ui/toast";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { Contact, ContactLifecycle } from "@/types/entities";

const lifecycleClasses: Record<ContactLifecycle, string> = {
  nuevo: "border-cyan-300/40 bg-cyan-500/10 text-cyan-100",
  lead: "border-violet-300/40 bg-violet-500/10 text-violet-100",
  "cliente activo": "border-emerald-300/40 bg-emerald-500/10 text-emerald-100",
  "cliente inactivo": "border-amber-300/40 bg-amber-500/10 text-amber-100",
  perdido: "border-rose-300/40 bg-rose-500/10 text-rose-100",
};

const segmentTone: Record<string, string> = {
  emerald: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100",
  cyan: "border-cyan-300/40 bg-cyan-500/10 text-cyan-100",
  amber: "border-amber-300/40 bg-amber-500/10 text-amber-100",
  rose: "border-rose-300/40 bg-rose-500/10 text-rose-100",
  violet: "border-violet-300/40 bg-violet-500/10 text-violet-100",
};

export function ContactsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const [items, setItems] = useState<Contact[]>(seedContacts);
  const [activeSegment, setActiveSegment] = useState<string>("todos");
  const [lifecycleFilter, setLifecycleFilter] = useState<ContactLifecycle | "todos">("todos");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState({ name: "", phone: "", email: "", business: "", source: "WhatsApp", lifecycle: "nuevo" as ContactLifecycle, optIn: true });

  const workspaceContacts = useMemo(() => items.filter((c) => c.workspaceId === activeWorkspaceId), [items, activeWorkspaceId]);
  const workspaceSegments = useMemo(() => seedSegments.filter((s) => s.workspaceId === activeWorkspaceId), [activeWorkspaceId]);
  const workspaceAgents = useMemo(() => teamMembers.filter((m) => m.workspaceId === activeWorkspaceId), [activeWorkspaceId]);

  const filtered = useMemo(() => {
    let base = workspaceContacts;
    if (activeSegment !== "todos") {
      const seg = workspaceSegments.find((s) => s.id === activeSegment);
      base = base.filter((c) => seg?.contactIds.includes(c.id));
    }
    if (lifecycleFilter !== "todos") base = base.filter((c) => c.lifecycle === lifecycleFilter);
    if (search) base = base.filter((c) => `${c.name} ${c.phone} ${c.business} ${c.email ?? ""}`.toLowerCase().includes(search.toLowerCase()));
    return base;
  }, [workspaceContacts, workspaceSegments, activeSegment, lifecycleFilter, search]);

  const addContact = () => {
    const created: Contact = {
      id: `ct-${Date.now()}`,
      workspaceId: activeWorkspaceId,
      name: draft.name || "Nuevo contacto",
      phone: draft.phone || "—",
      email: draft.email || undefined,
      business: draft.business,
      source: draft.source,
      lifecycle: draft.lifecycle,
      assignedAgentId: workspaceAgents[0]?.id ?? null,
      optIn: draft.optIn,
      tags: [],
      lastInteraction: "Recién agregado",
      totalConversations: 0,
    };
    setItems((prev) => [created, ...prev]);
    setOpen(false);
    setToast("Contacto agregado.");
    setDraft({ name: "", phone: "", email: "", business: "", source: "WhatsApp", lifecycle: "nuevo", optIn: true });
  };

  const toggleOptIn = (id: string) =>
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, optIn: !c.optIn } : c)));

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="p-3">
          <p className="px-2 text-xs uppercase tracking-wide text-zinc-400">Segmentos</p>
          <button onClick={() => setActiveSegment("todos")} className={`mt-2 w-full rounded-xl px-3 py-2 text-left text-sm ${activeSegment === "todos" ? "bg-cyan-500/20 text-cyan-100" : "hover:bg-white/10"}`}>
            <span className="flex items-center justify-between"><span>Todos los contactos</span><span className="text-xs text-zinc-400">{workspaceContacts.length}</span></span>
          </button>
          <div className="mt-2 space-y-1">
            {workspaceSegments.map((seg) => (
              <button key={seg.id} onClick={() => setActiveSegment(seg.id)} className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${activeSegment === seg.id ? "bg-cyan-500/20 text-cyan-100" : "hover:bg-white/10"}`}>
                <span className="flex items-center justify-between">
                  <span className="font-medium">{seg.name}</span>
                  <span className={`rounded-full border px-1.5 text-[10px] ${segmentTone[seg.color] ?? segmentTone.cyan}`}>{seg.contactIds.length}</span>
                </span>
                <span className="text-[11px] text-zinc-400">{seg.description}</span>
              </button>
            ))}
            {workspaceSegments.length === 0 ? <p className="px-3 py-2 text-xs text-zinc-500">No hay segmentos en este workspace.</p> : null}
          </div>
          <Card className="mt-3 p-3 text-xs text-zinc-400">
            <p className="font-medium text-zinc-200">¿Qué es un segmento?</p>
            <p className="mt-1">Agrupación dinámica usada para campañas y automatizaciones (lifecycle, tags, comportamiento).</p>
          </Card>
        </Card>

        <div className="space-y-4">
          <Card className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
                <Search className="h-4 w-4 text-zinc-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar contactos" className="w-full bg-transparent outline-none" />
              </div>
              <select value={lifecycleFilter} onChange={(e) => setLifecycleFilter(e.target.value as ContactLifecycle | "todos")} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
                <option value="todos" className="bg-[#0b1023]">Todos los lifecycle</option>
                <option value="nuevo" className="bg-[#0b1023]">Nuevo</option>
                <option value="lead" className="bg-[#0b1023]">Lead</option>
                <option value="cliente activo" className="bg-[#0b1023]">Cliente activo</option>
                <option value="cliente inactivo" className="bg-[#0b1023]">Cliente inactivo</option>
                <option value="perdido" className="bg-[#0b1023]">Perdido</option>
              </select>
              <Button onClick={() => setOpen(true)} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Plus className="mr-1 h-4 w-4" />Agregar contacto</Button>
            </div>
          </Card>

          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-zinc-400">
                  <th className="p-3">Contacto</th>
                  <th className="p-3">Negocio</th>
                  <th className="p-3">Lifecycle</th>
                  <th className="p-3">Origen</th>
                  <th className="p-3">Agente</th>
                  <th className="p-3">Opt-in</th>
                  <th className="p-3">Última interacción</th>
                  <th className="p-3">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-sm text-zinc-400">No hay contactos para los filtros aplicados.</td></tr>
                ) : (
                  filtered.map((c) => {
                    const agent = workspaceAgents.find((a) => a.id === c.assignedAgentId);
                    return (
                      <tr key={c.id} className="hover:bg-white/5">
                        <td className="p-3"><p className="font-medium">{c.name}</p><p className="text-[11px] text-zinc-500">{c.phone}{c.email ? ` · ${c.email}` : ""}</p></td>
                        <td className="p-3 text-zinc-300">{c.business ?? "—"}</td>
                        <td className="p-3"><span className={`rounded-full border px-2 py-0.5 text-[11px] ${lifecycleClasses[c.lifecycle]}`}>{c.lifecycle}</span></td>
                        <td className="p-3 text-zinc-300">{c.source}</td>
                        <td className="p-3 text-zinc-300">{agent?.name ?? "—"}</td>
                        <td className="p-3"><ToggleSwitch checked={c.optIn} onChange={() => toggleOptIn(c.id)} /></td>
                        <td className="p-3 text-zinc-300">{c.lastInteraction}</td>
                        <td className="p-3"><div className="flex flex-wrap gap-1">{c.tags.map((t) => <span key={t} className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-300">#{t}</span>)}</div></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Agregar contacto">
        <div className="grid gap-3">
          <FormField label="Nombre"><input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Teléfono"><input value={draft.phone} onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Email"><input value={draft.email} onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          </div>
          <FormField label="Negocio"><input value={draft.business} onChange={(e) => setDraft((p) => ({ ...p, business: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Origen"><input value={draft.source} onChange={(e) => setDraft((p) => ({ ...p, source: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Lifecycle">
              <select value={draft.lifecycle} onChange={(e) => setDraft((p) => ({ ...p, lifecycle: e.target.value as ContactLifecycle }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
                <option value="nuevo" className="bg-[#0b1023]">Nuevo</option>
                <option value="lead" className="bg-[#0b1023]">Lead</option>
                <option value="cliente activo" className="bg-[#0b1023]">Cliente activo</option>
                <option value="cliente inactivo" className="bg-[#0b1023]">Cliente inactivo</option>
                <option value="perdido" className="bg-[#0b1023]">Perdido</option>
              </select>
            </FormField>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
            <div><p>Opt-in WhatsApp</p><p className="text-xs text-zinc-400">Aceptación para recibir comunicaciones.</p></div>
            <ToggleSwitch checked={draft.optIn} onChange={(v) => setDraft((p) => ({ ...p, optIn: v }))} />
          </div>
        </div>
        <Button onClick={addContact} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40"><X className="hidden" />Agregar contacto</Button>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
