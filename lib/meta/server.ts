import "server-only";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { META_APP_ID, META_CONFIGURATION_ID, META_GRAPH_VERSION, META_STORAGE_CONTRACT } from "./constants";
import { MetaSetupError, publicMetaError } from "./errors";
import { isObject, requireUuid } from "./validation";

// This module is imported exclusively by route handlers. Never import it in a client component.
export const publicConfiguration = {
  appId: META_APP_ID,
  configId: META_CONFIGURATION_ID,
  graphVersion: META_GRAPH_VERSION,
};

type RpcResponse = { data: unknown; error: { code?: string } | null };
type RpcClient = { rpc: (name: string, args?: Record<string, unknown>) => PromiseLike<RpcResponse> };

export type MetaRuntime = {
  appSecret: string;
  verifyToken: string;
  database: RpcClient;
};

export function getMetaRuntime(): MetaRuntime {
  const appSecret = process.env.META_APP_SECRET;
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!appSecret || !verifyToken || !serviceRoleKey) {
    throw new MetaSetupError("SERVER_CONFIGURATION_REQUIRED", "La conexión de WhatsApp todavía requiere configuración segura del servidor.", 503);
  }
  const database = createAdminClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }) as unknown as RpcClient;
  return { appSecret, verifyToken, database };
}

export async function requireWorkspaceAdmin(workspaceId: string) {
  requireUuid(workspaceId, "Empresa");
  const supabase = await createClient();
  // getUser validates against Auth; do not authorize from browser state or user_metadata.
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    throw new MetaSetupError("AUTHENTICATION_REQUIRED", "Iniciá sesión en Waneia para conectar WhatsApp.", 401);
  }
  const { data: membership, error } = await supabase.from("workspace_members")
    .select("role,active")
    .eq("workspace_id", workspaceId)
    .eq("user_id", auth.user.id)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new MetaSetupError("WORKSPACE_UNAVAILABLE", "No se pudo verificar el acceso a esta empresa.", 503);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new MetaSetupError("ADMIN_REQUIRED", "Solo un propietario o administrador puede conectar WhatsApp.", 403);
  }
  return { supabase, userId: auth.user.id };
}

export async function metaRpc(runtime: MetaRuntime, name: string, args: Record<string, unknown> = {}) {
  const { data, error } = await runtime.database.rpc(name, args);
  if (error) {
    // Missing routines, unknown grants, unavailable DB and runtime SQL failures all fail closed.
    throw new MetaSetupError("SECURE_STORAGE_UNAVAILABLE", "El almacenamiento seguro de la integración no está disponible o requiere verificación.", 503);
  }
  return data;
}

export async function requireStorageReadiness(runtime: MetaRuntime) {
  const data = await metaRpc(runtime, "meta_embedded_signup_security");
  if (
    !isObject(data) || data.contract !== META_STORAGE_CONTRACT ||
    data.storage_encrypted !== true || data.restrictive_grants !== true ||
    data.tenant_constraints !== true || data.durable_sessions !== true
  ) {
    throw new MetaSetupError("STORAGE_AUDIT_REQUIRED", "La conexión está pendiente de verificar el almacenamiento seguro y el aislamiento entre empresas.", 503);
  }
}

export function metaJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store, max-age=0", pragma: "no-cache", "x-content-type-options": "nosniff" },
  });
}

export function metaErrorResponse(error: unknown) {
  const safe = publicMetaError(error);
  return metaJson({ ok: false, error: { code: safe.code, message: safe.message }, reason: safe.message }, safe.status);
}
