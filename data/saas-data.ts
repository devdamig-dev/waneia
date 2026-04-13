import { PlanTier, UsageSummary } from "@/types/billing";
import { TeamMember } from "@/types/team";
import { OnboardingStep, Workspace } from "@/types/workspace";

export const workspaces: Workspace[] = [
  { id: "ws-1", name: "Mueblería Norte", industry: "Hogar", plan: "growth", onboardingCompletion: 72, whatsappStatus: "pendiente", teamMembersCount: 6, status: "active" },
  { id: "ws-2", name: "Academia Nova", industry: "Educación", plan: "starter", onboardingCompletion: 48, whatsappStatus: "no configurado", teamMembersCount: 3, status: "trial" },
  { id: "ws-3", name: "Clínica San Rafael", industry: "Salud", plan: "pro", onboardingCompletion: 93, whatsappStatus: "conectado", teamMembersCount: 12, status: "active" },
];

export const teamMembers: TeamMember[] = [
  { id: "tm-1", workspaceId: "ws-1", userId: "u-owner-1", name: "Camila Romero", email: "camila@north.com", role: "owner", status: "active", lastSeen: "Ahora" },
  { id: "tm-2", workspaceId: "ws-1", userId: "u-admin-1", name: "Nicolás Pereyra", email: "nico@north.com", role: "admin", status: "active", lastSeen: "Hace 5 min" },
  { id: "tm-3", workspaceId: "ws-1", userId: "u-operator-1", name: "Lucía Acosta", email: "lucia@north.com", role: "operator", status: "active", lastSeen: "Hace 13 min" },
  { id: "tm-4", workspaceId: "ws-1", userId: "u-viewer-1", name: "Sergio Varela", email: "sergio@north.com", role: "viewer", status: "invited", lastSeen: "Invitación pendiente" },
  { id: "tm-5", workspaceId: "ws-2", userId: "u-owner-2", name: "Valentina Ríos", email: "vale@nova.com", role: "owner", status: "active", lastSeen: "Ahora" },
  { id: "tm-6", workspaceId: "ws-3", userId: "u-owner-3", name: "Diego Salvatierra", email: "diego@sanrafael.com", role: "owner", status: "active", lastSeen: "Hace 2 min" },
];

export const planTiers: PlanTier[] = [
  { id: "starter", name: "Starter", conversationsIncluded: "1.500 / mes", usersIncluded: "3 usuarios", automationLimit: "5 reglas", analyticsLevel: "Básico", supportLevel: "Email", priceLabel: "US$49" },
  { id: "growth", name: "Growth", conversationsIncluded: "8.000 / mes", usersIncluded: "10 usuarios", automationLimit: "25 reglas", analyticsLevel: "Avanzado", supportLevel: "Prioritario", priceLabel: "US$149" },
  { id: "pro", name: "Pro", conversationsIncluded: "Ilimitadas*", usersIncluded: "Usuarios ilimitados", automationLimit: "Ilimitadas", analyticsLevel: "Executive", supportLevel: "CSM + SLA", priceLabel: "US$399" },
];

export const usageByWorkspace: UsageSummary[] = [
  { workspaceId: "ws-1", conversationsUsed: 5120, conversationsLimit: 8000, usersUsed: 6, usersLimit: 10, automationsUsed: 14, automationsLimit: 25 },
  { workspaceId: "ws-2", conversationsUsed: 880, conversationsLimit: 1500, usersUsed: 3, usersLimit: 3, automationsUsed: 4, automationsLimit: 5 },
  { workspaceId: "ws-3", conversationsUsed: 14890, conversationsLimit: 20000, usersUsed: 12, usersLimit: 999, automationsUsed: 41, automationsLimit: 999 },
];

export const onboardingSteps: OnboardingStep[] = [
  { id: "negocio", title: "Datos del negocio", description: "Nombre comercial, país y tamaño del equipo." },
  { id: "rubro", title: "Rubro", description: "Definí industria y objetivos comerciales." },
  { id: "horarios", title: "Horarios de atención", description: "Configurá ventanas de respuesta y SLA." },
  { id: "bienvenida", title: "Mensaje de bienvenida", description: "Primer mensaje y tono de marca." },
  { id: "humano", title: "Derivación a humano", description: "Reglas de escalamiento operativo." },
  { id: "whatsapp", title: "Integración WhatsApp", description: "Conectar número y validar webhook." },
  { id: "automatizacion", title: "Primer automatización", description: "Publicar regla inicial para leads." },
];

export const whatsappConnectionData = {
  "ws-1": { phoneNumber: "+54 11 4190 0020", businessAccountId: "BA-889120", webhookStatus: "Pendiente validación", lastSync: "Hace 2 horas" },
  "ws-2": { phoneNumber: "—", businessAccountId: "—", webhookStatus: "No configurado", lastSync: "Nunca" },
  "ws-3": { phoneNumber: "+54 11 7000 1200", businessAccountId: "BA-120011", webhookStatus: "Activo", lastSync: "Hace 5 min" },
} as const;
