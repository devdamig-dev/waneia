import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GRAPH_VERSION = Deno.env.get("WHATSAPP_GRAPH_VERSION") || "v23.0";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authorization = req.headers.get("authorization");
  if (!authorization) return json({ error: "unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData.user;
  if (userError || !user) return json({ error: "unauthorized" }, 401);

  let body: { workspace_id?: string; conversation_id?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const workspaceId = String(body.workspace_id || "");
  const conversationId = String(body.conversation_id || "");
  const text = String(body.text || "").trim();

  if (!workspaceId || !conversationId || !text) {
    return json({ error: "missing_fields" }, 400);
  }

  const { data: membership } = await admin
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (!membership) return json({ error: "forbidden" }, 403);

  const { data: conversation, error: conversationError } = await admin
    .from("conversations")
    .select("id,contact_id,status")
    .eq("id", conversationId)
    .eq("workspace_id", workspaceId)
    .single();

  if (conversationError || !conversation) return json({ error: "conversation_not_found" }, 404);

  const { data: contact, error: contactError } = await admin
    .from("contacts")
    .select("phone")
    .eq("id", conversation.contact_id)
    .eq("workspace_id", workspaceId)
    .single();

  if (contactError || !contact?.phone) return json({ error: "contact_not_found" }, 404);

  const { data: credentials, error: credentialsError } = await admin.rpc(
    "get_whatsapp_send_credentials",
    { p_workspace_id: workspaceId },
  );
  const credential = credentials?.[0];

  if (credentialsError || !credential?.phone_number_id || !credential?.access_token) {
    return json({ error: "whatsapp_not_configured" }, 409);
  }

  const to = contact.phone.replace(/\D/g, "");
  const graphResponse = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${credential.phone_number_id}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credential.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: text },
      }),
    },
  );

  const graphData = await graphResponse.json().catch(() => ({}));

  if (!graphResponse.ok) {
    console.error("whatsapp-send graph error", graphResponse.status, graphData);
    return json({
      error: "meta_send_failed",
      message: graphData?.error?.message || "Meta rechazó el mensaje.",
    }, 502);
  }

  const whatsappMessageId = graphData?.messages?.[0]?.id;
  const now = new Date().toISOString();

  const { error: messageError } = await admin.from("messages").insert({
    workspace_id: workspaceId,
    conversation_id: conversationId,
    direction: "outbound",
    sender_user_id: user.id,
    whatsapp_message_id: whatsappMessageId || null,
    message_type: "text",
    body: text,
    status: "sent",
    payload: graphData,
    sent_at: now,
  });

  if (messageError) {
    console.error("whatsapp-send db message", messageError);
    return json({ error: "message_persist_failed" }, 500);
  }

  await admin
    .from("conversations")
    .update({
      last_message: text,
      last_message_at: now,
      status: conversation.status === "nuevo" ? "en curso" : conversation.status,
      assigned_user_id: user.id,
    })
    .eq("id", conversationId);

  return json({ ok: true, message_id: whatsappMessageId || null });
});
