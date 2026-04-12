export type ConversationCategory = "presupuesto" | "pedido" | "consulta" | "soporte humano";
export type ConversationStatus = "nuevo" | "en seguimiento" | "esperando respuesta" | "cerrado";

export type Message = {
  id: string;
  sender: "customer" | "system" | "agent";
  content: string;
  timestamp: string;
};

export type Conversation = {
  id: string;
  customerName: string;
  phone: string;
  businessName: string;
  lastMessage: string;
  category: ConversationCategory;
  status: ConversationStatus;
  assignedToHuman: boolean;
  createdAt: string;
  updatedAt: string;
  estimatedOpportunity?: string;
  messages: Message[];
  internalNotes: string;
};

export type LeadStatus = "nuevo" | "calificado" | "en propuesta" | "ganado" | "perdido";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  business: string;
  category: ConversationCategory;
  status: LeadStatus;
  lastInteraction: string;
  estimatedValue: number;
};

export type AutomationRule = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
  category: ConversationCategory;
  confidence: number;
};
