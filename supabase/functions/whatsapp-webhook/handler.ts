// Uses the tables and RPCs already referenced by the deployed v1 function.
// Database transactions/unique constraints still require live schema verification.
type Row = Record<string, any>;
type DatabaseClient = {
  from: (table: string) => any;
  rpc: (name: string, args: Record<string, string>) => PromiseLike<{ data: any; error: unknown }>;
};
type Options = { admin: DatabaseClient; appSecret?: string; verifyToken?: string };
type Target = { workspaceId: string; phoneNumberId: string; accountId: string; value: Row };

const MAX_BODY_BYTES = 2 * 1024 * 1024;
class BodyTooLargeError extends Error {}

async function readBodyLimited(req: Request): Promise<ArrayBuffer> {
  if (Number(req.headers.get("content-length")) > MAX_BODY_BYTES) throw new BodyTooLargeError();
  if (!req.body) return new ArrayBuffer(0);
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new BodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes.buffer;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function verifySignature(rawBody: ArrayBuffer, signature: string | null, appSecret: string) {
  if (!signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, rawBody);
  const expected = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return safeEqual(signature.slice(7), expected);
}

function record(value: unknown): value is Row {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function messageBody(message: Row): string {
  if (message.type === "text") return message.text?.body ?? "";
  if (message.type === "button") return message.button?.text ?? "[botón]";
  if (message.type === "interactive") return message.interactive?.button_reply?.title ?? message.interactive?.list_reply?.title ?? "[respuesta interactiva]";
  if (message.type === "image") return message.image?.caption || "[imagen]";
  if (message.type === "document") return message.document?.caption || message.document?.filename || "[documento]";
  const labels: Record<string, string> = { audio: "[audio]", video: "[video]", sticker: "[sticker]", location: "[ubicación]", contacts: "[contacto]" };
  if (message.type === "video") return message.video?.caption || labels.video;
  return labels[message.type] ?? `[${message.type || "mensaje"}]`;
}

function validTimestamp(value: unknown): boolean {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 && Number.isFinite(new Date(seconds * 1000).getTime());
}

function timestamp(value: unknown): string {
  const seconds = Number(value);
  if (!validTimestamp(value)) throw new Error("invalid_message_timestamp");
  return new Date(seconds * 1000).toISOString();
}

async function updatePreview(admin: DatabaseClient, workspaceId: string, conversationId: string, body: string, sentAt: string) {
  // Also repairs a retry after the message was committed but this update failed.
  // The condition prevents an old replay from replacing a newer conversation preview.
  const { error } = await admin.from("conversations")
    .update({ last_message: body, last_message_at: sentAt })
    .eq("workspace_id", workspaceId).eq("id", conversationId)
    .or(`last_message_at.is.null,last_message_at.lte.${sentAt}`);
  if (error) throw error;
}

async function processIncoming(admin: DatabaseClient, target: Target) {
  const { workspaceId, phoneNumberId, value } = target;
  const contacts = Array.isArray(value.contacts) ? value.contacts : [];
  const profiles = new Map(contacts.filter(record).map((contact: Row) => [String(contact.wa_id ?? ""), String(contact.profile?.name ?? "")]));

  for (const message of Array.isArray(value.messages) ? value.messages : []) {
    const from = String(message.from);
    const whatsappMessageId = String(message.id);
    const sentAt = timestamp(message.timestamp);
    const body = messageBody(message);

    // Check the durable message first: replay must not create another conversation
    // after the original one was closed, or refresh customer details unnecessarily.
    const existing = await admin.from("messages").select("id,conversation_id,body,sent_at")
      .eq("workspace_id", workspaceId).eq("whatsapp_message_id", whatsappMessageId).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
      await updatePreview(admin, workspaceId, existing.data.conversation_id, existing.data.body, existing.data.sent_at);
      continue;
    }

    const displayName = profiles.get(from) || from;
    const foundContact = await admin.from("contacts").select("id")
      .eq("workspace_id", workspaceId).eq("phone", from).maybeSingle();
    if (foundContact.error) throw foundContact.error;
    let contact = foundContact.data;

    if (!contact) {
      const created = await admin.from("contacts").insert({
        workspace_id: workspaceId, name: displayName, phone: from, source: "WhatsApp",
        lifecycle: "nuevo", opt_in: false, last_interaction_at: sentAt, metadata: { wa_id: from },
      }).select("id").single();
      if (created.error) throw created.error;
      contact = created.data;
    } else {
      const updated = await admin.from("contacts").update({ name: displayName, last_interaction_at: sentAt })
        .eq("workspace_id", workspaceId).eq("id", contact.id)
        .or(`last_interaction_at.is.null,last_interaction_at.lte.${sentAt}`);
      if (updated.error) throw updated.error;
    }
    if (!contact?.id) throw new Error("contact_not_persisted");

    const foundConversation = await admin.from("conversations").select("id,status")
      .eq("workspace_id", workspaceId).eq("contact_id", contact.id).eq("channel", "whatsapp")
      .in("status", ["nuevo", "en curso", "pendiente"])
      .order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (foundConversation.error) throw foundConversation.error;
    let conversation = foundConversation.data;
    if (!conversation) {
      const created = await admin.from("conversations").insert({
        workspace_id: workspaceId, contact_id: contact.id, channel: "whatsapp", status: "nuevo",
        category: "consulta", priority: "media", intent: "Mensaje WhatsApp", last_message: body,
        last_message_at: sentAt, whatsapp_thread_key: from, raw_metadata: { phone_number_id: phoneNumberId },
      }).select("id,status").single();
      if (created.error) throw created.error;
      conversation = created.data;
    }
    if (!conversation?.id) throw new Error("conversation_not_persisted");

    const inserted = await admin.from("messages").upsert({
      workspace_id: workspaceId, conversation_id: conversation.id, direction: "inbound",
      whatsapp_message_id: whatsappMessageId, message_type: String(message.type ?? "text"),
      body, status: "received", payload: message, sent_at: sentAt,
    }, { onConflict: "whatsapp_message_id", ignoreDuplicates: true }).select("id,conversation_id").maybeSingle();
    if (inserted.error) throw inserted.error;

    // A concurrent delivery may have inserted the same message. Resolve the row
    // scoped to this tenant; never update the conversation created by a losing retry.
    if (!inserted.data) {
      const persisted = await admin.from("messages").select("id,conversation_id,body,sent_at")
        .eq("workspace_id", workspaceId).eq("whatsapp_message_id", whatsappMessageId).single();
      if (persisted.error || !persisted.data) throw persisted.error || new Error("message_not_persisted");
      await updatePreview(admin, workspaceId, persisted.data.conversation_id, persisted.data.body, persisted.data.sent_at);
      continue;
    }

    await updatePreview(admin, workspaceId, conversation.id, body, sentAt);
    // Keep workflow status under the operator's control. An automatic transition
    // must be committed atomically with the message in a verified DB transaction;
    // retrying a separate update could otherwise undo a later manual action.
  }

  for (const status of Array.isArray(value.statuses) ? value.statuses : []) {
    const id = String(status.id);
    const state = String(status.status);
    const previous = await admin.from("messages").select("id,status,payload")
      .eq("workspace_id", workspaceId).eq("whatsapp_message_id", id).maybeSingle();
    if (previous.error) throw previous.error;
    // Retry if the sender has not yet persisted its outbound message.
    if (!previous.data) throw new Error("status_message_not_persisted");
    const rank: Record<string, number> = { failed: 0, sent: 1, delivered: 2, read: 3 };
    if (state === previous.data.status) continue;
    // A delayed sent notification is not evidence that a failed delivery recovered.
    // Only delivered/read establish recovery from failed.
    if (previous.data.status === "failed" && state === "sent") continue;
    const previousTimestamp = previous.data.payload?.timestamp;
    if (!["delivered", "read"].includes(state) && validTimestamp(previousTimestamp)
      && Number(status.timestamp) < Number(previousTimestamp)) continue;
    if (state === "failed" && ["delivered", "read"].includes(previous.data.status)) continue;
    if (state !== "failed" && (rank[state] ?? 0) < (rank[previous.data.status] ?? 0)) continue;
    const updated = await admin.from("messages").update({ status: state, payload: status })
      .eq("workspace_id", workspaceId).eq("id", previous.data.id).eq("status", previous.data.status)
      .select("id").maybeSingle();
    if (updated.error || !updated.data) throw updated.error || new Error("concurrent_status_update");
  }
}

function validEvents(value: Row): boolean {
  if (value.messages !== undefined && !Array.isArray(value.messages)) return false;
  if (value.statuses !== undefined && !Array.isArray(value.statuses)) return false;
  if (!(value.messages?.length || value.statuses?.length)) return false;
  return (value.messages ?? []).every((m: unknown) => record(m) && typeof m.id === "string" && m.id && /^\d+$/.test(String(m.from ?? "")) && validTimestamp(m.timestamp))
    && (value.statuses ?? []).every((s: unknown) => record(s) && typeof s.id === "string" && s.id && ["sent", "delivered", "read", "failed"].includes(s.status) && validTimestamp(s.timestamp));
}

export function createWebhookHandler({ admin, appSecret, verifyToken }: Options) {
  return async (req: Request): Promise<Response> => {
    try {
      const url = new URL(req.url);
      if (req.method === "GET") {
        const supplied = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        if (url.searchParams.get("hub.mode") !== "subscribe" || !supplied || !challenge) return json({ error: "invalid_challenge" }, 400);
        if (verifyToken) {
          if (!safeEqual(supplied, verifyToken)) return json({ error: "invalid_verify_token" }, 403);
        } else {
          const matched = await admin.rpc("match_whatsapp_verify_token", { p_verify_token: supplied });
          if (matched.error) throw matched.error;
          if (!matched.data?.[0]?.workspace_id) return json({ error: "invalid_verify_token" }, 403);
        }
        // An endpoint challenge does not prove a WABA subscription or connection.
        return new Response(challenge, { status: 200, headers: { "content-type": "text/plain", "cache-control": "no-store" } });
      }
      if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      const signature = req.headers.get("x-hub-signature-256");
      if (!signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return json({ error: "invalid_signature" }, 401);
      const rawBody = await readBodyLimited(req);
      if (appSecret && !await verifySignature(rawBody, signature, appSecret)) return json({ error: "invalid_signature" }, 401);
      let payload: unknown;
      try { payload = JSON.parse(new TextDecoder().decode(rawBody)); } catch { return json({ error: "invalid_json" }, 400); }
      if (!record(payload) || payload.object !== "whatsapp_business_account" || !Array.isArray(payload.entry) || !payload.entry.length) return json({ error: "invalid_payload" }, 400);

      const targets: Target[] = [];
      const resolved = new Map<string, { workspaceId: string; accountId: string; wabaId: string | null }>();
      // Resolve AND authenticate every target before any persistence in the batch.
      for (const entry of payload.entry) {
        if (!record(entry) || !/^\d+$/.test(String(entry.id ?? "")) || !Array.isArray(entry.changes) || !entry.changes.length) return json({ error: "invalid_entry" }, 400);
        for (const change of entry.changes) {
          if (!record(change) || change.field !== "messages") return json({ error: "unsupported_webhook_field" }, 422);
          if (!record(change.value) || !validEvents(change.value)) return json({ error: "invalid_events" }, 400);
          const phoneNumberId = String(change.value.metadata?.phone_number_id ?? "");
          if (!/^\d+$/.test(phoneNumberId)) return json({ error: "missing_phone_number" }, 400);
          let account = resolved.get(phoneNumberId);
          if (!account) {
            const credentials = await admin.rpc("get_whatsapp_webhook_credentials", { p_phone_number_id: phoneNumberId });
            if (credentials.error) throw credentials.error;
            if (credentials.data?.length !== 1 || !credentials.data[0]?.workspace_id) return json({ error: "unknown_phone_number" }, 403);
            const credential = credentials.data[0];
            if (!appSecret && (!credential.app_secret || !await verifySignature(rawBody, signature, credential.app_secret))) return json({ error: "invalid_signature" }, 401);
            const stored = await admin.from("whatsapp_accounts").select("id,waba_id")
              .eq("workspace_id", credential.workspace_id).eq("phone_number_id", phoneNumberId).maybeSingle();
            if (stored.error) throw stored.error;
            if (!stored.data?.id) return json({ error: "unknown_phone_number" }, 403);
            account = { workspaceId: credential.workspace_id, accountId: stored.data.id, wabaId: stored.data.waba_id };
            resolved.set(phoneNumberId, account);
          }
          if (!account.wabaId || account.wabaId !== String(entry.id)) return json({ error: "waba_mismatch" }, 403);
          targets.push({ workspaceId: account.workspaceId, accountId: account.accountId, phoneNumberId, value: change.value });
        }
      }
      for (const target of targets) await processIncoming(admin, target);
      // Deliberately no connected/subscribed mutation: the signup backend confirms
      // subscribed_apps through Graph, while this endpoint only records deliveries.
      return json({ received: true });
    } catch (error) {
      if (error instanceof BodyTooLargeError) return json({ error: "payload_too_large" }, 413);
      // Do not log tokens, customer payloads, or database error details.
      console.error("whatsapp-webhook processing_failed");
      return json({ error: "processing_failed" }, 500);
    }
  };
}
