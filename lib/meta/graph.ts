import { createHmac } from "node:crypto";
import { META_APP_ID, META_GRAPH_VERSION, META_REQUIRED_SCOPES } from "./constants";
import { MetaSetupError } from "./errors";
import { isObject, requireMetaId } from "./validation";

type GraphConfig = { appSecret: string; fetch?: typeof fetch };
export type VerifiedMetaAccount = {
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string;
  scopes: string[];
  expiresAt: number;
  dataAccessExpiresAt: number;
};

function graphError(code = "META_REQUEST_FAILED") {
  return new MetaSetupError(code, "Meta no pudo verificar la autorización. Volvé a conectar la cuenta.", 502);
}

export function verifyTokenData(input: unknown, wabaId: string, nowSeconds = Date.now() / 1000) {
  if (!isObject(input) || !isObject(input.data)) throw graphError("INVALID_TOKEN_RESPONSE");
  const data = input.data;
  if (data.is_valid !== true || String(data.app_id) !== META_APP_ID) {
    throw new MetaSetupError("TOKEN_APP_MISMATCH", "La autorización no corresponde a la aplicación Waneia.", 403);
  }
  const expiresAt = data.expires_at;
  const dataAccessExpiresAt = data.data_access_expires_at;
  if (
    typeof expiresAt !== "number" || !Number.isFinite(expiresAt) || expiresAt < 0 ||
    (expiresAt !== 0 && expiresAt <= nowSeconds) ||
    typeof dataAccessExpiresAt !== "number" || !Number.isFinite(dataAccessExpiresAt) || dataAccessExpiresAt < 0 ||
    (dataAccessExpiresAt !== 0 && dataAccessExpiresAt <= nowSeconds)
  ) {
    throw new MetaSetupError("TOKEN_EXPIRED", "La autorización está vencida o no se pudo verificar su vigencia.", 403);
  }
  const scopes = Array.isArray(data.scopes) ? data.scopes.filter((scope): scope is string => typeof scope === "string") : [];
  const granular = Array.isArray(data.granular_scopes) ? data.granular_scopes : [];
  for (const scope of META_REQUIRED_SCOPES) {
    const authorizedWaba = granular.some((entry: unknown) =>
      isObject(entry) && entry.scope === scope && Array.isArray(entry.target_ids) && entry.target_ids.includes(wabaId),
    );
    if (!scopes.includes(scope) || !authorizedWaba) {
      throw new MetaSetupError("WABA_NOT_AUTHORIZED", "La autorización de Meta no incluye los permisos necesarios para esta cuenta de WhatsApp.", 403);
    }
  }
  return { scopes, expiresAt, dataAccessExpiresAt };
}

export function hasAppSubscription(input: unknown): boolean {
  return isObject(input) && Array.isArray(input.data) && input.data.some((entry: unknown) => {
    if (!isObject(entry)) return false;
    // WhatsApp's subscribed_apps edge nests the application metadata.
    const app = entry.whatsapp_business_api_data;
    return isObject(app) && String(app.id) === META_APP_ID;
  });
}

export function createMetaGraph(config: GraphConfig) {
  const graphFetch = config.fetch ?? fetch;
  const base = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

  async function request(path: string, options: RequestInit = {}, query?: URLSearchParams): Promise<unknown> {
    const url = `${base}/${path}${query ? `?${query.toString()}` : ""}`;
    try {
      const response = await graphFetch(url, {
        ...options,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
      const body: unknown = await response.json();
      if (!response.ok || !isObject(body) || "error" in body) throw graphError();
      return body;
    } catch (error) {
      if (error instanceof MetaSetupError) throw error;
      // Fetch errors can contain the URL (including OAuth credentials). Do not propagate them.
      throw graphError();
    }
  }

  function auth(accessToken: string) {
    return { authorization: `Bearer ${accessToken}` };
  }

  function proof(accessToken: string): string {
    return createHmac("sha256", config.appSecret).update(accessToken).digest("hex");
  }

  async function getEdge(path: string, accessToken: string, extra: Record<string, string> = {}) {
    return request(path, { headers: auth(accessToken) }, new URLSearchParams({ ...extra, appsecret_proof: proof(accessToken) }));
  }

  return {
    async exchangeCode(code: string): Promise<string> {
      // Meta documents GET /oauth/access_token for Embedded Signup code exchange.
      // The URL and response are never logged or returned to a browser.
      const data = await request("oauth/access_token", {}, new URLSearchParams({
        client_id: META_APP_ID,
        client_secret: config.appSecret,
        code,
      }));
      if (!isObject(data) || typeof data.access_token !== "string" || data.access_token.length < 20) {
        throw graphError("INVALID_TOKEN_RESPONSE");
      }
      return data.access_token;
    },

    async verifyAccount(accessToken: string, wabaId: string, phoneNumberId: string): Promise<VerifiedMetaAccount> {
      requireMetaId(wabaId, "WABA ID");
      requireMetaId(phoneNumberId, "Phone Number ID");
      const tokenData = await request("debug_token", {
        headers: auth(`${META_APP_ID}|${config.appSecret}`),
      }, new URLSearchParams({ input_token: accessToken }));
      const scope = verifyTokenData(tokenData, wabaId);

      // Browser IDs are only hints; derive number ownership from the WABA edge.
      // Cursor pagination uses a fixed Graph host, never an upstream next URL.
      let after: string | undefined;
      const seenCursors = new Set<string>();
      for (let page = 0; page < 20; page++) {
        const body = await getEdge(`${wabaId}/phone_numbers`, accessToken, {
          fields: "id,display_phone_number,verified_name", limit: "100", ...(after ? { after } : {}),
        });
        if (!isObject(body) || !Array.isArray(body.data)) throw graphError("INVALID_ACCOUNT_RESPONSE");
        const phone = body.data.find((entry: unknown) => isObject(entry) && String(entry.id) === phoneNumberId);
        if (isObject(phone)) {
          return {
            wabaId, phoneNumberId,
            displayPhoneNumber: typeof phone.display_phone_number === "string" ? phone.display_phone_number : "",
            verifiedName: typeof phone.verified_name === "string" ? phone.verified_name : "",
            ...scope,
          };
        }
        const paging = isObject(body.paging) ? body.paging : null;
        const cursors = paging && isObject(paging.cursors) ? paging.cursors : null;
        const nextCursor = cursors && typeof cursors.after === "string" ? cursors.after : null;
        if (!paging?.next || !nextCursor || seenCursors.has(nextCursor)) break;
        after = nextCursor;
        seenCursors.add(after);
      }
      throw new MetaSetupError("PHONE_WABA_MISMATCH", "El número seleccionado no pertenece a la cuenta de WhatsApp autorizada.", 403);
    },

    async subscribeAndVerify(accessToken: string, wabaId: string): Promise<void> {
      requireMetaId(wabaId, "WABA ID");
      const subscribed = await request(`${wabaId}/subscribed_apps`, {
        method: "POST",
        headers: { ...auth(accessToken), "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ appsecret_proof: proof(accessToken) }),
      });
      if (!isObject(subscribed) || subscribed.success !== true) throw graphError("SUBSCRIPTION_FAILED");
      const actual = await getEdge(`${wabaId}/subscribed_apps`, accessToken);
      if (!hasAppSubscription(actual)) {
        throw new MetaSetupError("SUBSCRIPTION_UNVERIFIED", "Meta no confirmó la suscripción de Waneia a esta cuenta.", 502);
      }
    },
  };
}
