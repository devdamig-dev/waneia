export type UserRole = "owner" | "admin" | "operator" | "viewer";

export type TeamMember = {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "invited";
  lastSeen: string;
};
