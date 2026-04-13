"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { workspaces } from "@/data/saas-data";

type WorkspaceContextType = {
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  activeWorkspace: (typeof workspaces)[number];
};

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(workspaces[0].id);

  const value = useMemo(() => {
    const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0];
    return { activeWorkspaceId, setActiveWorkspaceId, activeWorkspace };
  }, [activeWorkspaceId]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }
  return context;
}
