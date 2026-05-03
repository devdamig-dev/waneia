export type WorkspacePlan = "starter" | "growth" | "pro";
export type WorkspaceStatus = "active" | "trial" | "at-risk";
export type WhatsAppConnectionStatus = "no configurado" | "pendiente" | "conectado" | "error";

export type Workspace = {
  id: string;
  name: string;
  industry: string;
  country: string;
  plan: WorkspacePlan;
  onboardingCompletion: number;
  whatsappStatus: WhatsAppConnectionStatus;
  teamMembersCount: number;
  status: WorkspaceStatus;
  createdAt: string;
};

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  href: string;
};
