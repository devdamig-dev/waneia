// Configurable entities — these can be edited by the user from the admin
// surfaces and persisted to localStorage per workspace.

export type CategoryUsage = {
  conversations: number;
  leads: number;
  automations: number;
  campaigns: number;
};

export type Category = {
  id: string;
  name: string;
  color: string; // tailwind color name (cyan, emerald, amber, rose, violet, sky, zinc)
  icon: string; // lucide icon name token
  isDefault: boolean;
  order: number;
  slaMinutes: number;
  defaultPriority: "alta" | "media" | "baja";
  automationRef: string; // free-text rule reference for now
  usage: CategoryUsage;
};

export type TagItem = {
  id: string;
  name: string;
  color: string;
  appliesTo: Array<"contactos" | "leads" | "conversaciones">;
};

export type PipelineStageStatusType = "abierto" | "ganado" | "perdido";

export type PipelineStageConfig = {
  id: string;
  name: string;
  color: string;
  probability: number; // 0..100
  slaTargetMinutes: number;
  automationTrigger: string; // free-text rule reference
  statusType: PipelineStageStatusType;
  order: number;
};

export type Pipeline = {
  id: string;
  name: string;
  isDefault: boolean;
  stages: PipelineStageConfig[];
};

export type DepartmentRole = "responsable" | "supervisor" | "operador" | "lectura";

export type DepartmentMember = {
  memberId: string; // tm-*
  role: DepartmentRole;
};

export type Department = {
  id: string;
  name: string;
  description: string;
  color: string;
  active: boolean;
  workingHours: string;
  memberIds: string[]; // tm-* (legacy, mantener por compatibilidad)
  members: DepartmentMember[]; // nuevo: con rol por miembro
  categoryIds: string[];
  slaMinutes: number;
  defaultBotId: string | null;
  routingRule: string;
};

export type AIProvider = "openai" | "anthropic" | "gemini" | "custom";
export type AITone = "profesional" | "cercano" | "comercial" | "tecnico";
export type AIFallback = "derivar humano" | "responder plantilla" | "pedir mas datos";

export type AISettings = {
  enabled: boolean;
  provider: AIProvider;
  model: string;
  apiKey: string;
  customEndpoint?: string;
  temperature: number; // 0..1
  tone: AITone;
  fallback: AIFallback;
  fallbackTemplateId: string | null;
  connectionStatus: "no probada" | "ok" | "error";
  lastTestedAt: string | null;
  monthlyMessageCap: number;
};

export type KnowledgeStatus = "borrador" | "activo";
export type KnowledgeTrainingStatus = "pendiente" | "entrenando" | "activo";
export type KnowledgeSourceType = "manual" | "pdf" | "url" | "catalogo" | "faq";

export type KnowledgeArticle = {
  id: string;
  title: string;
  departmentId: string | null;
  tags: string[];
  content: string;
  status: KnowledgeStatus;
  sourceType: KnowledgeSourceType;
  sourceRef?: string;
  trainingStatus: KnowledgeTrainingStatus;
  usedByAi: boolean;
  updatedAt: string;
};

export type BotNodeType =
  | "trigger"
  | "message"
  | "question"
  | "condition"
  | "buttons"
  | "assign"
  | "tag"
  | "create_lead"
  | "wait"
  | "end";

export type BotNode = {
  id: string;
  type: BotNodeType;
  label: string;
  body: string;
  options?: string[]; // for buttons / question / condition branches
  next?: string | null;
  branches?: Array<{ value: string; nextId: string | null }>;
  meta?: Record<string, string>;
};

export type BotFlowStatus = "borrador" | "activa" | "pausada";

export type BotFlow = {
  id: string;
  name: string;
  description: string;
  status: BotFlowStatus;
  trigger: string;
  nodes: BotNode[];
  updatedAt: string;
};

export type ConfigurableTemplate = {
  id: string;
  name: string;
  category: string; // category id or "general"
  channel: "whatsapp" | "general";
  approved: boolean; // simulated HSM approval
  body: string;
  variables: string[];
  shortcut?: string; // /atajo
};

export type AIPrompt = {
  id: string;
  name: string;
  intent: string;
  body: string;
  variables: string[];
  updatedAt: string;
};

export type AIModelProfile = {
  id: string;
  provider: AIProvider;
  model: string;
  alias: string;
  notes: string;
  costPer1kTokens: number;
  contextWindow: number;
  isPrimary: boolean;
};

export type HelpArticle = {
  id: string;
  title: string;
  category: "comenzando" | "whatsapp" | "ia" | "automatizaciones" | "campañas" | "facturacion" | "equipo";
  body: string;
  featured: boolean;
  contextLinks: string[];
  updatedAt: string;
};

export type WaneiaConfig = {
  categories: Category[];
  tags: TagItem[];
  pipelines: Pipeline[];
  defaultPipelineId: string;
  departments: Department[];
  ai: AISettings;
  aiPrompts: AIPrompt[];
  aiModelProfiles: AIModelProfile[];
  knowledge: KnowledgeArticle[];
  botFlows: BotFlow[];
  templates: ConfigurableTemplate[];
  helpArticles: HelpArticle[];
};
