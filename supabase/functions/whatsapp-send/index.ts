import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

type DatabaseClient = Pick<ReturnType<typeof createClient>, "from" | "rpc">;
type SendOptions = {
  admin: DatabaseClient;
  authenticate: (authorization: string) => Promise<{ id: string } | null>;
  graphVersion: string;
  graphFetch?: typeof fetch;
};

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json", "cache-control": "no-store" },
  });
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

class PayloadError extends Error {
  readonly reason: string;
  readonly httpStatus: number;
  constructor(reason: string, httpStatus = 400) {
    super(reason);
    this.reason = reason;
    this.httpStatus = httpStatus;
  }
}

async function limitedJson(source: Request | Response, maxBytes: number, timeoutMs: number): Promise<unknown> {
  if (Number(source.headers.get("content-length") || 0) > maxBytes) throw new PayloadError("payload_too_large", 413);
  const reader = source.body?.getReader();
  if (!reader) throw new PayloadError("invalid_json");
  const chunks: Uint8Array[] = [];
  let length = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { void reader.cancel().catch(() => {}); reject(new PayloadError("payload_timeout", 408)); }, timeoutMs);
  });
  try {
    return await Promise.race([deadline, (async () => {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        length += next.value.byteLength;
        if (length > maxBytes) throw new PayloadError("payload_too_large", 413);
        chunks.push(next.value);
      }
      const joined = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
      try { return JSON.parse(new TextDecoder().decode(joined)); }
      catch { throw new PayloadError("invalid_json"); }
    })()]);
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(value);
}

function graphMessageId(value: unknown): string | null {
  if (!record(value) || value.error || !Array.isArray(value.messages) || value.messages.length !== 1) return null;
  const message = value.messages[0];
  if (!record(message) || typeof message.id !== "string" || !message.id.startsWith("wamid.") || message.id.length > 512 || /\s/.test(message.id)) return null;
  return message.id;
}

