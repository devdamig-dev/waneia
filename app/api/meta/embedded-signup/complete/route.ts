import { cookies } from "next/headers";
import { META_SESSION_COOKIE } from "@/lib/meta/constants";
import { MetaSetupError } from "@/lib/meta/errors";
import { createMetaGraph } from "@/lib/meta/graph";
import { getMetaRuntime, metaErrorResponse, metaJson, metaRpc, requireStorageReadiness, requireWorkspaceAdmin } from "@/lib/meta/server";
import { hashSecret, isObject, readJson, requireCode, requireMetaId, requireSameOrigin, requireSecret, requireUuid, safeEqual } from "@/lib/meta/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let clearCookie = false;
  try {
    requireSameOrigin(request);
    const body = await readJson(request);
    const workspaceId = requireUuid(body.workspace_id, "Empresa");
    const sessionId = requireUuid(body.sessionId, "Sesión");
    const code = requireCode(body.code);
    const wabaId = requireMetaId(body.waba_id, "WABA ID");
    const phoneNumberId = requireMetaId(body.phone_number_id, "Phone Number ID");
    const csrf = requireSecret(request.headers.get("x-waneia-csrf"));
    const cookie = (await cookies()).get(META_SESSION_COOKIE)?.value;
    const [cookieSessionId, cookieSecret, extra] = cookie?.split(".") ?? [];
    if (extra || !cookieSessionId || !safeEqual(cookieSessionId, sessionId)) {
      throw new MetaSetupError("INVALID_SESSION", "La sesión de conexión no es válida. Volvé a iniciarla.", 403);
    }
    requireSecret(cookieSecret);
    const configuration = getMetaRuntime();
    const { userId } = await requireWorkspaceAdmin(workspaceId);
    await requireStorageReadiness(configuration);
    const consumed = await metaRpc(configuration, "consume_meta_embedded_signup", {
      p_session_id: sessionId, p_workspace_id: workspaceId, p_user_id: userId,
      p_cookie_hash: hashSecret(cookieSecret), p_csrf_hash: hashSecret(csrf), p_code_hash: hashSecret(code),
    });
    if (!isObject(consumed) || consumed.accepted !== true) {
      throw new MetaSetupError("SESSION_EXPIRED_OR_USED", "La sesión venció o ya fue utilizada. Iniciá una conexión nueva.", 409);
    }
    clearCookie = true;
    const graph = createMetaGraph({ appSecret: configuration.appSecret });
    const accessToken = await graph.exchangeCode(code);
    const account = await graph.verifyAccount(accessToken, wabaId, phoneNumberId);

    // A durable, atomic reservation prevents a concurrent tenant from claiming the same assets.
    const claim = await metaRpc(configuration, "claim_meta_embedded_signup_assets", {
      p_session_id: sessionId, p_workspace_id: workspaceId, p_user_id: userId,
      p_waba_id: account.wabaId, p_phone_number_id: account.phoneNumberId,
    });
    if (!isObject(claim) || claim.accepted !== true) {
      throw new MetaSetupError("ASSET_ALREADY_CONNECTED", "Esta cuenta o número ya está asociado a otra empresa, o existe una conexión en curso.", 409);
    }
    await graph.subscribeAndVerify(accessToken, account.wabaId);

    // The database routine MUST wrap the existing configure_whatsapp_credentials RPC,
    // encrypted storage, reservation completion and pending_webhook status in one transaction.
    // See STORAGE_CONTRACT.md. Missing/unverified SQL blocks the flow before token exchange.
    const saved = await metaRpc(configuration, "complete_meta_embedded_signup", {
      p_session_id: sessionId, p_workspace_id: workspaceId, p_user_id: userId,
      p_waba_id: account.wabaId, p_phone_number_id: account.phoneNumberId,
      p_display_phone_number: account.displayPhoneNumber, p_verified_name: account.verifiedName,
      p_access_token: accessToken, p_app_secret: configuration.appSecret,
      p_verify_token: configuration.verifyToken,
      p_token_expires_at: account.expiresAt, p_data_access_expires_at: account.dataAccessExpiresAt,
      p_granted_scopes: account.scopes,
    });
    if (!isObject(saved) || saved.saved !== true || saved.status !== "pending_webhook") {
      throw new MetaSetupError("CONNECTION_NOT_PERSISTED", "Meta autorizó la cuenta, pero no se pudo confirmar que la conexión quedó guardada. Volvé a conectarla.", 503);
    }
    const response = metaJson({
      ok: true, status: "pending_webhook",
      account: {
        waba_id: account.wabaId, phone_number_id: account.phoneNumberId,
        display_phone_number: account.displayPhoneNumber, verified_name: account.verifiedName,
        status: "pending_webhook", webhook_subscribed: true,
      },
    });
    response.cookies.set(META_SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    const response = metaErrorResponse(error);
    if (clearCookie) response.cookies.set(META_SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
    return response;
  }
}
