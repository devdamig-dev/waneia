"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function acceptInvite(formData: FormData) {
  const inviteId = String(formData.get("inviteId") || "");
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect(`/login?next=/join/${inviteId}`);

  const { error } = await supabase.rpc("accept_workspace_invite", {
    p_invite_id: inviteId,
  });

  if (error) {
    redirect(`/join/${inviteId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}