export function createSendHandler({ admin, authenticate, graphVersion, graphFetch = fetch }: SendOptions) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    if (!/^v\d+\.\d+$/.test(graphVersion)) return json({ error: "server_configuration_required" }, 503);
    const authorization = req.headers.get("authorization");
    if (!authorization || !/^Bearer \S+$/i.test(authorization)) return json({ error: "unauthorized" }, 401);
    if (req.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "unsupported_content_type" }, 415);

    let metaAcceptedId: string | null = null;
    let graphAttempted = false;
    let messagePersisted = false;
    try {
      const user = await authenticate(authorization);
      if (!user) return json({ error: "unauthorized" }, 401);
      let body: unknown;
      try { body = await limitedJson(req, 32768, 10000); }
      catch (error) {
        return json({ error: error instanceof PayloadError ? error.reason : "invalid_json" }, error instanceof PayloadError ? error.httpStatus : 400);
      }
      if (!record(body) || !validUuid(body.workspace_id) || !validUuid(body.conversation_id) || typeof body.text !== "string") {
        return json({ error: "invalid_fields" }, 400);
      }
      const workspaceId = body.workspace_id;
      const conversationId = body.conversation_id;
      const text = body.text.trim();
      if (!text || text.length > 4096) return json({ error: "invalid_text_length" }, 400);

      const { data: membership, error: membershipError } = await admin.from("workspace_members")
        .select("id").eq("workspace_id", workspaceId).eq("user_id", user.id).eq("active", true).maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership) return json({ error: "forbidden" }, 403);

      // Do not enable sending just because a credential exists. The signup flow
      // verifies WABA, phone ownership and subscribed_apps before pending_webhook.
      // This status permits the first real test; it is not a delivery claim.
      const { data: account, error: accountError } = await admin.from("whatsapp_accounts")
        .select("phone_number_id,waba_id,status,webhook_subscribed")
        .eq("workspace_id", workspaceId).maybeSingle();
      if (accountError) throw accountError;
      if (!account || !["pending_webhook", "connected"].includes(account.status)
        || account.webhook_subscribed !== true
        || typeof account.phone_number_id !== "string" || !/^\d{5,30}$/.test(account.phone_number_id)
        || typeof account.waba_id !== "string" || !/^\d{5,30}$/.test(account.waba_id)) {
        return json({ error: "whatsapp_connection_unverified", message: "La cuenta de WhatsApp todavía no tiene una autorización y suscripción verificadas." }, 409);
      }

      const { data: conversation, error: conversationError } = await admin.from("conversations")
        .select("id,contact_id,status,channel").eq("id", conversationId).eq("workspace_id", workspaceId).maybeSingle();
      if (conversationError) throw conversationError;
      if (!conversation) return json({ error: "conversation_not_found" }, 404);
      if (conversation.channel !== "whatsapp") return json({ error: "not_a_whatsapp_conversation" }, 409);

      const { data: contact, error: contactError } = await admin.from("contacts")
        .select("phone").eq("id", conversation.contact_id).eq("workspace_id", workspaceId).maybeSingle();
      if (contactError) throw contactError;
      if (!contact || typeof contact.phone !== "string") return json({ error: "contact_not_found" }, 404);
      const to = contact.phone.replace(/\D/g, "");
      if (!/^\d{7,15}$/.test(to)) return json({ error: "invalid_recipient_phone" }, 409);

      const { data: credentials, error: credentialsError } = await admin.rpc("get_whatsapp_send_credentials", { p_workspace_id: workspaceId });
      if (credentialsError) throw credentialsError;
      const credential = Array.isArray(credentials) && credentials.length === 1 ? credentials[0] : null;
      if (!credential || typeof credential.access_token !== "string" || !credential.access_token
        || credential.phone_number_id !== account.phone_number_id) {
        return json({ error: "whatsapp_credentials_unverified" }, 409);
      }

      graphAttempted = true;
      const graphResponse = await graphFetch(`https://graph.facebook.com/${graphVersion}/${account.phone_number_id}/messages`, {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Bearer ${credential.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: false, body: text } }),
      });
      // Never forward or log raw Graph errors (they may contain identifiers or credentials).
      if (!graphResponse.ok) {
        void graphResponse.body?.cancel().catch(() => {});
        if (graphResponse.status >= 500) return json({ error: "meta_send_unconfirmed", message: "Meta no confirmó el resultado. Revisá la conversación antes de intentar nuevamente.", meta_accepted: "unknown", retryable: false }, 502);
        return json({ error: "meta_send_rejected", message: "Meta rechazó el envío. Revisá la autorización, el destinatario y la ventana de atención.", meta_accepted: false, retryable: false }, 502);
      }
      const graphData = await limitedJson(graphResponse, 131072, 10000);
      metaAcceptedId = graphMessageId(graphData);
      if (!metaAcceptedId) return json({ error: "meta_send_unconfirmed", message: "Meta no devolvió un identificador válido. Revisá la conversación antes de intentar nuevamente.", meta_accepted: "unknown", retryable: false }, 502);
      const now = new Date().toISOString();
      const { error: messageError } = await admin.from("messages").insert({
        workspace_id: workspaceId, conversation_id: conversationId, direction: "outbound", sender_user_id: user.id,
        whatsapp_message_id: metaAcceptedId, message_type: "text", body: text, status: "sent",
        payload: { messaging_product: "whatsapp", messages: [{ id: metaAcceptedId }] }, sent_at: now,
      });
      if (messageError) throw messageError;
      messagePersisted = true;
      const { error: previewError } = await admin.from("conversations").update({
        last_message: text, last_message_at: now,
        status: conversation.status === "nuevo" ? "en curso" : conversation.status, assigned_user_id: user.id,
      }).eq("workspace_id", workspaceId).eq("id", conversationId)
        .eq("status", conversation.status).or(`last_message_at.is.null,last_message_at.lte.${now}`);
      if (previewError) {
        // The message itself was persisted. Do not encourage a duplicate send to fix a preview.
        return json({ ok: true, message_id: metaAcceptedId, status: "accepted", warning: "conversation_preview_not_updated" });
      }
      return json({ ok: true, message_id: metaAcceptedId, status: "accepted" });
    } catch {
      // No raw exceptions, bodies, tokens, URLs or customer data are logged.
      if (metaAcceptedId) {
        if (messagePersisted) return json({ ok: true, message_id: metaAcceptedId, status: "accepted", warning: "conversation_preview_not_updated" });
        return json({ ok: false, error: "message_persist_failed", message: "Meta aceptó el mensaje, pero no se pudo guardar en Waneia. No lo reenvíes automáticamente.", meta_accepted: true, message_id: metaAcceptedId, retryable: false }, 502);
      }
      if (graphAttempted) return json({ ok: false, error: "meta_send_unconfirmed", message: "No pudimos confirmar el resultado con Meta. Revisá la conversación antes de intentar nuevamente.", meta_accepted: "unknown", retryable: false }, 502);
      return json({ ok: false, error: "send_unavailable", message: "No se pudo verificar el envío. Intentá nuevamente cuando el servicio esté disponible." }, 503);
    }
  };
}

// Edge runtime bootstrap. Unit tests exercise createSendHandler with synthetic dependencies.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
Deno.serve(createSendHandler({
  admin,
  graphVersion: Deno.env.get("WHATSAPP_GRAPH_VERSION") || "v26.0",
  authenticate: async (authorization) => {
    const client = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getUser();
    return !error && data.user ? { id: data.user.id } : null;
  },
}));
