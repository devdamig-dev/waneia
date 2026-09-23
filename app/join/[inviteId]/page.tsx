import { redirect } from "next/navigation";
import { Building2, CheckCircle2, UserRoundPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "@/app/join/[inviteId]/actions";

export default async function JoinWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ inviteId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { inviteId } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims?.sub) {
    redirect(`/login?next=${encodeURIComponent(`/join/${inviteId}`)}`);
  }

  const { data: invite } = await supabase
    .from("workspace_invites")
    .select("id,email,role,expires_at,accepted_at,workspace_id")
    .eq("id", inviteId)
    .maybeSingle();

  if (!invite) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-300/20 bg-rose-500/5 p-6">
          <h1 className="text-xl font-bold">Invitación no disponible</h1>
          <p className="mt-2 text-sm text-zinc-400">Puede haber vencido, ya fue utilizada o corresponde a otro email.</p>
        </div>
      </main>
    );
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name,industry")
    .eq("id", invite.workspace_id)
    .single();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-500/10">
          <UserRoundPlus className="h-5 w-5 text-cyan-200" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Invitación de equipo</p>
          <h1 className="mt-2 text-2xl font-bold">{workspace?.name ?? "Workspace Waneia"}</h1>
          <p className="mt-1 text-sm text-zinc-400">{workspace?.industry || "CRM conversacional"}</p>

          <div className="mt-5 space-y-2 rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
            <p className="flex items-center justify-between"><span className="text-zinc-500">Email</span><span>{invite.email}</span></p>
            <p className="flex items-center justify-between"><span className="text-zinc-500">Rol</span><span className="capitalize">{invite.role}</span></p>
            <p className="flex items-center justify-between"><span className="text-zinc-500">Vence</span><span>{new Date(invite.expires_at).toLocaleDateString("es-AR")}</span></p>
          </div>

          {query.error ? (
            <p className="mt-3 rounded-xl border border-rose-300/20 bg-rose-500/5 p-3 text-xs text-rose-100">
              No se pudo aceptar la invitación. Verificá que hayas ingresado con el mismo email invitado.
            </p>
          ) : null}

          <form action={acceptInvite} className="mt-5">
            <input type="hidden" name="inviteId" value={inviteId} />
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/30 px-4 py-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-500/40">
              <CheckCircle2 className="h-4 w-4" />
              Unirme al equipo
            </button>
          </form>

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Building2 className="h-3 w-3" />
            Sólo este workspace quedará agregado a tu cuenta.
          </p>
        </div>
      </div>
    </main>
  );
}
