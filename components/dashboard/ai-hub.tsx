"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Loader2, MessageSquareCode, Plus, Settings as SettingsIcon, Sparkles, TestTube, Trash2, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Toast } from "@/components/ui/toast";
import { useAIModelProfiles, useAIPrompts, useAISettings, useKnowledge } from "@/lib/workspace-config";
import { AIClient } from "@/components/dashboard/ai-client";
import { AIPrompt, AIModelProfile, AIProvider } from "@/types/config";

type Tab = "config" | "kb" | "prompts" | "models" | "test";

const tabs: Array<{ id: Tab; label: string; icon: typeof SettingsIcon; description: string }> = [
  { id: "config", label: "Configuración", icon: SettingsIcon, description: "Proveedor, modelo, key, tono y fallback." },
  { id: "kb", label: "Base de conocimiento", icon: BookOpen, description: "Artículos, FAQ y catálogos para alimentar a la IA." },
  { id: "prompts", label: "Prompts", icon: MessageSquareCode, description: "Plantillas de instrucciones para distintos casos." },
  { id: "models", label: "Modelos", icon: Sparkles, description: "Perfiles de modelo (proveedor, costo, contexto)." },
  { id: "test", label: "Testing", icon: TestTube, description: "Probar IA con un mensaje real y ver el resultado simulado." },
];

const providers: AIProvider[] = ["openai", "anthropic", "gemini", "custom"];

export function AIHub() {
  const [tab, setTab] = useState<Tab>("config");

  return (
    <>
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-1 text-sm">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition ${tab === t.id ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-300 hover:bg-white/10"}`}>
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 px-1 text-[11px] text-zinc-400">{tabs.find((t) => t.id === tab)?.description}</p>
      </Card>

      <div className="mt-4">
        {tab === "config" ? <AIClient /> : null}
        {tab === "kb" ? <KnowledgePromo /> : null}
        {tab === "prompts" ? <PromptsTab /> : null}
        {tab === "models" ? <ModelsTab /> : null}
        {tab === "test" ? <TestingTab /> : null}
      </div>
    </>
  );
}

function KnowledgePromo() {
  const { articles } = useKnowledge();
  return (
    <div className="space-y-3">
      <Card className="p-5">
        <p className="text-sm font-semibold inline-flex items-center gap-2"><Brain className="h-4 w-4 text-emerald-300" /> Base de conocimiento</p>
        <p className="mt-1 text-xs text-zinc-400">{articles.length} artículos disponibles · {articles.filter((a) => a.usedByAi).length} usados por la IA · {articles.filter((a) => a.trainingStatus !== "activo").length} pendientes de entrenamiento.</p>
        <Link href="/dashboard/base-conocimiento" className="mt-3 inline-flex items-center gap-1 rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20">
          Abrir base de conocimiento <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Card>
      <Card className="p-3 text-xs text-zinc-400">
        Tip: cuanto más rica sea tu base de conocimiento, mejor responderá la IA. Cargá políticas, catálogo, FAQ y casos típicos.
      </Card>
    </div>
  );
}

function PromptsTab() {
  const { prompts, setPrompts } = useAIPrompts();
  const [selectedId, setSelectedId] = useState<string>(prompts[0]?.id ?? "");
  const [toast, setToast] = useState("");
  const selected = prompts.find((p) => p.id === selectedId) ?? prompts[0];

  const update = (id: string, patch: Partial<AIPrompt>) =>
    setPrompts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)));
  const remove = (id: string) => { setPrompts((prev) => prev.filter((p) => p.id !== id)); setToast("Prompt eliminado."); };
  const create = () => {
    const p: AIPrompt = {
      id: `pr-${Date.now()}`,
      name: "Nuevo prompt",
      intent: "—",
      body: "Sos un asistente comercial. Responde {{...}}.",
      variables: [],
      updatedAt: new Date().toISOString(),
    };
    setPrompts((prev) => [p, ...prev]);
    setSelectedId(p.id);
    setToast("Prompt creado.");
  };

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
        <Card className="p-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Prompts del workspace</p>
            <button onClick={create} className="rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-100"><Plus className="inline h-3 w-3" /> Nuevo</button>
          </div>
          <div className="mt-3 space-y-1">
            {prompts.map((p) => (
              <button key={p.id} onClick={() => setSelectedId(p.id)} className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${selectedId === p.id ? "bg-cyan-500/20 text-cyan-100" : "hover:bg-white/10"}`}>
                <p className="font-medium">{p.name}</p>
                <p className="text-[11px] text-zinc-400">{p.intent}</p>
              </button>
            ))}
          </div>
        </Card>

        {selected ? (
          <Card className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <input value={selected.name} onChange={(e) => update(selected.id, { name: e.target.value })} className="w-full bg-transparent text-xl font-semibold focus:outline-none" />
                <input value={selected.intent} onChange={(e) => update(selected.id, { intent: e.target.value })} className="mt-1 w-full bg-transparent text-xs text-zinc-400 focus:outline-none" />
              </div>
              <button onClick={() => remove(selected.id)} className="rounded-xl border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
            </div>
            <FormField label="Cuerpo del prompt" hint="Usá variables tipo {{nombre}}, {{negocio}}, {{tono}}.">
              <textarea value={selected.body} onChange={(e) => {
                const variables = Array.from(new Set([...e.target.value.matchAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g)].map((m) => m[1])));
                update(selected.id, { body: e.target.value, variables });
              }} className="mt-1 min-h-40 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 font-mono text-xs" />
            </FormField>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="text-zinc-400">Variables:</span>
              {selected.variables.length === 0 ? <span className="text-zinc-500">ninguna</span> : selected.variables.map((v) => <span key={v} className="rounded-full border border-violet-300/30 bg-violet-500/10 px-2 py-0.5 text-violet-100">{`{{${v}}}`}</span>)}
            </div>
            <p className="mt-3 text-[11px] text-zinc-500">Última actualización: {new Date(selected.updatedAt).toLocaleString("es-AR")}</p>
          </Card>
        ) : (
          <Card className="p-6 text-center text-sm text-zinc-400">Seleccioná un prompt o creá uno nuevo.</Card>
        )}
      </div>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}

