"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { WorkspaceProvider } from "@/components/dashboard/workspace-context";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen bg-transparent">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8">
          <Topbar />
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
