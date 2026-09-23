"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Mail, Trash2, UserPlus, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/team";

type InviteRole = "admin" | "supervisor" | "agent";
type PendingInvite = {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
};

const roleStyles: Record<UserRole, string> = {
  owner: "border-violet-300/30 bg-violet-500/10 text-violet-100",
  admin: "border-cyan-300/30 bg-cyan-500/10 text-cyan-100",
  operator: "border-emerald-300/30 bg-emerald-500/10 text-emerald-100",
  viewer: "border-zinc-300/30 bg-zinc-500/10 text-zinc-200",
};

function backendRole(role: UserRole) {
  if (role === "owner") return "owner";
  if (role === "admin") return "admin";
  return "agent";
}

export function TeamClient() {
  const {
    activeWorkspaceId,
    teamMembers,
    currentUserId,
    refreshWorkspaces,
  } = useWorkspace();
  const supabase = useMemo(() => createClient(), []);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("agent");
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [lastInviteLink, setLastInviteLink] = useState("");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  const workspaceMembers = useMemo(
    () => teamMembers.filter((member) => member.workspaceId === activeWorkspaceId),
    [teamMembers, activeWorkspaceId],
  );

  const currentMember = workspaceMembers.find((member) => member.userId === currentUserId);
  const canManage = currentMember?.role === "owner" || currentMember?.role === "admin";

  const loadInvites = async () => {
    if (!activeWorkspaceId || !canManage) {
      setPendingInvites([]);
      return;
    }
    const { data, error } = await supabase
      .from("workspace_invites")
      .select("id,email,role,expires_at,created_at")
      .eq("workspace_id", activeWorkspaceId)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      setToast(error.message);
      return;
    }
    setPendingInvites(data ?? []);
  };

  useEffect(() => {
    void loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId, canManage]);

  const createInvite = async () => {
    if (!canManage || !activeWorkspaceId || !currentUserId) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      setToast("Ingresá un email válido.");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from("workspace_invites")
      .insert({
        workspace_id: activeWorkspaceId,
        email,
        role: inviteRole,
        invited_by: currentUserId,
      })
      .select("id")
      .single();

    if (error || !data) {
      setToast(error?.message || "No se pudo generar la invitación.");
      setSaving(false);
      return;
    }

    const link = `${window.location.origin}/join/${data.id}`;
    setLastInviteLink(link);
    setInviteEmail("");
    setToast("Invitación creada. Copiá el link y envialo al integrante.");
    await loadInvites();
    setSaving(false);
  };

  const copyLink = async (id?: string) => {
    const link = id ? `${window.location.origin}/join/${id}` : lastInviteLink;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setToast("Link de invitación copiado.");
    } catch {
      setToast("No se pudo copiar automáticamente.");
    }
  };

  const cancelInvite = async (id: string) => {
    const { error } = await supabase.from("workspace_invites").delete().eq("id", id);
    if (error) {
      setToast(error.message);
      return;
    }
    await loadInvites();
    setToast("Invitación cancelada.");
  };

  const changeRole = async (userId: string, role: UserRole) => {
    if (!canManage || userId === currentUserId) return;
    const { error } = await supabase
      .from("workspace_members")
      .update({ role: backendRole(role) })
      .eq("workspace_id", activeWorkspaceId)
      .eq("user_id", userId);

    if (error) {
      setToast(error.message);
      return;
    }
    await refreshWorkspaces();
    setToast("Rol actualizado.");
  };

  const removeMember = async (userId: string) => {
    if (!canManage || userId === currentUserId) return;
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", activeWorkspaceId)
      .eq("user_id", userId);

    if (error) {
      setToast(error.message);
      return;
    }
    await refreshWorkspaces();
    setToast("Integrante quitado del workspace.");
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Integrantes</p>
          <p className="mt-2 text-2xl font-bold">{workspaceMembers.length}</p>
          <p className="mt-1 text-xs text-zinc-500">usuarios con acceso</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Invitaciones</p>
          <p className="mt-2 text-2xl font-bold text-cyan-100">{pendingInvites.length}</p>
          <p className="mt-1 text-xs text-zinc-500">links pendientes</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Tu rol</p>
          <p className="mt-2 text-xl font-bold capitalize">{currentMember?.role ?? "—"}</p>
          <p className="mt-1 text-xs text-zinc-500">{canManage ? "podés administrar equipo" : "acceso operativo"}</p>
        </Card>
      </div>

      {canManage ? (
        <Card className="mt-4 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <UserPlus className="h-4 w-4 text-emerald-300" />
            Invitar al equipo
          </p>
          <p className="mt-1 text-xs text-zinc-500">El link dura 7 días y sólo funciona con el email indicado.</p>

          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_180px_170px]">
            <input
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="vendedor@empresa.com"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
            <select
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as InviteRole)}
              className="rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-sm"
            >
              <option value="agent">Vendedor / operador</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Administrador</option>
            </select>
            <Button onClick={createInvite} disabled={saving} className="bg-emerald-500/30 hover:bg-emerald-500/40">
              <Mail className="mr-1 h-4 w-4" />
              Generar invitación
            </Button>
          </div>

          {lastInviteLink ? (
            <div className="mt-3 flex gap-2 rounded-xl border border-emerald-300/20 bg-emerald-500/5 p-3">
              <input readOnly value={lastInviteLink} className="min-w-0 flex-1 bg-transparent font-mono text-xs text-emerald-100 outline-none" />
              <Button onClick={() => void copyLink()}><Copy className="h-4 w-4" /></Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card className="mt-4 overflow-hidden p-0">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <UsersRound className="h-4 w-4 text-cyan-200" />
            Equipo actual
          </p>
        </div>

        <div className="divide-y divide-white/5">
          {workspaceMembers.map((member) => (
            <div key={member.userId} className="grid gap-3 px-4 py-3 md:grid-cols-[1.4fr_180px_120px] md:items-center">
              <div>
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-[11px] text-zinc-500">{member.email}{member.userId === currentUserId ? " · vos" : ""}</p>
              </div>

              {member.role === "owner" || !canManage || member.userId === currentUserId ? (
                <span className={`w-fit rounded-full border px-2 py-1 text-[11px] ${roleStyles[member.role]}`}>{member.role}</span>
              ) : (
                <select
                  value={member.role}
                  onChange={(event) => void changeRole(member.userId, event.target.value as UserRole)}
                  className="rounded-xl border border-white/10 bg-[#0b1023] px-3 py-2 text-xs"
                >
                  <option value="operator">Vendedor / operador</option>
                  <option value="admin">Administrador</option>
                </select>
              )}

              {canManage && member.userId !== currentUserId && member.role !== "owner" ? (
                <button onClick={() => void removeMember(member.userId)} className="inline-flex items-center justify-center gap-1 text-xs text-rose-200 hover:text-rose-100">
                  <Trash2 className="h-3.5 w-3.5" />
                  Quitar
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      {canManage && pendingInvites.length > 0 ? (
        <Card className="mt-4 p-4">
          <p className="text-sm font-semibold">Invitaciones pendientes</p>
          <div className="mt-3 space-y-2">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div>
                  <p className="text-sm font-medium">{invite.email}</p>
                  <p className="text-[11px] text-zinc-500">Rol {invite.role} · vence {new Date(invite.expires_at).toLocaleDateString("es-AR")}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => void copyLink(invite.id)}><Copy className="h-4 w-4" /></Button>
                  <Button onClick={() => void cancelInvite(invite.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
