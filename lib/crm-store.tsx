"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import type { Contact, Conversation, ConversationStatus, Lead, Message } from "@/types/entities";
import type { TablesUpdate } from "@/types/database";

type ContactDraft = {
  name: string;
  phone: string;
  email?: string;
  business?: string;
  source?: string;
  lifecycle?: Contact["lifecycle"];
  assignedAgentId?: string | null;
};

type LeadDraft = {
  name: string;
  phone: string;
  email?: string;
  business: string;
  source: string;
  category: Lead["category"];
  stage?: Lead["stage"];
  assignedAgentId?: string;
  estimatedValue?: number;
  notes?: string;
};

type CRMStoreValue = {
  contacts: Contact[];
  conversations: Conversation[];
  leads: Lead[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  createContact: (draft: ContactDraft) => Promise<string>;
  updateContact: (id: string, patch: Partial<Contact>) => Promise<void>;
  updateConversation: (id: string, patch: Partial<Conversation>) => Promise<void>;
  sendMessage: (conversationId: string, body: string) => Promise<void>;
  createLeadFromConversation: (conversation: Conversation) => Promise<string>;
  createLead: (draft: LeadDraft) => Promise<string>;
  updateLead: (id: string, patch: Partial<Lead>) => Promise<void>;
};

const CRMStoreContext = createContext<CRMStoreValue | null>(null);

function minutesUntil(value: string | null) {
  if (!value) return 60;
  return Math.round((new Date(value).getTime() - Date.now()) / 60000);
}

function formatMoment(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function nextFollowUpLabel(value: string | null) {
  if (!value) return "—";
  return formatMoment(value);
}

function parseFollowUp(value: string) {
  if (!value || value === "—") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function dbMessageToEntity(row: {
  id: string;
  direction: string;
  body: string | null;
  sent_at: string;
}): Message {
  return {
    id: row.id,
    sender: row.direction === "outbound" ? "agent" : row.direction === "system" ? "system" : "customer",
    content: row.body ?? "",
    timestamp: new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(row.sent_at)),
    read: true,
  };
}

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const { activeWorkspaceId, currentUserId } = useWorkspace();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!activeWorkspaceId) {
      setContacts([]);
      setConversations([]);
      setLeads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const [contactsResult, conversationsResult, messagesResult, leadsResult] = await Promise.all([
      supabase.from("contacts").select("*").eq("workspace_id", activeWorkspaceId).order("updated_at", { ascending: false }),
      supabase.from("conversations").select("*").eq("workspace_id", activeWorkspaceId).order("last_message_at", { ascending: false, nullsFirst: false }),
      supabase.from("messages").select("*").eq("workspace_id", activeWorkspaceId).order("sent_at", { ascending: true }),
      supabase.from("opportunities").select("*").eq("workspace_id", activeWorkspaceId).order("updated_at", { ascending: false }),
    ]);

    const firstError = contactsResult.error || conversationsResult.error || messagesResult.error || leadsResult.error;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    const contactRows = contactsResult.data ?? [];
    const conversationRows = conversationsResult.data ?? [];
    const messageRows = messagesResult.data ?? [];
    const leadRows = leadsResult.data ?? [];
    const contactById = new Map(contactRows.map((row) => [row.id, row]));
    const messagesByConversation = new Map<string, Message[]>();

    messageRows.forEach((row) => {
      const list = messagesByConversation.get(row.conversation_id) ?? [];
      list.push(dbMessageToEntity(row));
      messagesByConversation.set(row.conversation_id, list);
    });

    const mappedConversations: Conversation[] = conversationRows.map((row) => {
      const contact = contactById.get(row.contact_id);
      return {
        id: row.id,
        workspaceId: row.workspace_id,
        contactId: row.contact_id,
        customerName: contact?.name ?? "Contacto",
        phone: contact?.phone ?? "—",
        businessName: contact?.business ?? "",
        lastMessage: row.last_message ?? "",
        category: row.category as Conversation["category"],
        status: row.status as ConversationStatus,
        priority: row.priority as Conversation["priority"],
        intent: row.intent ?? "Consulta",
        leadScore: 0,
        slaMinutesRemaining: minutesUntil(row.sla_due_at),
        assignedAgentId: row.assigned_user_id,
        tags: row.tags ?? [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        internalNotes: row.internal_notes ?? "",
        messages: messagesByConversation.get(row.id) ?? [],
        activity: [],
        suggestedReply: row.suggested_reply ?? "",
        nextTask: row.next_task ?? "",
        nextTaskDueDate: row.next_task_due_at ?? undefined,
        linkedLeadId: row.linked_opportunity_id ?? undefined,
      };
    });

    const conversationCountByContact = new Map<string, number>();
    mappedConversations.forEach((conversation) => {
      conversationCountByContact.set(
        conversation.contactId,
        (conversationCountByContact.get(conversation.contactId) ?? 0) + 1,
      );
    });

    const mappedContacts: Contact[] = contactRows.map((row) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      name: row.name,
      phone: row.phone,
      email: row.email ?? undefined,
      business: row.business ?? undefined,
      source: row.source,
      lifecycle: row.lifecycle as Contact["lifecycle"],
      assignedAgentId: row.assigned_user_id,
      optIn: row.opt_in,
      tags: row.tags ?? [],
      lastInteraction: formatMoment(row.last_interaction_at ?? row.updated_at),
      totalConversations: conversationCountByContact.get(row.id) ?? 0,
    }));

    const mappedLeads: Lead[] = leadRows.map((row) => {
      const contact = contactById.get(row.contact_id);
      return {
        id: row.id,
        workspaceId: row.workspace_id,
        conversationId: row.conversation_id ?? undefined,
        contactId: row.contact_id,
        name: row.name,
        phone: contact?.phone ?? "—",
        email: contact?.email ?? undefined,
        source: row.source,
        business: row.business ?? contact?.business ?? "—",
        category: row.category as Lead["category"],
        stage: row.stage as Lead["stage"],
        assignedAgentId: row.owner_user_id ?? "",
        tags: row.tags ?? [],
        estimatedValue: Number(row.estimated_value) || 0,
        nextFollowUp: nextFollowUpLabel(row.next_follow_up_at),
        lastInteraction: formatMoment(row.updated_at),
        notes: row.notes ?? "",
      };
    });

    setContacts(mappedContacts);
    setConversations(mappedConversations);
    setLeads(mappedLeads);
    setLoading(false);
  }, [activeWorkspaceId, supabase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activeWorkspaceId) return;

    const channel = supabase
      .channel(`waneia:${activeWorkspaceId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `workspace_id=eq.${activeWorkspaceId}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `workspace_id=eq.${activeWorkspaceId}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "opportunities", filter: `workspace_id=eq.${activeWorkspaceId}` }, () => void refresh())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeWorkspaceId, refresh, supabase]);

  const createContact = useCallback(async (draft: ContactDraft) => {
    if (!activeWorkspaceId) throw new Error("No hay un workspace activo.");

    const { data, error: insertError } = await supabase
      .from("contacts")
      .insert({
        workspace_id: activeWorkspaceId,
        name: draft.name || "Nuevo contacto",
        phone: draft.phone || "—",
        email: draft.email || null,
        business: draft.business || null,
        source: draft.source || "WhatsApp",
        lifecycle: draft.lifecycle || "nuevo",
        assigned_user_id: draft.assignedAgentId || null,
        last_interaction_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !data) throw new Error(insertError?.message || "No se pudo crear el contacto.");
    await refresh();
    return data.id;
  }, [activeWorkspaceId, refresh, supabase]);

  const updateContact = useCallback(async (id: string, patch: Partial<Contact>) => {
    const dbPatch: TablesUpdate<"contacts"> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.email !== undefined) dbPatch.email = patch.email || null;
    if (patch.business !== undefined) dbPatch.business = patch.business || null;
    if (patch.source !== undefined) dbPatch.source = patch.source;
    if (patch.lifecycle !== undefined) dbPatch.lifecycle = patch.lifecycle;
    if (patch.assignedAgentId !== undefined) dbPatch.assigned_user_id = patch.assignedAgentId || null;
    if (patch.optIn !== undefined) dbPatch.opt_in = patch.optIn;
    if (patch.tags !== undefined) dbPatch.tags = patch.tags;
    dbPatch.last_interaction_at = new Date().toISOString();

    const { error: updateError } = await supabase.from("contacts").update(dbPatch).eq("id", id);
    if (updateError) throw new Error(updateError.message);

    setContacts((previous) => previous.map((contact) => (contact.id === id ? { ...contact, ...patch } : contact)));
  }, [supabase]);

  const updateConversation = useCallback(async (id: string, patch: Partial<Conversation>) => {
    const dbPatch: TablesUpdate<"conversations"> = {};
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.priority !== undefined) dbPatch.priority = patch.priority;
    if (patch.intent !== undefined) dbPatch.intent = patch.intent;
    if (patch.assignedAgentId !== undefined) dbPatch.assigned_user_id = patch.assignedAgentId || null;
    if (patch.tags !== undefined) dbPatch.tags = patch.tags;
    if (patch.lastMessage !== undefined) dbPatch.last_message = patch.lastMessage;
    if (patch.internalNotes !== undefined) dbPatch.internal_notes = patch.internalNotes;
    if (patch.suggestedReply !== undefined) dbPatch.suggested_reply = patch.suggestedReply;
    if (patch.nextTask !== undefined) dbPatch.next_task = patch.nextTask || null;
    if (patch.nextTaskDueDate !== undefined) dbPatch.next_task_due_at = patch.nextTaskDueDate || null;
    if (patch.linkedLeadId !== undefined) dbPatch.linked_opportunity_id = patch.linkedLeadId || null;

    const { error: updateError } = await supabase.from("conversations").update(dbPatch).eq("id", id);
    if (updateError) throw new Error(updateError.message);

    setConversations((previous) => previous.map((conversation) => (conversation.id === id ? { ...conversation, ...patch } : conversation)));
  }, [supabase]);

  const sendMessage = useCallback(async (conversationId: string, body: string) => {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation || !body.trim()) return;

    const { data: whatsappAccount } = await supabase
      .from("whatsapp_accounts")
      .select("status")
      .eq("workspace_id", conversation.workspaceId)
      .maybeSingle();

    if (whatsappAccount?.status === "connected") {
      const { error: functionError } = await supabase.functions.invoke("whatsapp-send", {
        body: {
          workspace_id: conversation.workspaceId,
          conversation_id: conversation.id,
          text: body.trim(),
        },
      });

      if (functionError) throw new Error(functionError.message || "No se pudo enviar el mensaje por WhatsApp.");
      await refresh();
      return;
    }

    const now = new Date().toISOString();
    const { error: messageError } = await supabase.from("messages").insert({
      workspace_id: conversation.workspaceId,
      conversation_id: conversation.id,
      direction: "outbound",
      sender_user_id: currentUserId || null,
      body: body.trim(),
      status: "sent",
      sent_at: now,
    });
    if (messageError) throw new Error(messageError.message);

    const { error: conversationError } = await supabase
      .from("conversations")
      .update({
        last_message: body.trim(),
        last_message_at: now,
        status: conversation.status === "nuevo" ? "en curso" : conversation.status,
        assigned_user_id: conversation.assignedAgentId || currentUserId || null,
      })
      .eq("id", conversation.id);

    if (conversationError) throw new Error(conversationError.message);
    await refresh();
  }, [conversations, currentUserId, refresh, supabase]);

  const createLeadFromConversation = useCallback(async (conversation: Conversation) => {
    const existing = leads.find(
      (lead) =>
        lead.workspaceId === conversation.workspaceId &&
        (lead.conversationId === conversation.id || lead.contactId === conversation.contactId),
    );
    if (existing) return existing.id;

    const { data, error: insertError } = await supabase
      .from("opportunities")
      .insert({
        workspace_id: conversation.workspaceId,
        contact_id: conversation.contactId,
        conversation_id: conversation.id,
        name: conversation.customerName,
        source: "WhatsApp",
        business: conversation.businessName || null,
        category: conversation.category,
        stage: "nuevo",
        owner_user_id: conversation.assignedAgentId || currentUserId || null,
        tags: conversation.tags,
        estimated_value: 0,
        notes: `Creada desde Inbox. Intención: ${conversation.intent}.`,
      })
      .select("id")
      .single();

    if (insertError || !data) throw new Error(insertError?.message || "No se pudo crear la oportunidad.");

    const { error: linkError } = await supabase
      .from("conversations")
      .update({ linked_opportunity_id: data.id })
      .eq("id", conversation.id);
    if (linkError) throw new Error(linkError.message);

    await refresh();
    return data.id;
  }, [currentUserId, leads, refresh, supabase]);

  const createLead = useCallback(async (draft: LeadDraft) => {
    if (!activeWorkspaceId) throw new Error("No hay un workspace activo.");

    let contact = contacts.find(
      (item) => item.workspaceId === activeWorkspaceId && item.phone.replace(/\s/g, "") === draft.phone.replace(/\s/g, ""),
    );

    let contactId = contact?.id;

    if (!contactId) {
      contactId = await createContact({
        name: draft.name,
        phone: draft.phone,
        email: draft.email,
        business: draft.business,
        source: draft.source,
        lifecycle: "lead",
        assignedAgentId: draft.assignedAgentId || currentUserId || null,
      });
    }

    const { data, error: insertError } = await supabase
      .from("opportunities")
      .insert({
        workspace_id: activeWorkspaceId,
        contact_id: contactId,
        name: draft.name || "Oportunidad",
        source: draft.source || "WhatsApp",
        business: draft.business || null,
        category: draft.category,
        stage: draft.stage || "nuevo",
        owner_user_id: draft.assignedAgentId || currentUserId || null,
        estimated_value: draft.estimatedValue || 0,
        notes: draft.notes || null,
      })
      .select("id")
      .single();

    if (insertError || !data) throw new Error(insertError?.message || "No se pudo crear la oportunidad.");
    await refresh();
    return data.id;
  }, [activeWorkspaceId, contacts, createContact, currentUserId, refresh, supabase]);

  const updateLead = useCallback(async (id: string, patch: Partial<Lead>) => {
    const dbPatch: TablesUpdate<"opportunities"> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.source !== undefined) dbPatch.source = patch.source;
    if (patch.business !== undefined) dbPatch.business = patch.business || null;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.stage !== undefined) {
      dbPatch.stage = patch.stage;
      if (patch.stage === "ganado") dbPatch.won_at = new Date().toISOString();
    }
    if (patch.assignedAgentId !== undefined) dbPatch.owner_user_id = patch.assignedAgentId || null;
    if (patch.tags !== undefined) dbPatch.tags = patch.tags;
    if (patch.estimatedValue !== undefined) dbPatch.estimated_value = patch.estimatedValue;
    if (patch.nextFollowUp !== undefined) dbPatch.next_follow_up_at = parseFollowUp(patch.nextFollowUp);
    if (patch.notes !== undefined) dbPatch.notes = patch.notes || null;

    const { error: updateError } = await supabase.from("opportunities").update(dbPatch).eq("id", id);
    if (updateError) throw new Error(updateError.message);

    setLeads((previous) => previous.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)));
  }, [supabase]);

  const value = useMemo(
    () => ({
      contacts,
      conversations,
      leads,
      loading,
      error,
      refresh,
      createContact,
      updateContact,
      updateConversation,
      sendMessage,
      createLeadFromConversation,
      createLead,
      updateLead,
    }),
    [
      contacts,
      conversations,
      leads,
      loading,
      error,
      refresh,
      createContact,
      updateContact,
      updateConversation,
      sendMessage,
      createLeadFromConversation,
      createLead,
      updateLead,
    ],
  );

  return <CRMStoreContext.Provider value={value}>{children}</CRMStoreContext.Provider>;
}

export function useCRMStore() {
  const context = useContext(CRMStoreContext);
  if (!context) throw new Error("useCRMStore debe usarse dentro de CRMProvider");
  return context;
}
