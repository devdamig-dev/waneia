"use client";

import { useMemo, useState } from "react";
import { Mail, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { teamMembers as seedMembers } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { AgentAvailability, TeamMember, UserRole } from "@/types/team";

const roleStyles: Record<UserRole, string> = {
  owner: "border-violet-300/40 bg-violet-500/10 text-violet-100",
  admin: "border-cyan-300/40 bg-cyan-500/10 text-cyan-100",
  operator: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100",
  viewer: "border-zinc-300/40 bg-zinc-500/10 text-zinc-200",
};

const availabilityStyles: Record<AgentAvailability, string> = {
  online: "bg-emerald-400",
  ocupado: "bg-amber-400",
  ausente: "bg-rose-400",
  offline: "bg-zinc-500",
};

export function TeamClient() {
  const { activeWorkspaceId } = useWorkspace();
  const [members, setMembers] = useState<TeamMember[]>(seedMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("operator");
  const [toast, setToast] = useState("");

  const workspaceMembers = useMemo(
    () => members.filter((m) => m.workspaceId === activeWorkspaceId),
    [members, activeWorkspaceId],
  );

  const totalAssigned = workspaceMembers.reduce((acc, m) => acc + m.assignedConversations, 0);
  const totalResolved = workspaceMembers.reduce((acc, m) => acc + m.resolvedToday, 0);
  const onlineCount = workspaceMembers.filter((m) => m.availability === "online").length;

  const invite = () => {
    if (!inviteEmail.includes("@")) {
      setToast("Ingresá un email válido.");
      return;
    }
    const created: TeamMember = {
      id: `tm-${Date.now()}`,
      workspaceId: activeWorkspaceId,
      userId: `u-${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "invited",
      availability: "offline",
      assignedConversations: 0,
      resolvedToday: 0,
      responseTimeMinutes: 0,
      lastSeen: "Invitación pendiente",
    };
    setMembers((prev) => [created, ...prev]);
    setInviteEmail("");
    setToast("Invitación enviada (mock).");
  };

  const setAvailability = (id: string, value: AgentAvailability) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, availability: value } : m)));

  const setRole = (id: string, role: UserRole) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));

  const remove = (id: string) => setMembers((prev) => prev.filter((m) => m.id !== id));

  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Miembros</p><p className="mt-1 text-2xl font-bold">{workspaceMembers.length}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Online ahora</p><p className="mt-1 text-2xl font-bold text-emerald-100">{onlineCount}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Conversaciones asignadas</p><p className="mt-1 text-2xl font-bold text-cyan-100">{totalAssigned}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Resueltas hoy</p><p className="mt-1 text-2xl font-bold text-violet-100">{totalResolved}</p></Card>
      </div>

      <Card className="mt-4 p-4">
        <p className="text-sm font-semibold inline-flex items-center gap-2"><UserPlus className="h-4 w-4 text-emerald-300" />Invitar miembro</p>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_180px_160px]">
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@empresa.com" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm" />
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
            <option value="owner" className="bg-[#0b1023]">owner</option>
            <option value="admin" className="bg-[#0b1023]">admin</option>
            <option value="operator" className="bg-[#0b1023]">operator</option>
            <option value="viewer" className="bg-[#0b1023]">viewer</option>
          </select>
          <Button onClick={invite} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Mail className="mr-1 h-4 w-4" />Enviar invitación</Button>
        </div>
      </Card>

      <Card className="mt-4 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-zinc-400">
              <th className="p-3">Miembro</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Disponibilidad</th>
              <th className="p-3">Workload</th>
              <th className="p-3">Resueltas hoy</th>
              <th className="p-3">Tiempo respuesta</th>
              <th className="p-3">Última actividad</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {workspaceMembers.map((m) => (
              <tr key={m.id} className="hover:bg-white/5">
                <td className="p-3"><p className="font-medium">{m.name}</p><p className="text-[11px] text-zinc-500">{m.email}</p></td>
                <td className="p-3">
                  <select value={m.role} onChange={(e) => setRole(m.id, e.target.value as UserRole)} className={`rounded-full border px-2 py-0.5 text-[11px] ${roleStyles[m.role]}`}>
                    <option value="owner" className="bg-[#0b1023]">owner</option>
                    <option value="admin" className="bg-[#0b1023]">admin</option>
                    <option value="operator" className="bg-[#0b1023]">operator</option>
                    <option value="viewer" className="bg-[#0b1023]">viewer</option>
                  </select>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${availabilityStyles[m.availability]}`} />
                    <select value={m.availability} onChange={(e) => setAvailability(m.id, e.target.value as AgentAvailability)} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px]">
                      <option value="online" className="bg-[#0b1023]">online</option>
                      <option value="ocupado" className="bg-[#0b1023]">ocupado</option>
                      <option value="ausente" className="bg-[#0b1023]">ausente</option>
                      <option value="offline" className="bg-[#0b1023]">offline</option>
                    </select>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${Math.min(m.assignedConversations * 10, 100)}%` }} />
                    </div>
                    <span className="text-[11px] text-zinc-300">{m.assignedConversations}</span>
                  </div>
                </td>
                <td className="p-3 text-zinc-300">{m.resolvedToday}</td>
                <td className="p-3 text-zinc-300">{m.responseTimeMinutes ? `${m.responseTimeMinutes}m` : "—"}</td>
                <td className="p-3 text-zinc-300">{m.lastSeen}</td>
                <td className="p-3 text-right"><button onClick={() => remove(m.id)} className="text-xs text-rose-200 hover:text-rose-100">Quitar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
