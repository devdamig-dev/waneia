import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, x-bridge-device-id, x-bridge-secret",
  "access-control-allow-methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const allowedEventTypes = new Set([
  "heartbeat",
  "chat_seen",
  "tag_snapshot",
  "tag_added",
  "tag_removed",
  "outbound_observed",
]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const deviceId = req.headers.get("x-bridge-device-id")?.trim() ?? "";
  const secret = req.headers.get("x-bridge-secret") ?? "";

  if (!deviceId || !secret) return json({ error: "missing_bridge_credentials" }, 401);

  const secretHash = await sha256(secret);

  const { data: device, error: deviceError } = await admin
    .from("bridge_devices")
    .select("id, workspace_id, name, seller_label, active, secret_hash")
    .eq("id", deviceId)
    .maybeSingle();

  if (
    deviceError ||
    !device ||
    !device.active ||
    device.secret_hash !== secretHash
  ) {
    return json({ error: "invalid_bridge_credentials" }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const eventType = String(body.event_type ?? "");
  if (!allowedEventTypes.has(eventType)) {
    return json({ error: "invalid_event_type" }, 400);
  }

  const conversationKey = body.conversation_key
    ? String(body.conversation_key).slice(0, 255)
    : null;
  const conversationTitle = body.conversation_title
    ? String(body.conversation_title).slice(0, 255)
    : null;
  const tags = Array.isArray(body.tags)
    ? body.tags.map((tag) => String(tag).slice(0, 120)).slice(0, 40)
    : [];
  const occurredAt = body.occurred_at
    ? new Date(String(body.occurred_at)).toISOString()
    : new Date().toISOString();

  const payload =
    body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
      ? body.payload
      : {};

  const { error: insertError } = await admin.from("bridge_events").insert({
    workspace_id: device.workspace_id,
    bridge_device_id: device.id,
    event_type: eventType,
    conversation_key: conversationKey,
    conversation_title: conversationTitle,
    tags,
    payload: {
      ...payload,
      bridge_device_name: device.name,
      seller_label: device.seller_label,
      bridge_version: "0.1.0",
    },
    occurred_at: occurredAt,
  });

  if (insertError) {
    console.error("bridge-events insert", insertError);
    return json({ error: "persist_failed" }, 500);
  }

  await admin
    .from("bridge_devices")
    .update({ last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", device.id);

  return json({
    ok: true,
    device: device.name,
    seller_label: device.seller_label,
  });
});