function ModelsTab() {
  const { profiles, setProfiles } = useAIModelProfiles();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ provider: "openai" as AIProvider, model: "", alias: "", notes: "", costPer1kTokens: 0.001, contextWindow: 128000 });
  const [toast, setToast] = useState("");

  const update = (id: string, patch: Partial<AIModelProfile>) =>
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id: string) => { setProfiles((prev) => prev.filter((p) => p.id !== id)); setToast("Perfil eliminado."); };
  const setPrimary = (id: string) => { setProfiles((prev) => prev.map((p) => ({ ...p, isPrimary: p.id === id }))); setToast("Modelo primario actualizado."); };
  const create = () => {
    if (!draft.model.trim()) { setToast("Modelo vacío."); return; }
    const p: AIModelProfile = { id: `mp-${Date.now()}`, ...draft, isPrimary: false };
    setProfiles((prev) => [...prev, p]);
    setOpen(false);
    setDraft({ provider: "openai", model: "", alias: "", notes: "", costPer1kTokens: 0.001, contextWindow: 128000 });
    setToast("Perfil creado.");
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">Definí perfiles de modelo para distintas tareas (resúmenes baratos, razonamiento profundo, multimodal).</p>
        <Button onClick={() => setOpen(true)} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Plus className="mr-1 h-4 w-4" />Nuevo modelo</Button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {profiles.map((p) => (
          <Card key={p.id} className={`p-4 ${p.isPrimary ? "border-emerald-300/40" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{p.alias || p.model}</p>
                <p className="text-[11px] text-zinc-400">{p.provider} · {p.model}</p>
              </div>
              {p.isPrimary ? <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-100">Primario</span> : <button onClick={() => setPrimary(p.id)} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300 hover:bg-white/10">Marcar primario</button>}
            </div>
            <p className="mt-2 text-xs text-zinc-300">{p.notes}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-400">
              <span>Costo: US$ {p.costPer1kTokens.toFixed(4)}/1k tokens</span>
              <span>Contexto: {p.contextWindow.toLocaleString("es-AR")} tokens</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <input value={p.alias} onChange={(e) => update(p.id, { alias: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-xs" placeholder="Alias" />
              <input type="number" step="0.0001" value={p.costPer1kTokens} onChange={(e) => update(p.id, { costPer1kTokens: Number(e.target.value) })} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-xs" />
              <button onClick={() => remove(p.id)} className="rounded-lg border border-rose-300/30 bg-rose-500/10 p-1 text-xs text-rose-100">Eliminar</button>
            </div>
          </Card>
        ))}
      </div>
      {open ? (
        <Card className="mt-3 p-4">
          <p className="text-sm font-semibold">Nuevo perfil de modelo</p>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <FormField label="Proveedor">
              <select value={draft.provider} onChange={(e) => setDraft((p) => ({ ...p, provider: e.target.value as AIProvider }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm">
                {providers.map((pv) => <option key={pv} value={pv} className="bg-[#0b1023]">{pv}</option>)}
              </select>
            </FormField>
            <FormField label="Modelo"><input value={draft.model} onChange={(e) => setDraft((p) => ({ ...p, model: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm" placeholder="claude-sonnet-4-6" /></FormField>
            <FormField label="Alias"><input value={draft.alias} onChange={(e) => setDraft((p) => ({ ...p, alias: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm" placeholder="Equilibrado" /></FormField>
            <FormField label="Costo / 1k tokens"><input type="number" step="0.0001" value={draft.costPer1kTokens} onChange={(e) => setDraft((p) => ({ ...p, costPer1kTokens: Number(e.target.value) }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm" /></FormField>
            <FormField label="Contexto (tokens)"><input type="number" value={draft.contextWindow} onChange={(e) => setDraft((p) => ({ ...p, contextWindow: Number(e.target.value) }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm" /></FormField>
            <FormField label="Notas"><input value={draft.notes} onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2 text-sm" /></FormField>
          </div>
          <div className="mt-2 flex justify-end gap-2"><Button onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={create} className="bg-emerald-500/30 hover:bg-emerald-500/40">Crear</Button></div>
        </Card>
      ) : null}
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}

function TestingTab() {
  const { ai } = useAISettings();
  const { prompts } = useAIPrompts();
  const { articles } = useKnowledge();
  const [promptId, setPromptId] = useState<string>(prompts[0]?.id ?? "");
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ intent: string; confidence: number; sentiment: string; urgency: string; commercialScore: number; reply: string; basedOn: string[] } | null>(null);

  const usedArticles = useMemo(() => articles.filter((a) => a.usedByAi).slice(0, 3), [articles]);

  const run = () => {
    if (!input.trim()) return;
    setRunning(true);
    setTimeout(() => {
      const lower = input.toLowerCase();
      const isQuote = /precio|presupuesto|costo|cotiz/.test(lower);
      const isComplaint = /reclamo|problema|enojado|mal/.test(lower);
      const isHuman = /humano|asesor|persona/.test(lower);
      const intent = isQuote ? "cotización" : isComplaint ? "reclamo" : isHuman ? "derivación humana" : "consulta";
      const sentiment = isComplaint ? "negativo" : /gracias|bien|excelente/.test(lower) ? "positivo" : "neutral";
      const urgency = isComplaint || isHuman ? "alta" : isQuote ? "media" : "baja";
      const commercialScore = isQuote ? 85 : isHuman ? 65 : isComplaint ? 30 : 50;
      const reply = isQuote
        ? "¡Hola! Te paso un presupuesto base hoy mismo. ¿Me confirmás producto y cantidad?"
        : isHuman
          ? "Te derivo con un asesor humano en este momento."
          : isComplaint
            ? "Lamento la situación. Te escalamos al líder de soporte para resolverlo cuanto antes."
            : "¡Gracias por escribir! ¿En qué podemos ayudarte?";
      setResult({
        intent,
        confidence: 78 + Math.round(Math.random() * 18),
        sentiment,
        urgency,
        commercialScore,
        reply,
        basedOn: usedArticles.map((a) => a.title),
      });
      setRunning(false);
    }, 1100);
  };

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
      <Card className="p-5">
        <p className="text-sm font-semibold inline-flex items-center gap-2"><TestTube className="h-4 w-4 text-cyan-300" /> Probador de IA</p>
        <p className="mt-1 text-xs text-zinc-400">Simulá la respuesta del asistente con la configuración actual.</p>
        <div className="mt-3 grid gap-2">
          <FormField label="Prompt aplicado">
            <select value={promptId} onChange={(e) => setPromptId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
              {prompts.map((p) => <option key={p.id} value={p.id} className="bg-[#0b1023]">{p.name}</option>)}
            </select>
          </FormField>
          <FormField label="Mensaje del cliente">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hola, quería precio de placard 2.5m" className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
          </FormField>
          <Button onClick={run} disabled={running} className="bg-cyan-500/30 hover:bg-cyan-500/40">
            {running ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Ejecutando…</> : <><Zap className="mr-1 h-4 w-4" />Probar IA</>}
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-zinc-500">Modelo activo: {ai.provider} · {ai.model} · tono {ai.tone}</p>
      </Card>

      {result ? (
        <Card className="p-5">
          <p className="text-sm font-semibold inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-emerald-300" /> Resultado</p>
          <div className="mt-3 grid gap-2 text-xs">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2"><span className="text-zinc-400">Intent detectado:</span> <span className="font-semibold">{result.intent}</span> · confianza {result.confidence}%</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2"><span className="text-zinc-400">Sentimiento:</span> {result.sentiment} · <span className="text-zinc-400">Urgencia:</span> {result.urgency}</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2"><span className="text-zinc-400">Score comercial:</span> {result.commercialScore}/100</div>
            <div className="rounded-2xl bg-emerald-500/15 p-3 text-sm text-emerald-50"><p className="font-medium">Respuesta sugerida</p><p className="mt-1">{result.reply}</p></div>
            {result.basedOn.length > 0 ? (
              <p className="text-[11px] text-zinc-500">Fuentes usadas: {result.basedOn.join(" · ")}</p>
            ) : null}
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center text-sm text-zinc-400">El resultado de la prueba aparecerá acá.</Card>
      )}
    </div>
  );
}
