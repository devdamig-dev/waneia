import { WorkspacePlan } from "@/types/workspace";

export type ConversationCategory = "presupuesto" | "pedido" | "consulta" | "soporte humano";

export type ConversationStatus =
  | "urgente"
  | "sin responder"
  | "en seguimiento"
  | "pendiente"
  | "ganada"
  | "perdida";

export type ConversationPriority = "alta" | "media" | "baja";

export type Message = {
  id: string;
  sender: "customer" | "system" | "agent";
  agentName?: string;
  content: string;
  timestamp: string;
  read?: boolean;
};

export type ActivityEvent = {
  id: string;
  type: "intent" | "score" | "ai" | "assignment" | "tag" | "note" | "stage" | "sla";
  label: string;
  when: string;
};

export type Conversation = {
  id: string;
  workspaceId: string;
  contactId: string;
  customerName: string;
  phone: string;
  businessName: string;
  lastMessage: string;
  category: ConversationCategory;
  status: ConversationStatus;
  priority: ConversationPriority;
  intent: string;
  leadScore: number;
  slaMinutesRemaining: number;
  assignedAgentId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  estimatedOpportunity?: string;
  internalNotes: string;
  messages: Message[];
  activity: ActivityEvent[];
  suggestedReply: string;
  nextTask: string;
};

export type LeadStage =
  | "nuevo"
  | "contactado"
  | "cotizando"
  | "negociacion"
  | "ganado"
  | "perdido";

export type Lead = {
  id: string;
  workspaceId: string;
  conversationId?: string;
  contactId: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  business: string;
  category: ConversationCategory;
  stage: LeadStage;
  assignedAgentId: string;
  tags: string[];
  estimatedValue: number;
  nextFollowUp: string;
  lastInteraction: string;
  notes: string;
};

export type PipelineStage = {
  id: LeadStage;
  label: string;
  color: string;
  description: string;
};

export type ContactLifecycle =
  | "nuevo"
  | "lead"
  | "cliente activo"
  | "cliente inactivo"
  | "perdido";

export type Contact = {
  id: string;
  workspaceId: string;
  name: string;
  phone: string;
  email?: string;
  business?: string;
  source: string;
  lifecycle: ContactLifecycle;
  assignedAgentId: string | null;
  optIn: boolean;
  tags: string[];
  lastInteraction: string;
  totalConversations: number;
};

export type Segment = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  color: string;
  ruleSummary: string;
  contactIds: string[];
};

export type CampaignStatus = "borrador" | "programada" | "enviada" | "pausada";

export type Campaign = {
  id: string;
  workspaceId: string;
  name: string;
  status: CampaignStatus;
  segmentId: string;
  templateId: string;
  scheduledFor?: string;
  estimatedRecipients: number;
  sentRecipients: number;
  openRate?: number;
  replyRate?: number;
  conversionRate?: number;
  preview: string;
  createdAt: string;
};

export type MessageTemplate = {
  id: string;
  workspaceId: string;
  name: string;
  category: ConversationCategory | "campaña" | "general";
  body: string;
  variables: string[];
};

export type AutomationStatus = "borrador" | "test" | "activa" | "pausada";

export type AutomationTrigger = {
  type: "palabras clave" | "intent" | "segmento" | "horario";
  value: string;
};

export type AutomationCondition = {
  id: string;
  logic: "AND" | "OR";
  field: string;
  operator: string;
  value: string;
};

export type AutomationAction = {
  id: string;
  type:
    | "responder"
    | "asignar agente"
    | "agregar etiqueta"
    | "crear lead"
    | "notificar equipo";
  value: string;
};

export type AutomationRule = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: AutomationStatus;
  category: ConversationCategory;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  responseMessage: string;
  triggeredCount: number;
  replyRate: number;
  conversionEstimate: number;
  lastExecuted: string;
  history: Array<{ id: string; detectedMessage: string; result: string; when: string }>;
};

export type SlaRule = {
  id: string;
  category: ConversationCategory;
  responseMinutes: number;
  resolutionMinutes: number;
};

export type BusinessSettings = {
  workspaceId: string;
  plan: WorkspacePlan;
  businessName: string;
  industry: string;
  country: string;
  timezone: string;
  primaryColor: string;
  brandName: string;
  welcomeMessage: string;
  offHoursMessage: string;
  handoffMessage: string;
  workingDays: string;
  startHour: string;
  endHour: string;
  slaRules: SlaRule[];
  queues: string[];
  defaultTags: string[];
  autoAssign: boolean;
  aiEnabled: boolean;
  pauseLowConfidence: boolean;
  notifyHumanHandoff: boolean;
};
