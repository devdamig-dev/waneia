import { PlanTier, UsageSummary } from "@/types/billing";
import { TeamMember } from "@/types/team";
import { OnboardingStep, Workspace } from "@/types/workspace";

export const workspaces: Workspace[] = [
  { id: "ws-1", name: "Mueblería Norte", industry: "Hogar", country: "Argentina", plan: "growth", onboardingCompletion: 72, whatsappStatus: "pendiente", teamMembersCount: 6, status: "active", createdAt: "2026-01-12T10:00:00Z" },
  { id: "ws-2", name: "Academia Nova", industry: "Educación", country: "Argentina", plan: "starter", onboardingCompletion: 48, whatsappStatus: "no configurado", teamMembersCount: 3, status: "trial", createdAt: "2026-03-22T14:00:00Z" },
  { id: "ws-3", name: "Clínica San Rafael", industry: "Salud", country: "Argentina", plan: "pro", onboardingCompletion: 93, whatsappStatus: "conectado", teamMembersCount: 12, status: "active", createdAt: "2025-09-04T09:00:00Z" },
];

export const teamMembers: TeamMember[] = [
  { id: "tm-1", workspaceId: "ws-1", userId: "u-owner-1", name: "Camila Romero", email: "camila@north.com", role: "owner", status: "active", availability: "online", assignedConversations: 4, resolvedToday: 11, responseTimeMinutes: 3, lastSeen: "Ahora" },
  { id: "tm-2", workspaceId: "ws-1", userId: "u-admin-1", name: "Nicolás Pereyra", email: "nico@north.com", role: "admin", status: "active", availability: "online", assignedConversations: 6, resolvedToday: 9, responseTimeMinutes: 4, lastSeen: "Hace 5 min" },
  { id: "tm-3", workspaceId: "ws-1", userId: "u-operator-1", name: "Lucía Acosta", email: "lucia@north.com", role: "operator", status: "active", availability: "ocupado", assignedConversations: 12, resolvedToday: 14, responseTimeMinutes: 2, lastSeen: "Hace 13 min" },
  { id: "tm-4", workspaceId: "ws-1", userId: "u-viewer-1", name: "Sergio Varela", email: "sergio@north.com", role: "viewer", status: "invited", availability: "offline", assignedConversations: 0, resolvedToday: 0, responseTimeMinutes: 0, lastSeen: "Invitación pendiente" },
  { id: "tm-5", workspaceId: "ws-2", userId: "u-owner-2", name: "Valentina Ríos", email: "vale@nova.com", role: "owner", status: "active", availability: "online", assignedConversations: 5, resolvedToday: 7, responseTimeMinutes: 4, lastSeen: "Ahora" },
  { id: "tm-6", workspaceId: "ws-3", userId: "u-owner-3", name: "Diego Salvatierra", email: "diego@sanrafael.com", role: "owner", status: "active", availability: "online", assignedConversations: 9, resolvedToday: 18, responseTimeMinutes: 2, lastSeen: "Hace 2 min" },
  { id: "tm-7", workspaceId: "ws-3", userId: "u-admin-3", name: "Florencia Aguirre", email: "flor@sanrafael.com", role: "admin", status: "active", availability: "ausente", assignedConversations: 3, resolvedToday: 4, responseTimeMinutes: 6, lastSeen: "Hace 30 min" },
  { id: "tm-8", workspaceId: "ws-3", userId: "u-op-3", name: "Martín Yáñez", email: "martin@sanrafael.com", role: "operator", status: "active", availability: "online", assignedConversations: 11, resolvedToday: 15, responseTimeMinutes: 3, lastSeen: "Hace 1 min" },
];

