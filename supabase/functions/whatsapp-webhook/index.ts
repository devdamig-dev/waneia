import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { createWebhookHandler } from "./handler.ts";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

Deno.serve(createWebhookHandler({
  admin,
  appSecret: Deno.env.get("META_APP_SECRET"),
  verifyToken: Deno.env.get("META_WEBHOOK_VERIFY_TOKEN"),
}));
