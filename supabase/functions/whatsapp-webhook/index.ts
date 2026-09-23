import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function verifySignature(rawBody: string, signature: string | null, appSecret: string) {
  if (!signature?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  return safeEqual(signature.slice(7), hex(digest));
}

function messageBody(message: Record<string, any>) {
  if (message.type === "text") return message.text?.body ?? "";
  if (message.type === "button") return message.button?.text ?? "[botón]";
  if (message.type === "interactive") {
    return (
      message.interactive?.button_reply?.title ??
      message.interactive?.list_reply?.title ??
      "[respuesta interactiva]"
    );
  }
  if (message.type === "image") return message.image?.caption || "[imagen]";
  if (message.type === "document") return message.document?.caption || message.document?.filename || "[documento]";
  if (message.type === "audio") return "[audio]";
  if (message.type === "video") return message.video?.caption || "[video]";
  if (message.type === "sticker") return "[sticker]";
  if (message.type === "location") return "[ubicación]";
  if (message.type === "contacts") return "[contacto]";
  return `[${message.type || "mensaje"}]`;
}

async function processIncoming(workspaceId: string, value: Record<string, any>) {
  const contacts = Array.isArray(value.contacts) ? value.contacts : [];
  const profileByWaId = new Map(
    contacts.map((contact: Record<string, any>) => [
      String(contact.wa_id ?? ""),
      String(contact.profile?.name ?? ""),
    ]),
  );

  for (const message of Array.isArray(value.messages) ? value.messages : []) {
    const from = String(message.from ?? "");
    const whatsappMessageId = String(message.id ?? "");
    if (!from || !whatsappMessageId) continue;

    const body = messageBody(message);
    const sentAt = message.timestamp
      ? new Date(Number(message.timestamp) * 1000).toISOString()
      : new Date().toISOString();
    const displayName = profileByWaId.get(from) || from;

    let { data: contact } = await admin
      .from("contacts")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("phone", from)
      .maybeSingle();

    if (!contact) {
      const created = await admin
        .from("contacts")
        .insert({
          workspace_id: workspaceId,
          name: displayName,
          phone: from,
          source: "WhatsApp",
          lifecycle: "nuevo",
          opt_in: true,
          last_interaction_at: sentAt,
          metadata: { wa_id: from },
        })
        .select("id")
        .single();
      if (created.error) throw created.error;
      contact = created.data;
    } else {
      await admin
        .from("contacts")
        .update({
          name: displayName,
          last_interaction_at: sentAt,
        })
        .eq("id", contact.id);
    }

    let { data: conversation } = await admin
      .from("conversations")
      .select("id,status")
      .eq("workspace_id", workspaceId)
      .eq("contact_id", contact.id)
      .eq("channel", "whatsapp")
      .in("status", ["nuevo", "en curso", "pendiente"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conversation) {
      const created = await admin
        .from("conversations")
        .insert({
          workspace_id: workspaceId,
          contact_id: contact.id,
          channel: "whatsapp",
          status: "nuevo",
          category: "consulta",
          priority: "media",
          intent: "Mensaje WhatsApp",
          last_message: body,
          last_message_at: sentAt,
          whatsapp_thread_key: from,
          raw_metadata: { phone_number_id: value.metadata?.phone_number_id ?? null },
        })
        .select("id,status")
        .single();
      if (created.error) throw created.error;
      conversation = created.data;
    }

    const inserted = await admin
      .from("messages")
      .upsert(
        {
          workspace_id: workspaceId,
          conversation_id: conversation.id,
          direction: "inbound",
          whatsapp_message_id: whatsappMessageId,
          message_type: String(message.type ?? "text"),
          body,
          status: "received",
          payload: message,
          sent_at: sentAt,
        },
        { onConflict: "whatsapp_message_id", ignoreDuplicates: true },
      );

    if (inserted.error) throw inserted.error;

    const updated = await admin
      .from("conversations")
      .update({
        last_message: body,
        last_message_at: sentAt,
        status: conversation.status === "pendiente" ? "en curso" : conversation.status,
      })
      .eq("id", conversation.id);

    if (updated.error) throw updated.error;
  }

  for (const status of Array.isArray(value.statuses) ? value.statuses : []) {
    const id = String(status.id ?? "");
    const state = String(status.status ?? "");
    if (!id || !["sent", "delivered", "read", "failed"].includes(state)) continue;

    await admin
      .from("messages")
      .update({
        status: state,
        payload: status,
      })
      .eq("whatsapp_message_id", id);
  }
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const verifyToken = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode !== "subscribe" || !verifyToken || !challenge) {
      return new Response("Bad Request", { status: 400 });
    }

    const { data, error } = await admin.rpc("match_whatsapp_verify_token", {
      p_verify_token: verifyToken,
    });

    const workspaceId = data?.[0]?.workspace_id;
    if (error || !workspaceId) return new Response("Forbidden", { status: 403 });

    await admin
      .from("whatsapp_accounts")
      .update({ webhook_subscribed: true, status: "connected" })
      .eq("workspace_id", workspaceId);

    return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
  }

  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const rawBody = await req.text();

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  const phoneNumberId = entries
    .flatMap((entry: Record<string, any>) => Array.isArray(entry.changes) ? entry.changes : [])
    .map((change: Record<string, any>) => change.value?.metadata?.phone_number_id)
    .find(Boolean);

  if (!phoneNumberId) return json({ received: true });

  const { data: credentials, error: credentialsError } = await admin.rpc(
    "get_whatsapp_webhook_credentials",
    { p_phone_number_id: String(phoneNumberId) },
  );

  const credential = credentials?.[0];
  if (credentialsError || !credential?.workspace_id || !credential?.app_secret) {
    return json({ error: "unknown_phone_number" }, 403);
  }

  const signatureOk = await verifySignature(
    rawBody,
    req.headers.get("x-hub-signature-256"),
    credential.app_secret,
  );
  if (!signatureOk) return json({ error: "invalid_signature" }, 401);

  try {
    for (const entry of entries) {
      for (const change of Array.isArray(entry.changes) ? entry.changes : []) {
        if (change.field !== "messages" || !change.value) continue;
        await processIncoming(credential.workspace_id, change.value);
      }
    }

    await admin
      .from("whatsapp_accounts")
      .update({ status: "connected", webhook_subscribed: true })
      .eq("workspace_id", credential.workspace_id);

    return json({ received: true });
  } catch (error) {
    console.error("whatsapp-webhook", error);
    return json({ error: "processing_failed" }, 500);
  }
});
