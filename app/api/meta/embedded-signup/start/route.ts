import { META_SESSION_COOKIE, META_SESSION_TTL_SECONDS } from "@/lib/meta/constants";
import { MetaSetupError } from "@/lib/meta/errors";
import { getMetaRuntime, metaErrorResponse, metaJson, metaRpc, publicConfiguration, requireStorageReadiness, requireWorkspaceAdmin } from "@/lib/meta/server";
import { hashSecret, isObject, newSecret, readJson, requireSameOrigin, requireUuid } from "@/lib/meta/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = await readJson(request);
    const workspaceId = requireUuid(body.workspace_id, "Empresa");
    const configuration = getMetaRuntime();
    const { userId } = await requireWorkspaceAdmin(workspaceId);
    await requireStorageReadiness(configuration);
    const cookieSecret = newSecret();
    const csrfToken = newSecret();
    const expiresAt = new Date(Date.now() + META_SESSION_TTL_SECONDS * 1000).toISOString();
    const created = await metaRpc(configuration, "begin_meta_embedded_signup", {
      p_workspace_id: workspaceId,
      p_user_id: userId,
      p_cookie_hash: hashSecret(cookieSecret),
      p_csrf_hash: hashSecret(csrfToken),
      p_expires_at: expiresAt,
    });
    if (!isObject(created) || created.accepted !== true) {
      throw new MetaSetupError("SESSION_NOT_CREATED", "No se pudo iniciar una sesión segura. Esperá un momento y volvé a intentar.", 409);
    }
    const sessionId = requireUuid(created.session_id, "Sesión");
    const response = metaJson({ sessionId, csrfToken, expiresAt, ...publicConfiguration });
    response.cookies.set(META_SESSION_COOKIE, `${sessionId}.${cookieSecret}`, {
      httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: META_SESSION_TTL_SECONDS,
    });
    return response;
  } catch (error) {
    return metaErrorResponse(error);
  }
}
