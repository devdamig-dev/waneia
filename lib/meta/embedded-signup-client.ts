export type SignupConfig = {
  appId: string;
  configId: string;
  graphVersion: string;
};

export type SignupSession = SignupConfig & {
  sessionId: string;
  csrfToken: string;
  expiresAt: string;
};

type FacebookLoginResponse = {
  authResponse?: { code?: string };
};

export type FacebookSDK = {
  init: (options: { appId: string; version: string; autoLogAppEvents: boolean; xfbml: boolean }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: {
      config_id: string;
      response_type: "code";
      override_default_response_type: true;
      extras: { setup: Record<string, never> };
    },
  ) => void;
};

declare global {
  interface Window {
    FB?: FacebookSDK;
  }
}

export type SignupMessage =
  | { kind: "finish"; wabaId: string; phoneNumberId: string }
  | { kind: "cancel" }
  | { kind: "error" }
  | { kind: "unsupported" };

const FACEBOOK_ORIGINS = new Set(["https://www.facebook.com", "https://web.facebook.com"]);
const META_ID = /^\d{5,30}$/;

export function parseSignupMessage(origin: string, input: unknown): SignupMessage | null {
  if (!FACEBOOK_ORIGINS.has(origin)) return null;
  let data: unknown = input;
  if (typeof input === "string") {
    if (input.length > 32_768) return null;
    try { data = JSON.parse(input); } catch { return null; }
  }
  if (!data || typeof data !== "object") return null;
  const message = data as Record<string, unknown>;
  if (message.type !== "WA_EMBEDDED_SIGNUP") return null;
  if (message.event === "CANCEL") return { kind: "cancel" };
  if (message.event === "ERROR") return { kind: "error" };
  if (typeof message.event !== "string" || !message.event.startsWith("FINISH")) return null;
  // Existing-number migrations and coexistence require a separate, authorized flow.
  if (message.event !== "FINISH") return { kind: "unsupported" };
  if (!message.data || typeof message.data !== "object") return null;
  const assets = message.data as Record<string, unknown>;
  if (typeof assets.waba_id !== "string" || !META_ID.test(assets.waba_id)
    || typeof assets.phone_number_id !== "string" || !META_ID.test(assets.phone_number_id)) return null;
  return { kind: "finish", wabaId: assets.waba_id, phoneNumberId: assets.phone_number_id };
}

let sdkPromise: Promise<FacebookSDK> | null = null;
let initializedConfig = "";

export function loadFacebookSDK(config: SignupConfig): Promise<FacebookSDK> {
  if (!META_ID.test(config.appId) || !META_ID.test(config.configId) || !/^v\d+\.0$/.test(config.graphVersion)) {
    return Promise.reject(new Error("La configuración de Meta recibida no es válida."));
  }
  if (!sdkPromise) {
    sdkPromise = new Promise<FacebookSDK>((resolve, reject) => {
      if (window.FB) { resolve(window.FB); return; }
      const id = "waneia-facebook-jssdk";
      let script = document.getElementById(id) as HTMLScriptElement | null;
      const cleanup = () => {
        window.clearTimeout(timeout);
        script?.removeEventListener("load", loaded);
        script?.removeEventListener("error", failed);
      };
      const failed = () => {
        cleanup();
        script?.remove();
        reject(new Error("No se pudo cargar Facebook. Revisá tu conexión o el bloqueo de scripts e intentá nuevamente."));
      };
      const loaded = () => {
        if (!window.FB) { failed(); return; }
        cleanup();
        resolve(window.FB);
      };
      const timeout = window.setTimeout(failed, 20_000);
      if (!script) {
        script = document.createElement("script");
        script.id = id;
        script.src = "https://connect.facebook.net/es_LA/sdk.js";
        script.async = true;
        script.defer = true;
        script.crossOrigin = "anonymous";
        script.addEventListener("load", loaded);
        script.addEventListener("error", failed);
        document.head.appendChild(script);
      } else {
        script.addEventListener("load", loaded);
        script.addEventListener("error", failed);
      }
    }).catch((error: unknown) => {
      sdkPromise = null;
      throw error;
    });
  }
  return sdkPromise.then((sdk) => {
    const key = `${config.appId}:${config.graphVersion}`;
    if (initializedConfig && initializedConfig !== key) {
      throw new Error("La aplicación de Meta cambió. Recargá la página antes de continuar.");
    }
    if (!initializedConfig) {
      sdk.init({ appId: config.appId, version: config.graphVersion, autoLogAppEvents: false, xfbml: false });
      initializedConfig = key;
    }
    return sdk;
  });
}

export async function signupRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  options?.signal?.addEventListener("abort", cancel, { once: true });
  if (options?.signal?.aborted) controller.abort();
  const timeout = setTimeout(cancel, 45_000);
  try {
    const response = await fetch(path, {
      ...options,
      signal: controller.signal,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...options?.headers },
    });
    const payload = await response.json().catch(() => null) as (T & { error?: string; reason?: string }) | null;
    if (!response.ok || !payload) {
      const reason = typeof payload?.error === "string" ? payload.error : payload?.reason;
      throw new Error(reason || `No se pudo completar la conexión (${response.status}). Intentá nuevamente.`);
    }
    return payload;
  } catch (error) {
    if (controller.signal.aborted && !options?.signal?.aborted) {
      throw new Error("El servicio tardó más de lo esperado. Actualizá el estado antes de volver a intentar.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    options?.signal?.removeEventListener("abort", cancel);
  }
}
