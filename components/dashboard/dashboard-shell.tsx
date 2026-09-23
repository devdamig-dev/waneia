"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { WorkspaceProvider } from "@/components/dashboard/workspace-context";
import { WorkspaceConfigProvider } from "@/lib/workspace-config";
import { NotificationsProvider } from "@/lib/notifications";
import { CRMProvider } from "@/lib/crm-store";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <WorkspaceConfigProvider>
        <CRMProvider>
          <NotificationsProvider>
          <div className="flex min-h-screen bg-transparent">
            <Sidebar />
            <main className="flex-1 p-4 lg:p-8">
              <Topbar />
              {children}
            </main>
            <CommandPalette />
          </div>
          </NotificationsProvider>
        </CRMProvider>
      </WorkspaceConfigProvider>
    </WorkspaceProvider>
  );
}
