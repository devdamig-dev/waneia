import { WorkspacePlan } from "@/types/workspace";

export type PlanTier = {
  id: WorkspacePlan;
  name: string;
  conversationsIncluded: string;
  usersIncluded: string;
  automationLimit: string;
  analyticsLevel: string;
  supportLevel: string;
  priceLabel: string;
};

export type UsageSummary = {
  workspaceId: string;
  conversationsUsed: number;
  conversationsLimit: number;
  usersUsed: number;
  usersLimit: number;
  automationsUsed: number;
  automationsLimit: number;
};
