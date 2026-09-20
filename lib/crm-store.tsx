"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { conversations as seedConversations, leads as seedLeads } from "@/data/mock-data";
import { Conversation, Lead } from "@/types/entities";

type CRMStoreValue = {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  createLeadFromConversation: (conversation: Conversation) => string;
};

const CRMStoreContext = createContext<CRMStoreValue | null>(null);
const STORAGE_KEY = "waneia.crm.v4";

function parseEstimatedValue(value?: string) {
  if (!value) return 0;
  return Number(value.replace(/[^0-9]/g, "")) || 0;
}

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);
  const [leads, setLeads] = useState<Lead[]>(seedLeads);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { conversations?: Conversation[]; leads?: Lead[] };
        if (saved.conversations) setConversations(saved.conversations);
        if (saved.leads) setLeads(saved.leads);
      }
    } catch {
      // Demo store: si el navegador no permite persistencia, usamos los seeds.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversations, leads }));
    } catch {
      // La demo sigue funcionando aunque localStorage esté lleno o bloqueado.
    }
  }, [conversations, leads, hydrated]);

  const createLeadFromConversation = useCallback((conversation: Conversation) => {
    const existing = leads.find(
      (lead) =>
        lead.workspaceId === conversation.workspaceId &&
        (lead.conversationId === conversation.id || lead.contactId === conversation.contactId),
    );
    if (existing) return existing.id;

    const id = `l-${Date.now()}`;
    const created: Lead = {
      id,
      workspaceId: conversation.workspaceId,
      conversationId: conversation.id,
      contactId: conversation.contactId,
      name: conversation.customerName,
      phone: conversation.phone,
      source: "WhatsApp",
      business: conversation.businessName || "—",
      category: conversation.category,
      stage: "nuevo",
      assignedAgentId: conversation.assignedAgentId ?? "",
      tags: conversation.tags,
      estimatedValue: parseEstimatedValue(conversation.estimatedOpportunity),
      nextFollowUp: "Hoy",
      lastInteraction: "Ahora",
      notes: `Creado desde el Inbox. Intención detectada: ${conversation.intent}.`,
    };

    setLeads((prev) => [created, ...prev]);
    setConversations((prev) =>
      prev.map((item) =>
        item.id === conversation.id
          ? {
              ...item,
              linkedLeadId: id,
              activity: [
                { id: `ev-${Date.now()}`, type: "stage", label: "Oportunidad creada desde Inbox", when: "Ahora" },
                ...item.activity,
              ],
            }
          : item,
      ),
    );
    return id;
  }, [leads]);

  const value = useMemo(
    () => ({ conversations, setConversations, leads, setLeads, createLeadFromConversation }),
    [conversations, leads, createLeadFromConversation],
  );

  return <CRMStoreContext.Provider value={value}>{children}</CRMStoreContext.Provider>;
}

export function useCRMStore() {
  const context = useContext(CRMStoreContext);
  if (!context) throw new Error("useCRMStore debe usarse dentro de CRMProvider");
  return context;
}
