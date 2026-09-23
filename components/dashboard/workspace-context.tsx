"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Workspace } from "@/types/workspace";
import type { TeamMember, UserRole } from "@/types/team";

type WorkspaceContextType = {
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  activeWorkspace: Workspace;
  workspaces: Workspace[];
  teamMembers: TeamMember[];
  currentUserId: string;
  currentUserName: string;
  currentUserEmail: string;
  loading: boolean;
  refreshWorkspaces: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const emptyWorkspace: Workspace = {
  id: "",
  name: "Cargando…",
  industry: "",
  country: "Argentina",
  plan: "starter",
  onboardingCompletion: 0,
  whatsappStatus: "no configurado",
  teamMembersCount: 0,
  status: "active",
  createdAt: new Date(0).toISOString(),
};

function mapRole(role: string): UserRole {
  if (role === "owner") return "owner";
  if (role === "admin" || role === "supervisor") return "admin";
  return "operator";
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const refreshWorkspaces = async () => {
    setLoading(true);

    const [{ data: userData }, { data: workspaceRows }, { data: memberRows }, { data: whatsappRows }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("workspaces").select("*").order("created_at", { ascending: true }),
      supabase.from("workspace_members").select("*").eq("active", true),
      supabase.from("whatsapp_accounts").select("workspace_id,status"),
    ]);

    const user = userData.user;
    if (user) {
      setCurrentUserId(user.id);
      setCurrentUserEmail(user.email ?? "");
      const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
      setCurrentUserName(fullName || user.email?.split("@")[0] || "Usuario");
    }

    const members = memberRows ?? [];
    const waByWorkspace = new Map((whatsappRows ?? []).map((row) => [row.workspace_id, row.status]));

    const mappedWorkspaces: Workspace[] = (workspaceRows ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      industry: row.industry ?? "",
      country: "Argentina",
      plan: "starter",
      onboardingCompletion: waByWorkspace.get(row.id) === "connected" ? 100 : 70,
      whatsappStatus:
        waByWorkspace.get(row.id) === "connected"
          ? "conectado"
          : waByWorkspace.has(row.id)
            ? "pendiente"
            : "no configurado",
      teamMembersCount: members.filter((member) => member.workspace_id === row.id).length,
      status: "active",
      createdAt: row.created_at,
    }));

    const mappedMembers: TeamMember[] = members.map((row) => ({
      id: row.user_id,
      workspaceId: row.workspace_id,
      userId: row.user_id,
      name: row.full_name || row.email?.split("@")[0] || "Usuario",
      email: row.email ?? "",
      role: mapRole(row.role),
      status: "active",
      availability: row.user_id === user?.id ? "online" : "offline",
      assignedConversations: 0,
      resolvedToday: 0,
      responseTimeMinutes: 0,
      lastSeen: row.user_id === user?.id ? "Ahora" : "—",
    }));

    setWorkspaces(mappedWorkspaces);
    setTeamMembers(mappedMembers);

    const saved = typeof window !== "undefined" ? window.localStorage.getItem("waneia.active-workspace") : null;
    const nextId =
      (saved && mappedWorkspaces.some((workspace) => workspace.id === saved) ? saved : null) ??
      mappedWorkspaces[0]?.id ??
      "";

    setActiveWorkspaceIdState((current) =>
      current && mappedWorkspaces.some((workspace) => workspace.id === current) ? current : nextId,
    );
    setLoading(false);
  };

  useEffect(() => {
    void refreshWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveWorkspaceId = (id: string) => {
    setActiveWorkspaceIdState(id);
    try {
      window.localStorage.setItem("waneia.active-workspace", id);
    } catch {
      // Selection still works without local persistence.
    }
  };

  const value = useMemo(() => {
    const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0] ?? emptyWorkspace;
    return {
      activeWorkspaceId,
      setActiveWorkspaceId,
      activeWorkspace,
      workspaces,
      teamMembers,
      currentUserId,
      currentUserName,
      currentUserEmail,
      loading,
      refreshWorkspaces,
    };
  }, [activeWorkspaceId, workspaces, teamMembers, currentUserId, currentUserName, currentUserEmail, loading]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}