export const planTiers: PlanTier[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Para PyMEs que están profesionalizando su atención por WhatsApp.",
    conversationsIncluded: "1.500 / mes",
    usersIncluded: "3 usuarios",
    automationLimit: "5 reglas",
    campaignsIncluded: "2 / mes",
    analyticsLevel: "Básico",
    whatsappIntegration: "WhatsApp Business API ready",
    supportLevel: "Email",
    priceLabel: "US$49",
    priceMonthly: 49,
    features: [
      { label: "Inbox compartido multi-agente", included: true },
      { label: "Hasta 5 automatizaciones", included: true },
      { label: "Pipeline CRM básico", included: true },
      { label: "Campañas WhatsApp ilimitadas", included: false },
      { label: "Analytics avanzado", included: false },
      { label: "SLA + alertas", included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Para equipos comerciales que ya operan con volumen y automatización.",
    conversationsIncluded: "8.000 / mes",
    usersIncluded: "10 usuarios",
    automationLimit: "25 reglas",
    campaignsIncluded: "10 / mes",
    analyticsLevel: "Avanzado",
    whatsappIntegration: "WhatsApp Business API ready",
    supportLevel: "Prioritario",
    priceLabel: "US$149",
    priceMonthly: 149,
    recommended: true,
    features: [
      { label: "Todo lo de Starter", included: true },
      { label: "Hasta 25 automatizaciones avanzadas", included: true },
      { label: "Campañas WhatsApp segmentadas", included: true, highlight: true },
      { label: "Pipeline kanban + tareas", included: true },
      { label: "Analytics avanzado + SLA", included: true },
      { label: "Roles y permisos granulares", included: true },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Para empresas con operaciones multi-equipo y SLA exigente.",
    conversationsIncluded: "Ilimitadas*",
    usersIncluded: "Usuarios ilimitados",
    automationLimit: "Ilimitadas",
    campaignsIncluded: "Ilimitadas",
    analyticsLevel: "Executive",
    whatsappIntegration: "WhatsApp Business API + multi-número",
    supportLevel: "CSM + SLA",
    priceLabel: "US$399",
    priceMonthly: 399,
    features: [
      { label: "Todo lo de Growth", included: true },
      { label: "Multi-número WhatsApp", included: true, highlight: true },
      { label: "Automatizaciones ilimitadas", included: true },
      { label: "Analytics Executive + exportación", included: true },
      { label: "Audit log + compliance", included: true },
      { label: "CSM dedicado + SLA contractual", included: true },
    ],
  },
];

export const usageByWorkspace: UsageSummary[] = [
  { workspaceId: "ws-1", conversationsUsed: 5120, conversationsLimit: 8000, usersUsed: 6, usersLimit: 10, automationsUsed: 14, automationsLimit: 25, campaignsUsed: 4, campaignsLimit: 10 },
  { workspaceId: "ws-2", conversationsUsed: 880, conversationsLimit: 1500, usersUsed: 3, usersLimit: 3, automationsUsed: 4, automationsLimit: 5, campaignsUsed: 1, campaignsLimit: 2 },
  { workspaceId: "ws-3", conversationsUsed: 14890, conversationsLimit: 20000, usersUsed: 12, usersLimit: 999, automationsUsed: 41, automationsLimit: 999, campaignsUsed: 8, campaignsLimit: 999 },
];

export const onboardingSteps: OnboardingStep[] = [
  { id: "negocio", title: "Datos del negocio", description: "Nombre comercial, país y tamaño del equipo.", href: "/dashboard/configuracion" },
  { id: "rubro", title: "Rubro y objetivos", description: "Definí industria y objetivos comerciales.", href: "/dashboard/configuracion" },
  { id: "horarios", title: "Horarios y SLA", description: "Configurá ventanas de respuesta y reglas SLA.", href: "/dashboard/configuracion" },
  { id: "categorias", title: "Categorías y etiquetas", description: "Adaptá las categorías a tu negocio.", href: "/dashboard/configuracion/categorias" },
  { id: "pipelines", title: "Pipelines y etapas", description: "Definí tu pipeline comercial y de soporte.", href: "/dashboard/configuracion/pipelines" },
  { id: "departamentos", title: "Departamentos y colas", description: "Organizá equipos y ruteo del inbox.", href: "/dashboard/configuracion/departamentos" },
  { id: "equipo", title: "Equipo y roles", description: "Invitá a tu equipo y asigná permisos.", href: "/dashboard/equipo" },
  { id: "whatsapp", title: "Conectar WhatsApp", description: "Vinculá tu número y validá webhook.", href: "/dashboard/integracion-whatsapp" },
  { id: "ia", title: "Configurar IA", description: "Elegí proveedor, modelo y tono del asistente.", href: "/dashboard/ia" },
  { id: "conocimiento", title: "Base de conocimiento", description: "Cargá artículos para entrenar al asistente.", href: "/dashboard/base-conocimiento" },
  { id: "plantillas", title: "Plantillas de mensajes", description: "Centralizá respuestas rápidas y plantillas WhatsApp.", href: "/dashboard/plantillas" },
  { id: "bot", title: "Primer flujo de bot", description: "Diseñá un flujo de bienvenida y derivación.", href: "/dashboard/bots" },
  { id: "automatizacion", title: "Primera automatización", description: "Publicá la regla inicial para leads.", href: "/dashboard/automatizaciones" },
  { id: "campaña", title: "Primera campaña", description: "Preparar campaña segmentada lista para envío.", href: "/dashboard/campanias" },
];

export const whatsappConnectionData = {
  "ws-1": { phoneNumber: "+54 11 4190 0020", businessAccountId: "BA-889120", webhookStatus: "Pendiente validación", lastSync: "Hace 2 horas" },
  "ws-2": { phoneNumber: "—", businessAccountId: "—", webhookStatus: "No configurado", lastSync: "Nunca" },
  "ws-3": { phoneNumber: "+54 11 7000 1200", businessAccountId: "BA-120011", webhookStatus: "Activo", lastSync: "Hace 5 min" },
} as const;
