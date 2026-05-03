export type UserRole = "owner" | "admin" | "operator" | "viewer";

export type AgentAvailability = "online" | "ocupado" | "ausente" | "offline";

export type TeamMember = {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "invited";
  availability: AgentAvailability;
  assignedConversations: number;
  resolvedToday: number;
  responseTimeMinutes: number;
  lastSeen: string;
};
