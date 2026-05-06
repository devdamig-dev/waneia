"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Circle, Copy, EyeOff, Loader2, ShieldCheck, Sparkles, Wifi, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Toast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { whatsappConnectionData } from "@/data/saas-data";

const GUIDE_STORAGE_PREFIX = "waneia.guide.whatsapp.";

type StepKey = "negocio" | "numero" | "webhook" | "plantillas" | "prueba";

const steps: Array<{ key: StepKey; label: string; description: string }> = [
  { key: "negocio", label: "Cuenta de Meta Business", description: "Conectá la Business Account autorizada para WhatsApp Cloud API." },
  { key: "numero", label: "Número de WhatsApp", description: "Vinculá un número verificado y reservalo para WANEIA." },
  { key: "webhook", label: "Webhook", description: "Validá el endpoint para recibir mensajes en tiempo real." },
  { key: "plantillas", label: "Plantillas iniciales", description: "Subí al menos una plantilla aprobada (HSM)." },
  { key: "prueba", label: "Mensaje de prueba", description: "Probá un envío end-to-end antes de activar." },
];

export function WhatsappConnectionClient() {
  const { activeWorkspace } = useWorkspace();
  const details = whatsappConnectionData[activeWorkspace.id as keyof typeof whatsappConnectionData];

  const initialState = useMemo(() => {
    const isConnected = activeWorkspace.whatsappStatus === "conectado";
    const isPending = activeWorkspace.whatsappStatus === "pendiente";
    return {
      negocio: isConnected || isPending,
      numero: isConnected || isPending,
      webhook: isConnected,
      plantillas: isConnected,
      prueba: isConnected,
    };
  }, [activeWorkspace.id, activeWorkspace.whatsappStatus]);

  const [stepStatus, setStepStatus] = useState<Record<StepKey, boolean>>(initialState);
  const [activeStep, setActiveStep] = useState<StepKey>("negocio");
  const [businessId, setBusinessId] = useState(details.businessAccountId === "—" ? "" : details.businessAccountId);
  const [phone, setPhone] = useState(details.phoneNumber === "—" ? "" : details.phoneNumber);
  const [webhookUrl, setWebhookUrl] = useState(`https://api.waneia.app/webhook/${activeWorkspace.id}`);
  const [verifyToken, setVerifyToken] = useState(`waneia_${activeWorkspace.id}_${Math.random().toString(36).slice(2, 8)}`);
  const [autoActivate, setAutoActivate] = useState(true);
  const [validating, setValidating] = useState<StepKey | null>(null);
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState("");
  const [toast, setToast] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [hydratedDismiss, setHydratedDismiss] = useState(false);

  useEffect(() => {
    setStepStatus(initialState);
    setActiveStep(initialState.negocio && !initialState.webhook ? "webhook" : "negocio");
    setBusinessId(details.businessAccountId === "—" ? "" : details.businessAccountId);
    setPhone(details.phoneNumber === "—" ? "" : details.phoneNumber);
  }, [initialState, details.businessAccountId, details.phoneNumber]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`${GUIDE_STORAGE_PREFIX}${activeWorkspace.id}`);
      setDismissed(raw === "1");
    } catch {
      setDismissed(false);
    }
    setHydratedDismiss(true);
  }, [activeWorkspace.id]);

  const dismissGuide = () => {
    setDismissed(true);
    try { localStorage.setItem(`${GUIDE_STORAGE_PREFIX}${activeWorkspace.id}`, "1"); } catch { /* ignore */ }
    setToast("Guía cerrada. Podés reanudarla cuando quieras.");
  };
  const resumeGuide = () => {
    setDismissed(false);
    try { localStorage.removeItem(`${GUIDE_STORAGE_PREFIX}${activeWorkspace.id}`); } catch { /* ignore */ }
    setToast("Reanudando configuración.");
  };

  const completion = Math.round((Object.values(stepStatus).filter(Boolean).length / steps.length) * 100);
  const allDone = completion === 100;

  const validate = (key: StepKey, durationMs = 1100) => {
    setValidating(key);
    setTimeout(() => {
      setStepStatus((p) => ({ ...p, [key]: true }));
      setValidating(null);
      setToast(`${steps.find((s) => s.key === key)?.label} validado.`);
    }, durationMs);
  };

  const copy = (value: string, label: string) => {
    navigator.clipboard?.writeText(value).catch(() => undefined);
    setToast(`${label} copiado al portapapeles.`);
  };

  const sendTestMessage = () => {
    if (!testInput.trim()) {
      setToast("Ingresá un número o mensaje para la prueba.");
      return;
    }
    setTestResult("Enviando…");
    setTimeout(() => {
      setTestResult(`✅ Mensaje de prueba enviado a ${testInput}. La API respondió 200 OK con id mock_${Date.now().toString(36)}.`);
      setStepStatus((p) => ({ ...p, prueba: true }));
    }, 900);
  };

  if (hydratedDismiss && dismissed) {
    return (
      <>
        <Card className="flex flex-wrap items-center justify-between gap-3 border-emerald-300/30 bg-emerald-500/5 p-4">
          <div>
            <p className="text-sm font-semibold inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Guía de WhatsApp ocultada</p>
            <p className="mt-1 text-xs text-emerald-200/90">{completion}% completado · {Object.values(stepStatus).filter(Boolean).length}/{steps.length} pasos. La guía está oculta. Reanudala cuando quieras seguir configurando.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">Estado: {activeWorkspace.whatsappStatus}</span>
            <Button onClick={resumeGuide} className="bg-emerald-500/30 hover:bg-emerald-500/40"><ArrowRight className="mr-1 h-4 w-4" />Reanudar configuración</Button>
          </div>
        </Card>
        <Toast message={toast} onClose={() => setToast("")} />
      </>
    );
  }

  return (
    <>
      <Card className="flex flex-wrap items-center justify-between gap-2 border-cyan-300/30 bg-cyan-500/5 p-3 text-xs text-cyan-100">
        <div>
          <p className="inline-flex items-center gap-1 font-semibold"><ShieldCheck className="h-3.5 w-3.5" /> Modo simulado</p>
          <p className="mt-1 text-cyan-200/90">Esta pantalla emula el alta con WhatsApp Business Cloud API. Cuando conectes una Meta Business real, los mismos pasos aplican.</p>
        </div>
        <button onClick={dismissGuide} className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-200 hover:bg-white/10" title="Ocultar guía">
          <EyeOff className="h-3.5 w-3.5" />Cerrar guía
        </button>
      </Card>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.1fr_2fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Estado de readiness</p>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] ${allDone ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100" : "border-amber-300/40 bg-amber-500/10 text-amber-100"}`}>
              {allDone ? "Listo para activar" : "En progreso"}
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold">{completion}%</p>
          <div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${completion}%` }} /></div>
          <div className="mt-3 space-y-1">
            {steps.map((s, idx) => {
              const done = stepStatus[s.key];
              const isActive = activeStep === s.key;
              return (
                <button key={s.key} onClick={() => setActiveStep(s.key)} className={`flex w-full items-start gap-2 rounded-xl border p-2.5 text-left text-sm transition ${isActive ? "border-cyan-300/40 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                  {done ? <Check className="mt-0.5 h-4 w-4 text-emerald-300" /> : <Circle className="mt-0.5 h-4 w-4 text-zinc-500" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{idx + 1}. {s.label}</p>
                    <p className="text-[11px] text-zinc-400">{s.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
            <div>
              <p>Activar al completar</p>
              <p className="text-[11px] text-zinc-400">Al terminar los 5 pasos, WANEIA habilita el inbox real automáticamente.</p>
            </div>
            <ToggleSwitch checked={autoActivate} onChange={setAutoActivate} />
          </div>
        </Card>

        <Card className="p-5">
          {activeStep === "negocio" ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Paso 1 — Cuenta Meta Business</p>
              <h3 className="text-xl font-semibold">Conectar Meta Business</h3>
              <p className="text-sm text-zinc-400">Necesitás una cuenta verificada con permisos de WhatsApp Business Management.</p>
              <FormField label="Business Account ID" hint="Lo encontrás en business.facebook.com → Configuración → Información de la cuenta.">
                <input value={businessId} onChange={(e) => setBusinessId(e.target.value)} placeholder="BA-XXXXXX" className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
              </FormField>
              <div className="flex gap-2">
                <Button onClick={() => validate("negocio")} disabled={!businessId || validating === "negocio"} className="bg-emerald-500/30 hover:bg-emerald-500/40">
                  {validating === "negocio" ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Verificando…</> : "Validar cuenta"}
                </Button>
                <Button onClick={() => setActiveStep("numero")} disabled={!stepStatus.negocio}>Siguiente</Button>
              </div>
            </div>
          ) : null}

          {activeStep === "numero" ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Paso 2 — Número de WhatsApp</p>
              <h3 className="text-xl font-semibold">Vincular número</h3>
              <p className="text-sm text-zinc-400">El número debe estar verificado en Meta y no usado en otra app de WhatsApp.</p>
              <FormField label="Número con código de país" hint="Ej.: +54 11 4190 0020">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 ..." className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
              </FormField>
              <div className="flex gap-2">
                <Button onClick={() => validate("numero")} disabled={!phone || validating === "numero"} className="bg-emerald-500/30 hover:bg-emerald-500/40">
                  {validating === "numero" ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Verificando…</> : "Validar número"}
                </Button>
                <Button onClick={() => setActiveStep("webhook")} disabled={!stepStatus.numero}>Siguiente</Button>
              </div>
            </div>
          ) : null}

          {activeStep === "webhook" ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Paso 3 — Webhook</p>
              <h3 className="text-xl font-semibold">Configurar webhook</h3>
              <p className="text-sm text-zinc-400">Pegá esta URL y token en Meta → WhatsApp → Configuración → Webhooks.</p>
              <FormField label="Callback URL">
                <div className="flex gap-2">
                  <input readOnly value={webhookUrl} className="flex-1 rounded-xl border border-white/10 bg-white/5 p-2.5 font-mono text-xs" />
                  <Button onClick={() => copy(webhookUrl, "Callback URL")}><Copy className="h-4 w-4" /></Button>
                </div>
              </FormField>
              <FormField label="Verify Token">
                <div className="flex gap-2">
                  <input value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} className="flex-1 rounded-xl border border-white/10 bg-white/5 p-2.5 font-mono text-xs" />
                  <Button onClick={() => copy(verifyToken, "Verify Token")}><Copy className="h-4 w-4" /></Button>
                </div>
              </FormField>
              <Card className="border-amber-300/20 bg-amber-500/5 p-3 text-[11px] text-amber-100">
                Eventos requeridos: <span className="font-mono">messages</span>, <span className="font-mono">message_template_status_update</span>, <span className="font-mono">account_update</span>.
              </Card>
              <div className="flex gap-2">
                <Button onClick={() => validate("webhook", 1500)} disabled={validating === "webhook"} className="bg-emerald-500/30 hover:bg-emerald-500/40">
                  {validating === "webhook" ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Validando…</> : "Validar webhook"}
                </Button>
                <Button onClick={() => setActiveStep("plantillas")} disabled={!stepStatus.webhook}>Siguiente</Button>
              </div>
            </div>
          ) : null}

          {activeStep === "plantillas" ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Paso 4 — Plantillas iniciales</p>
              <h3 className="text-xl font-semibold">Plantillas aprobadas</h3>
              <p className="text-sm text-zinc-400">Las campañas y respuestas fuera de la ventana de 24h requieren plantillas aprobadas (HSM).</p>
              <div className="space-y-2">
                {[
                  { name: "Bienvenida y opt-in", category: "Utility", status: "Aprobada" },
                  { name: "Confirmación de pedido", category: "Utility", status: "Aprobada" },
                  { name: "Promo estacional", category: "Marketing", status: "En revisión" },
                ].map((t) => (
                  <div key={t.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-[11px] text-zinc-400">{t.category}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${t.status === "Aprobada" ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100" : "border-amber-300/40 bg-amber-500/10 text-amber-100"}`}>{t.status}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => validate("plantillas")} disabled={validating === "plantillas"} className="bg-emerald-500/30 hover:bg-emerald-500/40">
                  {validating === "plantillas" ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Sincronizando…</> : "Sincronizar plantillas"}
                </Button>
                <Button onClick={() => setActiveStep("prueba")} disabled={!stepStatus.plantillas}>Siguiente</Button>
              </div>
            </div>
          ) : null}

          {activeStep === "prueba" ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Paso 5 — Mensaje de prueba</p>
              <h3 className="text-xl font-semibold">Enviar prueba end-to-end</h3>
              <p className="text-sm text-zinc-400">Enviá un mensaje desde tu número WhatsApp al número conectado para verificar el flujo de entrada.</p>
              <FormField label="Número de prueba" hint="Va a recibir el mensaje saliente.">
                <input value={testInput} onChange={(e) => setTestInput(e.target.value)} placeholder="+54 11 ..." className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
              </FormField>
              <Button onClick={sendTestMessage} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Sparkles className="mr-1 h-4 w-4" />Enviar prueba</Button>
              {testResult ? <p className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-zinc-200">{testResult}</p> : null}
              {allDone ? (
                <Card className="mt-3 border-emerald-300/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                  <p className="inline-flex items-center gap-2 font-semibold"><Wifi className="h-4 w-4" /> Conexión lista</p>
                  <p className="mt-1 text-emerald-200/90">El inbox real está listo para activarse cuando subas Meta a producción.</p>
                </Card>
              ) : (
                <Card className="mt-3 border-amber-300/30 bg-amber-500/5 p-3 text-xs text-amber-100">
                  <p className="inline-flex items-center gap-1 font-semibold"><WifiOff className="h-3.5 w-3.5" /> Faltan pasos</p>
                  <p className="mt-1">Completá los pasos anteriores para habilitar el envío real.</p>
                </Card>
              )}
            </div>
          ) : null}
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <p className="text-sm font-semibold">Detalle de conexión actual</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm text-zinc-300">
          <div><p className="text-[11px] text-zinc-500 uppercase">Número</p><p>{phone || "—"}</p></div>
          <div><p className="text-[11px] text-zinc-500 uppercase">Business Account</p><p>{businessId || "—"}</p></div>
          <div><p className="text-[11px] text-zinc-500 uppercase">Webhook</p><p>{stepStatus.webhook ? "Activo" : "Pendiente"}</p></div>
          <div><p className="text-[11px] text-zinc-500 uppercase">Última sincronización</p><p>{details.lastSync}</p></div>
        </div>
      </Card>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
