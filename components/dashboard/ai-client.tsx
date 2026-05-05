"use client";

import { useState } from "react";
import { Bot, Brain, Eye, EyeOff, Loader2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Toast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useAISettings, useConfigurableTemplates } from "@/lib/workspace-config";
import { AIProvider, AITone, AIFallback } from "@/types/config";

const providerModels: Record<AIProvider, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "o4-mini"],
  anthropic: ["claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5"],
  gemini: ["gemini-2.5-flash", "gemini-2.5-pro"],
  custom: ["custom-endpoint"],
};

const toneOptions: Array<{ value: AITone; label: string; description: string }> = [
  { value: "profesional", label: "Profesional", description: "Formal, respuestas detalladas y precisas." },
  { value: "cercano", label: "Cercano", description: "Cálido, vos, emojis sutiles." },
  { value: "comercial", label: "Comercial", description: "Orientado a la conversión, foco en cierre." },
  { value: "tecnico", label: "Técnico", description: "Lenguaje técnico, ideal para soporte avanzado." },
];

const fallbackOptions: Array<{ value: AIFallback; label: string; description: string }> = [
  { value: "derivar humano", label: "Derivar a humano", description: "Si no hay respuesta confiable, deriva al operador disponible." },
  { value: "responder plantilla", label: "Responder con plantilla", description: "Usa una plantilla genérica para no dejar al cliente sin respuesta." },
  { value: "pedir mas datos", label: "Pedir más datos", description: "Le hace al cliente una pregunta de aclaración." },
];

const sampleResponses = [
  "Hola Carla, te paso un presupuesto base por placard 2.5m: AR$ 420.000 con instalación incluida. ¿Coordinamos visita el martes?",
  "Hola Luis, para 20 remeras estampadas el costo unitario es AR$ 4.800. ¿Tenés diseño listo o necesitás asesoramiento?",
  "Hola Diego, te confirmo turno con traumatología el martes 14:30. Por favor, presentate 10 minutos antes.",
];

