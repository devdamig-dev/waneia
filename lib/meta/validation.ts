import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { MetaSetupError } from "./errors";
import { META_APP_ORIGIN } from "./constants";

export function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function newSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function requireUuid(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(value)) {
    throw new MetaSetupError("INVALID_REQUEST", `${label} no válido.`);
  }
  return value;
}

export function requireMetaId(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^\d{5,30}$/.test(value)) {
    throw new MetaSetupError("INVALID_REQUEST", `${label} no válido.`);
  }
  return value;
}

export function requireSecret(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(value)) {
    throw new MetaSetupError("INVALID_SESSION", "La sesión de conexión no es válida. Volvé a iniciarla.", 403);
  }
  return value;
}

export function requireCode(value: unknown): string {
  if (typeof value !== "string" || value.length < 10 || value.length > 4096 || /[\u0000-\u0020\u007f]/.test(value)) {
    throw new MetaSetupError("INVALID_CODE", "Meta no devolvió un código de autorización válido.");
  }
  return value;
}

export function requireSameOrigin(request: Request): void {
  // Deliberately do not derive trusted origins from attacker-controlled Host headers.
  if (request.headers.get("origin") !== META_APP_ORIGIN || new URL(request.url).origin !== META_APP_ORIGIN) {
    throw new MetaSetupError("INVALID_ORIGIN", "La conexión debe iniciarse desde app.waneia.com.", 403);
  }
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") {
    throw new MetaSetupError("INVALID_ORIGIN", "El origen de la solicitud no está permitido.", 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    throw new MetaSetupError("INVALID_CONTENT_TYPE", "Se requiere una solicitud JSON.", 415);
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get("content-length") || 0) > 16384) {
    throw new MetaSetupError("REQUEST_TOO_LARGE", "La solicitud excede el tamaño permitido.", 413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new MetaSetupError("INVALID_REQUEST", "La solicitud está vacía.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.length;
      if (size > 16384) {
        await reader.cancel();
        throw new MetaSetupError("REQUEST_TOO_LARGE", "La solicitud excede el tamaño permitido.", 413);
      }
      chunks.push(next.value);
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!isObject(body)) throw new Error("object required");
    return body;
  } catch (error) {
    if (error instanceof MetaSetupError) throw error;
    throw new MetaSetupError("INVALID_REQUEST", "La solicitud JSON no es válida.");
  }
}
