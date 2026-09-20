"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ExternalLink,
  MessageCircleMore,
  Plus,
  Search,
  Tag,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { teamMembers } from "@/data/saas-data";
import { useCRMStore } from "@/lib/crm-store";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Toast } from "@/components/ui/toast";
import { Contact, ContactLifecycle } from "@/types/entities";

const lifecycleTone: Record<ContactLifecycle, string> = {
  nuevo: "border-cyan-300/30 bg-cyan-500/10 text-cyan-100",
  lead: "border-violet-300/30 bg-violet-500/10 text-violet-100",
  "cliente activo": "border-emerald-300/30 bg-emerald-500/10 text-emerald-100",
  "cliente inactivo": "border-amber-300/30 bg-amber-500/10 text-amber-100",
  perdido: "border-rose-300/30 bg-rose-500/10 text-rose-100",
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ContactsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const { contacts, setContacts, conversations, leads } = useCRMStore();
  const [search, setSearch] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState<ContactLifecycle | "todos">("todos");
  const [selectedId, setSelectedId] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    phone: "",
    email: "",
    business: "",
    source: "WhatsApp",
    lifecycle: "nuevo" as ContactLifecycle,
  });

  const workspaceAgents = useMemo(
    () => teamMembers.filter((member) => member.workspaceId === activeWorkspaceId && member.status === "active"),
    [activeWorkspaceId],
  );

  const workspaceContacts = useMemo(
    () =>
      contacts.filter((contact) => {
        if (contact.workspaceId !== activeWorkspaceId) return false;
        if (lifecycleFilter !== "todos" && contact.lifecycle !== lifecycleFilter) return false;
        if (
          search &&
          !`${contact.name} ${contact.phone} ${contact.email ?? ""} ${contact.business ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
        ) return false;
        return true;
      }),
    [contacts, activeWorkspaceId, lifecycleFilter, search],
  );

  useEffect(() => {
    const requested = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null;
    if (requested && contacts.some((contact) => contact.id === requested && contact.workspaceId === activeWorkspaceId)) {
      setSelectedId(requested);
      setDrawerOpen(true);
    }
  }, [activeWorkspaceId, contacts]);

  const selected = contacts.find((contact) => contact.id === selectedId);
  const selectedConversations = selected
    ? conversations.filter((conversation) => conversation.contactId === selected.id && conversation.workspaceId === selected.workspaceId)
    : [];
  const selectedLeads = selected
    ? leads.filter((lead) => lead.contactId === selected.id && lead.workspaceId === selected.workspaceId)
    : [];
  const totalOpportunity = selectedLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
  const selectedAgent = workspaceAgents.find((agent) => agent.id === selected?.assignedAgentId);

  const counts = useMemo(() => {
    const base = contacts.filter((contact) => contact.workspaceId === activeWorkspaceId);
    return {
      todos: base.length,
      lead: base.filter((contact) => contact.lifecycle === "lead" || contact.lifecycle === "nuevo").length,
      "cliente activo": base.filter((contact) => contact.lifecycle === "cliente activo").length,
      "cliente inactivo": base.filter((contact) => contact.lifecycle === "cliente inactivo").length,
    };
  }, [contacts, activeWorkspaceId]);

  const updateContact = (id: string, patch: Partial<Contact>) => {
    setContacts((previous) => previous.map((contact) => (contact.id === id ? { ...contact, ...patch } : contact)));
  };

  const addTag = (tag: string) => {
    if (!selected || !tag.trim() || selected.tags.includes(tag.trim())) return;
    updateContact(selected.id, { tags: [...selected.tags, tag.trim()] });
  };

  const createContact = () => {
    const created: Contact = {
      id: `ct-${Date.now()}`,
      workspaceId: activeWorkspaceId,
      name: draft.name || "Nuevo contacto",
      phone: draft.phone || "—",
      email: draft.email || undefined,
      business: draft.business || undefined,
      source: draft.source || "WhatsApp",
      lifecycle: draft.lifecycle,
      assignedAgentId: workspaceAgents[0]?.id ?? null,
      optIn: true,
      tags: [],
      lastInteraction: "Recién agregado",
      totalConversations: 0,
    };
    setContacts((previous) => [created, ...previous]);
    setOpenNew(false);
    setSelectedId(created.id);
    setDrawerOpen(true);
    setDraft({ name: "", phone: "", email: "", business: "", source: "WhatsApp", lifecycle: "nuevo" });
    setToast("Contacto creado.");
  };

  const openContact = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-64 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <Search className="h-4 w-4 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente, teléfono, email o negocio"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <select
              value={lifecycleFilter}
              onChange={(event) => setLifecycleFilter(event.target.value as ContactLifecycle | "todos")}
              className="rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="nuevo">Nuevos</option>
              <option value="lead">Leads</option>
              <option value="cliente activo">Clientes activos</option>
              <option value="cliente inactivo">Clientes inactivos</option>
              <option value="perdido">Perdidos</option>
            </select>
            <Button onClick={() => setOpenNew(true)} className="bg-emerald-500/30 hover:bg-emerald-500/40">
              <Plus className="mr-1 h-4 w-4" />
              Nuevo contacto
            </Button>
          </div>
        </Card>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { key: "todos", label: "Todos", value: counts.todos },
            { key: "lead", label: "Prospectos", value: counts.lead },
            { key: "cliente activo", label: "Clientes", value: counts["cliente activo"] },
            { key: "cliente inactivo", label: "Inactivos", value: counts["cliente inactivo"] },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setLifecycleFilter(item.key === "todos" ? "todos" : item.key as ContactLifecycle)}
              className="rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/10"
            >
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">{item.label}</p>
              <p className="mt-1 text-xl font-semibold">{item.value}</p>
            </button>
          ))}
        </div>

        <Card className="overflow-hidden p-0">
          <div className="hidden grid-cols-[1.3fr_1fr_150px_170px_130px] gap-3 border-b border-white/10 px-4 py-3 text-[10px] uppercase tracking-wide text-zinc-500 md:grid">
            <span>Cliente</span>
            <span>Negocio</span>
            <span>Estado</span>
            <span>Responsable</span>
            <span>Último contacto</span>
          </div>

          <div className="divide-y divide-white/5">
            {workspaceContacts.length === 0 ? (
              <p className="p-8 text-center text-sm text-zinc-500">No hay contactos con estos filtros.</p>
            ) : workspaceContacts.map((contact) => {
              const agent = workspaceAgents.find((item) => item.id === contact.assignedAgentId);
              const linkedLeads = leads.filter((lead) => lead.contactId === contact.id && lead.workspaceId === contact.workspaceId);
              const value = linkedLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
              return (
                <button
                  key={contact.id}
                  onClick={() => openContact(contact.id)}
                  className="grid w-full gap-3 px-4 py-3 text-left transition hover:bg-white/5 md:grid-cols-[1.3fr_1fr_150px_170px_130px] md:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-500/10 text-xs font-semibold text-cyan-100">
                      {initials(contact.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{contact.name}</p>
                      <p className="truncate text-[11px] text-zinc-500">{contact.phone}{contact.email ? ` · ${contact.email}` : ""}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-300">{contact.business || "—"}</p>
                    {value > 0 ? <p className="mt-0.5 text-[10px] text-emerald-200">{formatCurrency(value)} en oportunidades</p> : null}
                  </div>
                  <span className={`w-fit rounded-full border px-2 py-0.5 text-[10px] ${lifecycleTone[contact.lifecycle]}`}>
                    {contact.lifecycle}
                  </span>
                  <span className="text-xs text-zinc-400">{agent?.name ?? "Sin asignar"}</span>
                  <span className="text-xs text-zinc-500">{contact.lastInteraction}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Drawer
        open={drawerOpen && Boolean(selected)}
        onClose={() => setDrawerOpen(false)}
        title={selected?.name ?? "Contacto"}
        description={selected ? `${selected.phone}${selected.email ? ` · ${selected.email}` : ""}` : ""}
        width="max-w-xl"
      >
        {selected ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-3 text-center">
                <p className="text-[10px] uppercase text-zinc-500">Chats</p>
                <p className="mt-1 text-xl font-bold">{selectedConversations.length}</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-[10px] uppercase text-zinc-500">Oportunidades</p>
                <p className="mt-1 text-xl font-bold">{selectedLeads.length}</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-[10px] uppercase text-zinc-500">Valor</p>
                <p className="mt-1 text-sm font-bold text-emerald-200">{formatCurrency(totalOpportunity)}</p>
              </Card>
            </div>

            <Card className="p-3">
              <p className="text-xs font-semibold">Datos del cliente</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input
                  value={selected.name}
                  onChange={(event) => updateContact(selected.id, { name: event.target.value })}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
                <input
                  value={selected.business ?? ""}
                  onChange={(event) => updateContact(selected.id, { business: event.target.value })}
                  placeholder="Negocio / empresa"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
                <input
                  value={selected.phone}
                  onChange={(event) => updateContact(selected.id, { phone: event.target.value })}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
                <input
                  value={selected.email ?? ""}
                  onChange={(event) => updateContact(selected.id, { email: event.target.value || undefined })}
                  placeholder="Email"
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
            </Card>

            <Card className="p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Estado</p>
                  <select
                    value={selected.lifecycle}
                    onChange={(event) => updateContact(selected.id, { lifecycle: event.target.value as ContactLifecycle })}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-xs"
                  >
                    <option value="nuevo">Nuevo</option>
                    <option value="lead">Lead</option>
                    <option value="cliente activo">Cliente activo</option>
                    <option value="cliente inactivo">Cliente inactivo</option>
                    <option value="perdido">Perdido</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Responsable</p>
                  <select
                    value={selected.assignedAgentId ?? ""}
                    onChange={(event) => updateContact(selected.id, { assignedAgentId: event.target.value || null })}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-xs"
                  >
                    <option value="">Sin asignar</option>
                    {workspaceAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div>
                  <p className="text-xs font-medium">Permite comunicaciones</p>
                  <p className="text-[10px] text-zinc-500">Opt-in para mensajes comerciales.</p>
                </div>
                <ToggleSwitch checked={selected.optIn} onChange={(value) => updateContact(selected.id, { optIn: value })} />
              </div>
            </Card>

            <Card className="p-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold"><Tag className="h-3.5 w-3.5 text-violet-300" />Etiquetas</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {selected.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => updateContact(selected.id, { tags: selected.tags.filter((item) => item !== tag) })}
                    className="rounded-full border border-violet-300/20 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-100"
                  >
                    #{tag} ×
                  </button>
                ))}
              </div>
              <input
                placeholder="+ etiqueta y Enter"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addTag(event.currentTarget.value);
                    event.currentTarget.value = "";
                  }
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs"
              />
            </Card>

            <Card className="p-3">
              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  <MessageCircleMore className="h-3.5 w-3.5 text-cyan-300" />
                  Conversaciones
                </p>
                <span className="text-[10px] text-zinc-500">{selected.totalConversations} históricas</span>
              </div>
              <div className="mt-2 space-y-2">
                {selectedConversations.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-white/10 p-3 text-xs text-zinc-500">Todavía no tiene conversaciones vinculadas.</p>
                ) : selectedConversations.slice(0, 4).map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/dashboard/conversaciones?id=${conversation.id}`}
                    className="block rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">{conversation.intent}</p>
                      <span className="text-[10px] text-zinc-500">{conversation.status}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[11px] text-zinc-400">{conversation.lastMessage}</p>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
                  Oportunidades
                </p>
                <span className="text-[10px] text-emerald-200">{formatCurrency(totalOpportunity)}</span>
              </div>
              <div className="mt-2 space-y-2">
                {selectedLeads.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-white/10 p-3 text-xs text-zinc-500">Sin oportunidades registradas.</p>
                ) : selectedLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/dashboard/leads?id=${lead.id}`}
                    className="block rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">{lead.business}</p>
                      <span className="text-xs text-emerald-200">{formatCurrency(lead.estimatedValue)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{lead.stage}</span>
                      <span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" />{lead.nextFollowUp}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="p-3">
              <p className="text-xs font-semibold">Resumen comercial</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                Origen: {selected.source}. Responsable: {selectedAgent?.name ?? "sin asignar"}. Última interacción: {selected.lastInteraction}.
              </p>
              {selectedConversations[0] ? (
                <Link href={`/dashboard/conversaciones?id=${selectedConversations[0].id}`} className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-200">
                  Abrir último chat <ExternalLink className="h-3 w-3" />
                </Link>
              ) : null}
            </Card>
          </div>
        ) : null}
      </Drawer>

      <Modal open={openNew} onClose={() => setOpenNew(false)} title="Nuevo contacto">
        <div className="grid gap-3">
          <FormField label="Nombre">
            <input value={draft.name} onChange={(event) => setDraft((previous) => ({ ...previous, name: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Teléfono">
              <input value={draft.phone} onChange={(event) => setDraft((previous) => ({ ...previous, phone: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
            </FormField>
            <FormField label="Email">
              <input value={draft.email} onChange={(event) => setDraft((previous) => ({ ...previous, email: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
            </FormField>
          </div>
          <FormField label="Negocio / empresa">
            <input value={draft.business} onChange={(event) => setDraft((previous) => ({ ...previous, business: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Origen">
              <input value={draft.source} onChange={(event) => setDraft((previous) => ({ ...previous, source: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
            </FormField>
            <FormField label="Estado">
              <select value={draft.lifecycle} onChange={(event) => setDraft((previous) => ({ ...previous, lifecycle: event.target.value as ContactLifecycle }))} className="w-full rounded-xl border border-white/10 bg-[#0b1023] p-2.5">
                <option value="nuevo">Nuevo</option>
                <option value="lead">Lead</option>
                <option value="cliente activo">Cliente activo</option>
              </select>
            </FormField>
          </div>
        </div>
        <Button onClick={createContact} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40">
          Crear contacto
        </Button>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