export function AIClient() {
  const { ai, setAI } = useAISettings();
  const { templates } = useConfigurableTemplates();
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState("");

  const testConnection = () => {
    setTesting(true);
    setTimeout(() => {
      const ok = ai.apiKey.trim().length > 0 || ai.provider === "custom";
      setAI((p) => ({ ...p, connectionStatus: ok ? "ok" : "error", lastTestedAt: new Date().toISOString() }));
      setTesting(false);
      setToast(ok ? "Conexión simulada exitosa." : "No se pudo conectar. Verificá la API key.");
    }, 1100);
  };

  const formatLastTested = ai.lastTestedAt
    ? new Date(ai.lastTestedAt).toLocaleString("es-AR")
    : "Nunca";

  const usage = {
    monthly: 1840,
    estCost: 8.6,
    saved: 124,
    avgConfidence: 89,
  };

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-cyan-200">Motor IA</p>
              <h3 className="text-xl font-semibold inline-flex items-center gap-2"><Brain className="h-5 w-5 text-emerald-300" /> Configuración del asistente</h3>
              <p className="mt-1 text-sm text-zinc-400">Definí proveedor, modelo y comportamiento. Los cambios se guardan en este workspace.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">
              <span>IA habilitada</span>
              <ToggleSwitch checked={ai.enabled} onChange={(v) => setAI((p) => ({ ...p, enabled: v }))} />
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <FormField label="Proveedor" hint="Definí qué motor IA va a responder.">
              <select value={ai.provider} onChange={(e) => setAI((p) => ({ ...p, provider: e.target.value as AIProvider, model: providerModels[e.target.value as AIProvider][0] }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
                <option value="openai" className="bg-[#0b1023]">OpenAI</option>
                <option value="anthropic" className="bg-[#0b1023]">Anthropic</option>
                <option value="gemini" className="bg-[#0b1023]">Google Gemini</option>
                <option value="custom" className="bg-[#0b1023]">Endpoint personalizado</option>
              </select>
            </FormField>
            <FormField label="Modelo" hint="Modelos compatibles del proveedor.">
              <select value={ai.model} onChange={(e) => setAI((p) => ({ ...p, model: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
                {providerModels[ai.provider].map((m) => <option key={m} value={m} className="bg-[#0b1023]">{m}</option>)}
              </select>
            </FormField>
            <FormField label="API key" hint="Solo se guarda en este navegador. Nunca se envía al servidor de WANEIA.">
              <div className="flex gap-2">
                <input type={showKey ? "text" : "password"} value={ai.apiKey} onChange={(e) => setAI((p) => ({ ...p, apiKey: e.target.value }))} placeholder={ai.provider === "anthropic" ? "sk-ant-..." : "sk-..."} className="flex-1 rounded-xl border border-white/10 bg-white/5 p-2.5 font-mono text-xs" />
                <button onClick={() => setShowKey((v) => !v)} aria-label={showKey ? "Ocultar API key" : "Mostrar API key"} className="rounded-xl border border-white/10 bg-white/5 px-3 text-zinc-300">
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>
            {ai.provider === "custom" ? (
              <FormField label="Endpoint personalizado" hint="URL del modelo propio.">
                <input value={ai.customEndpoint ?? ""} onChange={(e) => setAI((p) => ({ ...p, customEndpoint: e.target.value }))} placeholder="https://api.miempresa.com/chat" className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
              </FormField>
            ) : (
              <FormField label="Tope mensual de mensajes" hint="Pausa la IA al alcanzar el límite.">
                <input type="number" value={ai.monthlyMessageCap} onChange={(e) => setAI((p) => ({ ...p, monthlyMessageCap: Number(e.target.value) }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
              </FormField>
            )}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <FormField label={`Temperatura · ${ai.temperature.toFixed(2)}`} hint="0 = preciso · 1 = creativo.">
              <input type="range" min={0} max={1} step={0.05} value={ai.temperature} onChange={(e) => setAI((p) => ({ ...p, temperature: Number(e.target.value) }))} className="w-full" />
            </FormField>
            <Button onClick={testConnection} disabled={testing} className="bg-cyan-500/30 hover:bg-cyan-500/40">
              {testing ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Probando…</> : <><Zap className="mr-1 h-4 w-4" />Probar conexión</>}
            </Button>
          </div>

          <Card className="mt-3 p-3 text-xs">
            <div className="flex items-center justify-between">
              <p className="text-zinc-400">Estado de conexión</p>
              <span className={`rounded-full border px-2 py-0.5 ${ai.connectionStatus === "ok" ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100" : ai.connectionStatus === "error" ? "border-rose-300/40 bg-rose-500/10 text-rose-100" : "border-zinc-300/30 bg-white/5 text-zinc-300"}`}>
                {ai.connectionStatus === "ok" ? "Conectado" : ai.connectionStatus === "error" ? "Error" : "No probada"}
              </span>
            </div>
            <p className="mt-1 text-zinc-500">Última prueba: {formatLastTested}</p>
          </Card>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-sm font-semibold inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-300" /> Tono de respuesta</p>
            <p className="mt-1 text-xs text-zinc-400">Cómo le habla la IA a tus clientes.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {toneOptions.map((t) => (
                <button key={t.value} onClick={() => setAI((p) => ({ ...p, tone: t.value }))} className={`rounded-xl border p-3 text-left text-xs transition ${ai.tone === t.value ? "border-cyan-300/40 bg-cyan-500/10 text-cyan-100" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="mt-0.5 text-[11px] opacity-80">{t.description}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold">Comportamiento de fallback</p>
            <p className="mt-1 text-xs text-zinc-400">Qué hace la IA cuando no está segura de la respuesta.</p>
            <div className="mt-3 space-y-2">
              {fallbackOptions.map((f) => (
                <button key={f.value} onClick={() => setAI((p) => ({ ...p, fallback: f.value }))} className={`w-full rounded-xl border p-3 text-left text-xs transition ${ai.fallback === f.value ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="mt-0.5 text-[11px] opacity-80">{f.description}</p>
                </button>
              ))}
            </div>
            {ai.fallback === "responder plantilla" ? (
              <FormField label="Plantilla de respaldo" hint="Se envía cuando la IA no encuentra una respuesta confiable.">
                <select value={ai.fallbackTemplateId ?? ""} onChange={(e) => setAI((p) => ({ ...p, fallbackTemplateId: e.target.value || null }))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
                  <option value="" className="bg-[#0b1023]">Elegí una plantilla</option>
                  {templates.map((t) => <option key={t.id} value={t.id} className="bg-[#0b1023]">{t.name}</option>)}
                </select>
              </FormField>
            ) : null}
          </Card>
        </div>
      </div>

      <Card className="mt-4 p-5">
        <p className="text-sm font-semibold inline-flex items-center gap-2"><Bot className="h-4 w-4 text-cyan-300" /> Uso del mes (estimado)</p>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <Card className="p-3"><p className="text-[11px] text-zinc-400">Mensajes IA</p><p className="text-lg font-bold">{usage.monthly.toLocaleString("es-AR")}</p><p className="text-[11px] text-zinc-500">de {ai.monthlyMessageCap.toLocaleString("es-AR")}</p></Card>
          <Card className="p-3"><p className="text-[11px] text-zinc-400">Costo estimado</p><p className="text-lg font-bold text-emerald-100">US$ {usage.estCost.toFixed(2)}</p></Card>
          <Card className="p-3"><p className="text-[11px] text-zinc-400">Tareas evitadas a humanos</p><p className="text-lg font-bold text-cyan-100">{usage.saved}</p></Card>
          <Card className="p-3"><p className="text-[11px] text-zinc-400">Confianza promedio</p><p className="text-lg font-bold text-violet-100">{usage.avgConfidence}%</p></Card>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${Math.min((usage.monthly / Math.max(ai.monthlyMessageCap, 1)) * 100, 100)}%` }} /></div>
      </Card>

      <Card className="mt-4 p-5">
        <p className="text-sm font-semibold">Últimas respuestas generadas (muestra)</p>
        <p className="mt-1 text-xs text-zinc-400">Ejemplos de lo que respondería la IA con la configuración actual.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {sampleResponses.map((r, i) => (
            <Card key={i} className="p-3">
              <p className="text-[11px] text-emerald-200/70 uppercase tracking-wide">Tono {ai.tone}</p>
              <p className="mt-1 text-xs text-zinc-200">{r}</p>
            </Card>
          ))}
        </div>
      </Card>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
