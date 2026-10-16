"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, MessageCircleMore, RefreshCw, ShieldCheck, Smartphone, Webhook } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import {
  loadFacebookSDK, parseSignupMessage, signupRequest,
  type FacebookSDK, type SignupConfig, type SignupSession,
} from "@/lib/meta/embedded-signup-client";

type Account = {
  phone_number_id: string;
  waba_id: string | null;
  display_phone_number: string | null;
  verified_name: string | null;
  status: string;
  webhook_subscribed: boolean;
};
type Readiness = SignupConfig & { ready: boolean; reason?: string; account?: Account | null };
type Phase = "idle" | "preparing" | "prepared" | "authorizing" | "completing";
type Attempt = {
  workspaceId: string;
  session: SignupSession;
  code?: string;
  assets?: { wabaId: string; phoneNumberId: string };
  source?: MessageEventSource;
  submitted: boolean;
  timer?: ReturnType<typeof setTimeout>;
  controller: AbortController;
};

export function WhatsappConnectionClient() {
  const { activeWorkspaceId, activeWorkspace, refreshWorkspaces } = useWorkspace();
  const [readinessState, setReadiness] = useState<(Readiness & { workspaceId: string }) | null>(null);
  const readiness = readinessState?.workspaceId === activeWorkspaceId ? readinessState : null;
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [session, setSession] = useState<(SignupSession & { workspaceId: string }) | null>(null);
  const workspaceRef = useRef(activeWorkspaceId);
  const loadId = useRef(0);
  const sdkRef = useRef<FacebookSDK | null>(null);
  const attemptRef = useRef<Attempt | null>(null);
  const prepareRef = useRef<AbortController | null>(null);
  const refreshRef = useRef(refreshWorkspaces);
  workspaceRef.current = activeWorkspaceId;
  refreshRef.current = refreshWorkspaces;

  const clearAttempt = useCallback(() => {
    const attempt = attemptRef.current;
    if (attempt?.timer) clearTimeout(attempt.timer);
    attempt?.controller.abort();
    attemptRef.current = null;
  }, []);

  const loadStatus = useCallback(async (workspaceId: string) => {
    const requestId = ++loadId.current;
    if (!workspaceId) { setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const result = await signupRequest<Readiness>(`/api/meta/embedded-signup?workspace_id=${encodeURIComponent(workspaceId)}`);
      if (workspaceRef.current === workspaceId && loadId.current === requestId) setReadiness({ ...result, workspaceId });
    } catch (cause) {
      if (workspaceRef.current === workspaceId && loadId.current === requestId) {
        setReadiness(null);
        setError(cause instanceof Error ? cause.message : "No se pudo consultar la conexión.");
      }
    } finally {
      if (workspaceRef.current === workspaceId && loadId.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearAttempt();
    prepareRef.current?.abort();
    prepareRef.current = null;
    setReadiness(null);
    setSession(null);
    setPhase("idle");
    setError("");
    setNotice("");
    void loadStatus(activeWorkspaceId);
    return () => {
      ++loadId.current;
      clearAttempt();
      prepareRef.current?.abort();
      prepareRef.current = null;
    };
  }, [activeWorkspaceId, clearAttempt, loadStatus]);

  const failAttempt = useCallback((attempt: Attempt, message: string) => {
    if (attemptRef.current !== attempt || workspaceRef.current !== attempt.workspaceId) return;
    clearAttempt();
    setSession(null);
    setPhase("idle");
    setError(message);
  }, [clearAttempt]);

  const completeAttempt = useCallback(async (attempt: Attempt) => {
    if (attemptRef.current !== attempt || workspaceRef.current !== attempt.workspaceId
      || attempt.submitted || !attempt.code || !attempt.assets) return;
    attempt.submitted = true;
    if (attempt.timer) clearTimeout(attempt.timer);
    setPhase("completing");
    // This is the only operation that can persist a connection. Message events are hints,
    // and the server independently verifies the token, the account and the phone ownership.
    attempt.timer = setTimeout(() => failAttempt(attempt,
      "La validación tardó más de lo esperado. Actualizá el estado antes de iniciar otra conexión."), 60_000);
    try {
      const result = await signupRequest<{ ok: boolean; status: string; account: Account }>("/api/meta/embedded-signup/complete", {
        method: "POST",
        signal: attempt.controller.signal,
        headers: { "X-Waneia-CSRF": attempt.session.csrfToken },
        body: JSON.stringify({
          workspace_id: attempt.workspaceId, sessionId: attempt.session.sessionId,
          code: attempt.code, waba_id: attempt.assets.wabaId, phone_number_id: attempt.assets.phoneNumberId,
        }),
      });
      if (attemptRef.current !== attempt || workspaceRef.current !== attempt.workspaceId) return;
      if (!result.ok || !result.account) throw new Error("El servidor no confirmó que la conexión se haya guardado.");
      clearAttempt();
      setSession(null);
      setPhase("idle");
      setReadiness((current) => current ? { ...current, account: result.account } : current);
      setNotice("Autorización guardada. La prueba de recepción y respuesta de mensajes sigue pendiente.");
      void refreshRef.current();
    } catch (cause) {
      if (attempt.controller.signal.aborted) return;
      failAttempt(attempt, cause instanceof Error ? cause.message : "No se pudo guardar la autorización de Meta.");
    }
  }, [clearAttempt, failAttempt]);

  useEffect(() => {
    const receiveMessage = (event: MessageEvent) => {
      const attempt = attemptRef.current;
      if (!attempt || attempt.submitted || attempt.workspaceId !== workspaceRef.current
        || !event.source || event.source === window) return;
      const message = parseSignupMessage(event.origin, event.data);
      if (!message) return;
      // FB.login does not expose a popup Window handle. Pin the source of the first valid
      // Facebook session event for this active attempt; never accept a different source.
      if (attempt.source && attempt.source !== event.source) return;
      attempt.source = event.source;
      if (message.kind === "cancel") { failAttempt(attempt, "Cancelaste la conexión en Meta. Podés iniciarla nuevamente."); return; }
      if (message.kind === "error") { failAttempt(attempt, "Meta informó un error durante la conexión. Revisá el detalle en su ventana e intentá nuevamente."); return; }
      if (message.kind === "unsupported") {
        failAttempt(attempt, "Este flujo requiere una cuenta y un número de WhatsApp Cloud API. No se procesaron migraciones ni conexiones de WhatsApp Business App.");
        return;
      }
      attempt.assets = { wabaId: message.wabaId, phoneNumberId: message.phoneNumberId };
      void completeAttempt(attempt);
    };
    window.addEventListener("message", receiveMessage);
    return () => window.removeEventListener("message", receiveMessage);
  }, [completeAttempt, failAttempt]);

  const prepareConnection = async () => {
    if (!activeWorkspaceId || !readiness?.ready || phase !== "idle" || prepareRef.current) return;
    const workspaceId = activeWorkspaceId;
    const controller = new AbortController();
    prepareRef.current = controller;
    setPhase("preparing");
    setError("");
    setNotice("");
    try {
      const [newSession, sdk] = await Promise.all([
        signupRequest<SignupSession>("/api/meta/embedded-signup/start", {
          method: "POST", signal: controller.signal, body: JSON.stringify({ workspace_id: workspaceId }),
        }),
        loadFacebookSDK(readiness),
      ]);
      if (controller.signal.aborted || workspaceRef.current !== workspaceId) return;
      if (!newSession.sessionId || !newSession.csrfToken
        || newSession.appId !== readiness.appId || newSession.configId !== readiness.configId
        || newSession.graphVersion !== readiness.graphVersion
        || !Number.isFinite(Date.parse(newSession.expiresAt)) || Date.parse(newSession.expiresAt) <= Date.now()) {
        throw new Error("No se pudo preparar una sesión válida. Actualizá el estado e intentá nuevamente.");
      }
      sdkRef.current = sdk;
      setSession({ ...newSession, workspaceId });
      setPhase("prepared");
    } catch (cause) {
      if (controller.signal.aborted || workspaceRef.current !== workspaceId) return;
      setSession(null);
      setPhase("idle");
      setError(cause instanceof Error ? cause.message : "No se pudo preparar la conexión.");
    } finally {
      if (prepareRef.current === controller) prepareRef.current = null;
    }
  };

  const launchSignup = () => {
    if (!session || !sdkRef.current || phase !== "prepared" || !activeWorkspaceId || session.workspaceId !== activeWorkspaceId || attemptRef.current) return;
    if (Date.parse(session.expiresAt) <= Date.now()) {
      setSession(null);
      setPhase("idle");
      setError("La sesión de conexión venció. Prepará una nueva para continuar.");
      return;
    }
    setError("");
    setPhase("authorizing");
    const attempt: Attempt = {
      workspaceId: activeWorkspaceId, session, submitted: false, controller: new AbortController(),
    };
    attemptRef.current = attempt;
    attempt.timer = setTimeout(() => failAttempt(attempt,
      "La conexión no finalizó. Si no se abrió Meta, permití las ventanas emergentes y volvé a intentarlo."), 5 * 60_000);
    try {
      // Keep FB.login synchronous with this user click so browsers can open its popup.
      sdkRef.current.login((response) => {
        if (attemptRef.current !== attempt || workspaceRef.current !== attempt.workspaceId) return;
        const code = response.authResponse?.code;
        if (!code || typeof code !== "string") {
          failAttempt(attempt, "Meta no devolvió una autorización. Podés volver a conectar la cuenta.");
          return;
        }
        attempt.code = code;
        if (!attempt.assets) {
          if (attempt.timer) clearTimeout(attempt.timer);
          attempt.timer = setTimeout(() => failAttempt(attempt,
            "Meta devolvió la autorización pero no los datos de la cuenta y el número. La conexión no se guardó; iniciá nuevamente el flujo."), 20_000);
        }
        void completeAttempt(attempt);
      }, {
        config_id: session.configId,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {} },
      });
    } catch {
      failAttempt(attempt, "No se pudo abrir Meta. Permití las ventanas emergentes e intentá nuevamente.");
    }
  };

  const cancelConnection = () => {
    prepareRef.current?.abort();
    prepareRef.current = null;
    clearAttempt();
    setSession(null);
    setPhase("idle");
    setNotice("Se canceló este intento en Waneia. Cerrá la ventana de Meta si sigue abierta.");
  };

  const account = readiness?.account;
  const subscribed = account?.webhook_subscribed === true;
  const busy = phase === "preparing" || phase === "authorizing" || phase === "completing";
  const statusTitle = loading ? "Consultando conexión de WhatsApp" : account
    ? subscribed ? "Cuenta autorizada y suscripta" : "Cuenta guardada: conexión pendiente"
    : "WhatsApp pendiente de conexión";

  return (
    <div className="space-y-4">
      <Card className={`p-5 ${subscribed ? "border-emerald-300/25 bg-emerald-500/5" : "border-amber-300/20 bg-amber-500/5"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${subscribed ? "border-emerald-300/20 bg-emerald-500/10" : "border-amber-300/20 bg-amber-500/10"}`}>
              {subscribed ? <CheckCircle2 className="h-5 w-5 text-emerald-200" /> : <Smartphone className="h-5 w-5 text-amber-200" />}
            </span>
            <div>
              <p className="font-semibold">{statusTitle}</p>
              <p className="mt-1 text-xs text-zinc-400">
                {account ? "El estado de autorización no confirma por sí solo la entrega de mensajes." : `Conectá la cuenta de WhatsApp de ${activeWorkspace.name} desde Meta.`}
              </p>
            </div>
          </div>
          <Button onClick={() => void loadStatus(activeWorkspaceId)} disabled={loading || phase !== "idle" || !activeWorkspaceId}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Actualizar
          </Button>
        </div>
      </Card>

      {error ? <div role="alert" className="rounded-xl border border-red-300/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div> : null}
      {notice ? <div role="status" className="rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">{notice}</div> : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-200" />
            <div><p className="font-semibold">1. Autorizá tu cuenta en Meta</p><p className="text-xs text-zinc-400">La cuenta y el número siguen perteneciendo a tu empresa.</p></div>
          </div>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm text-zinc-300">
            <li>Ingresá con el usuario que administra el negocio en Meta.</li>
            <li>Elegí la empresa, su cuenta de WhatsApp y el número que querés conectar.</li>
            <li>Revisá y aceptá los permisos que solicita Waneia.</li>
            <li>Volvé a esta pantalla para verificar el resultado.</li>
          </ol>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">
            Espacio seleccionado: <strong className="text-zinc-200">{activeWorkspace.name}</strong>. La autorización se guarda para este espacio. Si lo cambiás durante el proceso, iniciá una conexión nueva.
          </div>
          {!loading && readiness && !readiness.ready ? (
            <div role="status" className="mt-4 rounded-xl border border-amber-300/20 bg-amber-500/10 p-3 text-sm text-amber-100">
              {readiness.reason || "La conexión está pendiente de configuración del servicio. Contactá a quien administra Waneia."}
            </div>
          ) : null}
          <Button
            onClick={phase === "prepared" ? launchSignup : () => void prepareConnection()}
            disabled={loading || !readiness?.ready || busy || !activeWorkspaceId}
            className="mt-5 w-full bg-emerald-500/30 hover:bg-emerald-500/40"
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
            {phase === "preparing" ? "Preparando conexión…" : phase === "prepared" ? "Continuar con Meta"
              : phase === "authorizing" ? "Completá la autorización en Meta…" : phase === "completing" ? "Validando autorización…"
                : account ? "Volver a autorizar con Meta" : "Preparar conexión con Meta"}
          </Button>
          {phase === "prepared" ? <p className="mt-2 text-xs text-zinc-400">La sesión está lista. Continuá para abrir la ventana segura de Meta.</p> : null}
          {phase !== "idle" && phase !== "completing" ? <Button onClick={cancelConnection} className="mt-2 w-full">Cancelar este intento</Button> : null}
          <p className="mt-3 text-xs text-zinc-400">No necesitás copiar claves ni tokens. La autorización se procesa de forma segura en el servidor.</p>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2"><Webhook className="h-4 w-4 text-emerald-200" /><p className="font-semibold">2. Recepción de mensajes</p></div>
            <p className="mt-4 text-sm text-zinc-300">Waneia solicita la suscripción de tu cuenta para recibir mensajes y actualizaciones de entrega.</p>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">
              {subscribed ? "Suscripción de la cuenta guardada. Falta comprobar la recepción real de un mensaje." : "La suscripción se verifica después de completar la autorización en Meta."}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2"><MessageCircleMore className="h-4 w-4 text-cyan-200" /><p className="font-semibold">3. Probá la conversación</p></div>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-300">
              <li>Desde un celular autorizado para la prueba, escribí al número conectado.</li>
              <li>Buscá el mensaje recibido en Conversaciones.</li>
              <li>Respondé desde Waneia y verificá la recepción en el celular.</li>
              <li>Revisá los estados de entrega que informe Meta.</li>
            </ol>
            <p className="mt-4 text-xs text-zinc-400">La prueba requiere mensajes reales. Los estados pueden variar según la disponibilidad y privacidad del destinatario.</p>
          </Card>
        </div>
      </div>

      {account ? (
        <Card className="p-5">
          <p className="text-sm font-semibold">Cuenta guardada para {activeWorkspace.name}</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-[10px] uppercase text-zinc-400">Número</dt><dd className="mt-1 text-sm">{account.display_phone_number || "Pendiente"}</dd></div>
            <div><dt className="text-[10px] uppercase text-zinc-400">Nombre verificado</dt><dd className="mt-1 text-sm">{account.verified_name || "Pendiente"}</dd></div>
            <div><dt className="text-[10px] uppercase text-zinc-400">Cuenta de WhatsApp</dt><dd className="mt-1 break-all text-sm">{account.waba_id || "Pendiente"}</dd></div>
            <div><dt className="text-[10px] uppercase text-zinc-400">Suscripción</dt><dd className="mt-1 text-sm">{subscribed ? "Guardada" : "Pendiente"}</dd></div>
          </dl>
        </Card>
      ) : null}
    </div>
  );
}
