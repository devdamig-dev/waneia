"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { teamMembers } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { UserRole } from "@/types/team";

const roleStyles: Record<UserRole, string> = {
  owner: "bg-violet-500/20 text-violet-100",
  admin: "bg-cyan-500/20 text-cyan-100",
  operator: "bg-emerald-500/20 text-emerald-100",
  viewer: "bg-zinc-500/20 text-zinc-200",
};

export function TeamClient() {
  const { activeWorkspaceId } = useWorkspace();
  const [members, setMembers] = useState(teamMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("operator");

  const workspaceMembers = useMemo(() => members.filter((member) => member.workspaceId === activeWorkspaceId), [members, activeWorkspaceId]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-sm font-semibold">Invitar miembro (mock)</p>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_180px_130px]">
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@empresa.com" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm" />
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <option value="owner">owner</option><option value="admin">admin</option><option value="operator">operator</option><option value="viewer">viewer</option>
          </select>
          <button onClick={() => setMembers((prev) => [{ id: `tm-${Date.now()}`, workspaceId: activeWorkspaceId, userId: `u-${Date.now()}`, name: inviteEmail.split("@")[0] || "Invitado", email: inviteEmail, role: inviteRole, status: "invited", lastSeen: "Invitación pendiente" }, ...prev])} className="rounded-xl border border-emerald-300/30 bg-emerald-500/20 px-3 py-2 text-sm">Enviar invitación</button>
        </div>
      </Card>

      <Card className="p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-zinc-400"><th className="pb-2">Miembro</th><th className="pb-2">Rol</th><th className="pb-2">Estado</th><th className="pb-2">Última actividad</th><th className="pb-2">Acciones</th></tr></thead>
          <tbody className="divide-y divide-white/10">
            {workspaceMembers.map((member) => (
              <tr key={member.id}>
                <td className="py-3"><p className="font-medium">{member.name}</p><p className="text-xs text-zinc-500">{member.email}</p></td>
                <td>
                  <select value={member.role} onChange={(e) => setMembers((prev) => prev.map((item) => item.id === member.id ? { ...item, role: e.target.value as UserRole } : item))} className={`rounded-full px-2 py-1 text-xs ${roleStyles[member.role]}`}>
                    <option value="owner">owner</option><option value="admin">admin</option><option value="operator">operator</option><option value="viewer">viewer</option>
                  </select>
                </td>
                <td>{member.status}</td>
                <td>{member.lastSeen}</td>
                <td><button onClick={() => setMembers((prev) => prev.filter((item) => item.id !== member.id))} className="text-xs text-rose-200">Quitar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
