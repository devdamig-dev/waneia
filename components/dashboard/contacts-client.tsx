"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, MessageCircleMore, Plus, Search } from "lucide-react";
import {
  campaigns as seedCampaigns,
  contacts as seedContacts,
  conversations as seedConversations,
  leads as seedLeads,
  segments as seedSegments,
} from "@/data/mock-data";
import { teamMembers } from "@/data/saas-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Toast } from "@/components/ui/toast";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { Contact, ContactLifecycle } from "@/types/entities";
import { StatusBadge } from "@/components/dashboard/status-badge";

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

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export function ContactsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const [items, setItems] = useState<Contact[]>(seedContacts);
  const [activeSegment, setActiveSegment] = useState<string>("todos");
  const [lifecycleFilter, setLifecycleFilter] = useState<ContactLifecycle | "todos">("todos");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
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

  const selected = useMemo(() => items.find((c) => c.id === selectedId), [items, selectedId]);

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

  // Linked entities for selected contact
  const contactConversations = useMemo(
    () => (selected ? seedConversations.filter((c) => c.contactId === selected.id) : []),
    [selected],
  );
  const contactLeads = useMemo(
    () => (selected ? seedLeads.filter((l) => l.contactId === selected.id) : []),
    [selected],
  );
  const contactCampaigns = useMemo(() => {
    if (!selected) return [];
    const segmentsForContact = seedSegments.filter((s) => s.contactIds.includes(selected.id)).map((s) => s.id);
    return seedCampaigns.filter((c) => c.workspaceId === selected.workspaceId && segmentsForContact.includes(c.segmentId));
  }, [selected]);

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
                  <th className="p-3">Score IA</th>
                  <th className="p-3">Sentimiento</th>
                  <th className="p-3">Origen</th>
                  <th className="p-3">Operador</th>
                  <th className="p-3">Opt-in</th>
                  <th className="p-3">Etiquetas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="p-6 text-center text-sm text-zinc-400">No hay contactos para los filtros aplicados.</td></tr>
                ) : (
                  filtered.map((c) => {
                    const agent = workspaceAgents.find((a) => a.id === c.assignedAgentId);
                    const isActive = selected?.id === c.id;
                    const initials = c.name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
                    const seed = c.id.charCodeAt(c.id.length - 1);
                    const score = 40 + (seed % 60);
                    const scoreClass = score >= 70 ? "text-emerald-200" : score >= 50 ? "text-amber-200" : "text-rose-200";
                    const sentimentIdx = seed % 3;
                    const sentiment = sentimentIdx === 0 ? { label: "positivo", tone: "border-emerald-300/30 bg-emerald-500/10 text-emerald-100" } : sentimentIdx === 1 ? { label: "neutral", tone: "border-zinc-300/30 bg-zinc-500/10 text-zinc-200" } : { label: "negativo", tone: "border-rose-300/30 bg-rose-500/10 text-rose-100" };
                    return (
                      <tr key={c.id} onClick={() => setSelectedId(c.id)} className={`cursor-pointer hover:bg-white/5 ${isActive ? "bg-cyan-500/5" : ""}`}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-500/15 text-[11px] font-semibold text-cyan-100">{initials}</span>
                            <div>
                              <p className="font-medium">{c.name}</p>
                              <p className="text-[11px] text-zinc-500">{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-zinc-300">{c.business ?? "—"}</td>
                        <td className="p-3"><span className={`rounded-full border px-2 py-0.5 text-[11px] ${lifecycleClasses[c.lifecycle]}`}>{c.lifecycle}</span></td>
                        <td className={`p-3 font-semibold ${scoreClass}`}>{score}<span className="text-[10px] text-zinc-500">/100</span></td>
                        <td className="p-3"><span className={`rounded-full border px-2 py-0.5 text-[11px] ${sentiment.tone}`}>{sentiment.label}</span></td>
                        <td className="p-3 text-zinc-300">{c.source}</td>
                        <td className="p-3 text-zinc-300">{agent?.name ?? "—"}</td>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}><ToggleSwitch checked={c.optIn} onChange={() => toggleOptIn(c.id)} /></td>
                        <td className="p-3"><div className="flex flex-wrap gap-1">{c.tags.map((t) => <span key={t} className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-300">#{t}</span>)}</div></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>

          {selected ? (
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Detalle de contacto</p>
                  <h3 className="text-xl font-semibold">{selected.name}</h3>
                  <p className="text-sm text-zinc-400">{selected.phone}{selected.email ? ` · ${selected.email}` : ""}{selected.business ? ` · ${selected.business}` : ""}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full border px-2 py-0.5 ${lifecycleClasses[selected.lifecycle]}`}>{selected.lifecycle}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-zinc-300">Origen: {selected.source}</span>
                  <span className={`rounded-full border px-2 py-0.5 ${selected.optIn ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100" : "border-rose-300/40 bg-rose-500/10 text-rose-100"}`}>{selected.optIn ? "Opt-in activo" : "Opt-in revocado"}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <Card className="p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Resumen</p>
                  <p className="mt-2 text-sm">Conversaciones: {selected.totalConversations}</p>
                  <p className="text-sm">Última interacción: {selected.lastInteraction}</p>
                  <p className="text-sm">Operador asignado: {workspaceAgents.find((a) => a.id === selected.assignedAgentId)?.name ?? "—"}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selected.tags.map((t) => <span key={t} className="rounded-full border border-violet-300/30 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-100">#{t}</span>)}
                  </div>
                </Card>

                <Card className="p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-400 inline-flex items-center gap-1"><MessageCircleMore className="h-3.5 w-3.5" /> Conversaciones</p>
                  {contactConversations.length === 0 ? <p className="mt-2 text-xs text-zinc-500">Sin conversaciones registradas.</p> : (
                    <div className="mt-2 space-y-2">
                      {contactConversations.map((c) => (
                        <Link key={c.id} href={`/dashboard/conversaciones?id=${c.id}`} className="block rounded-lg border border-white/10 bg-white/5 p-2 text-xs hover:bg-white/10">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{c.intent}</span>
                            <StatusBadge status={c.status} />
                          </div>
                          <p className="mt-1 line-clamp-1 text-[11px] text-zinc-400">{c.lastMessage}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Oportunidades</p>
                  {contactLeads.length === 0 ? <p className="mt-2 text-xs text-zinc-500">Sin oportunidades creadas.</p> : (
                    <div className="mt-2 space-y-2">
                      {contactLeads.map((l) => (
                        <Link key={l.id} href={`/dashboard/leads?id=${l.id}`} className="block rounded-lg border border-white/10 bg-white/5 p-2 text-xs hover:bg-white/10">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{l.name}</span>
                            <span className="text-emerald-200">{formatCurrency(l.estimatedValue)}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
                            <StatusBadge status={l.stage} />
                            <span className="inline-flex items-center gap-1">{l.nextFollowUp} <ExternalLink className="h-3 w-3" /></span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-3 lg:col-span-3">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Campañas que incluyen este contacto</p>
                  {contactCampaigns.length === 0 ? <p className="mt-2 text-xs text-zinc-500">Este contacto no aparece en campañas activas.</p> : (
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      {contactCampaigns.map((c) => (
                        <Link key={c.id} href="/dashboard/campanias" className="block rounded-lg border border-white/10 bg-white/5 p-2 text-xs hover:bg-white/10">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{c.name}</span>
                            <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-0.5 text-cyan-100">{c.status}</span>
                          </div>
                          <p className="mt-1 line-clamp-1 text-[11px] text-zinc-400">{c.preview}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </Card>
          ) : null}
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
        <Button onClick={addContact} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40">Agregar contacto</Button>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
