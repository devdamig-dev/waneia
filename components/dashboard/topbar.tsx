"use client";

import { Bell, Search } from "lucide-react";
import { workspaces } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";

export function Topbar() {
  const { activeWorkspaceId, setActiveWorkspaceId, activeWorkspace } = useWorkspace();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-zinc-400">
        <Search className="h-4 w-4" />
        <span className="text-sm">Buscar conversaciones, contactos o etiquetas</span>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={activeWorkspaceId}
          onChange={(event) => setActiveWorkspaceId(event.target.value)}
          className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-200"
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id} className="bg-[#0b1023]">
              {workspace.name}
            </option>
          ))}
        </select>
        <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
          Onboarding {activeWorkspace.onboardingCompletion}%
        </div>
        <button className="rounded-xl border border-white/10 bg-white/10 p-2 text-zinc-200"><Bell className="h-4 w-4" /></button>
        <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/20 px-3 py-2 text-sm font-semibold">CM</div>
      </div>
    </header>
  );
}
