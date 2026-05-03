import { WorkspacePlan } from "@/types/workspace";

export type PlanFeature = {
  label: string;
  included: boolean;
  highlight?: boolean;
};

export type PlanTier = {
  id: WorkspacePlan;
  name: string;
  tagline: string;
  conversationsIncluded: string;
  usersIncluded: string;
  automationLimit: string;
  campaignsIncluded: string;
  analyticsLevel: string;
  whatsappIntegration: string;
  supportLevel: string;
  priceLabel: string;
  priceMonthly: number;
  features: PlanFeature[];
  recommended?: boolean;
};

export type UsageSummary = {
  workspaceId: string;
  conversationsUsed: number;
  conversationsLimit: number;
  usersUsed: number;
  usersLimit: number;
  automationsUsed: number;
  automationsLimit: number;
  campaignsUsed: number;
  campaignsLimit: number;
};
