import { getMetaRuntime, metaJson, publicConfiguration, requireStorageReadiness, requireWorkspaceAdmin } from "@/lib/meta/server";
import { publicMetaError } from "@/lib/meta/errors";
import { requireUuid } from "@/lib/meta/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const workspaceId = requireUuid(new URL(request.url).searchParams.get("workspace_id"), "Empresa");
    // Report missing server prerequisites without touching Auth; never return account data here.
    const runtimeConfig = getMetaRuntime();
    const { supabase } = await requireWorkspaceAdmin(workspaceId);
    await requireStorageReadiness(runtimeConfig);
    const { data: account, error } = await supabase.from("whatsapp_accounts")
      .select("phone_number_id,waba_id,display_phone_number,verified_name,status,webhook_subscribed")
      .eq("workspace_id", workspaceId).maybeSingle();
    if (error) throw error;
    return metaJson({ ready: true, ...publicConfiguration, account });
  } catch (error) {
    const safe = publicMetaError(error);
    return metaJson({ ready: false, ...publicConfiguration, reason: safe.message, error: { code: safe.code, message: safe.message } }, safe.status === 503 ? 200 : safe.status);
  }
}
