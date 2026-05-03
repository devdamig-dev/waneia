"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Toast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { businessSettings, messageTemplates } from "@/data/mock-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { BusinessSettings, ConversationCategory } from "@/types/entities";

type SectionKey =
  | "negocio"
  | "whatsapp"
  | "equipo"
  | "colas"
  | "sla"
  | "plantillas"
  | "automatizaciones"
  | "branding"
  | "billing";

const sections: Array<{ key: SectionKey; label: string; description: string }> = [
  { key: "negocio", label: "Perfil del negocio", description: "Datos comerciales y zona horaria" },
  { key: "whatsapp", label: "WhatsApp readiness", description: "Estado y vinculación del número" },
  { key: "equipo", label: "Equipo y roles", description: "Permisos por rol" },
  { key: "colas", label: "Inbox y colas", description: "Colas de atención y etiquetas por defecto" },
  { key: "sla", label: "Reglas SLA", description: "Tiempos por categoría" },
  { key: "plantillas", label: "Plantillas de mensajes", description: "Respuestas reutilizables" },
  { key: "automatizaciones", label: "Defaults de automatización", description: "Comportamiento global de la IA" },
  { key: "branding", label: "Branding", description: "Color, logo y nombre visible" },
  { key: "billing", label: "Facturación", description: "Plan, método de pago y facturación (placeholder)" },
];

export function SettingsClient() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const initial = useMemo(
    () => businessSettings.find((s) => s.workspaceId === activeWorkspaceId) ?? businessSettings[0],
    [activeWorkspaceId],
  );
  const [active, setActive] = useState<SectionKey>("negocio");
  const [form, setForm] = useState<BusinessSettings>(initial);
  const [snapshot, setSnapshot] = useState<BusinessSettings>(initial);
  const [savedAt, setSavedAt] = useState<string>("Sin guardar todavía");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setForm(initial);
    setSnapshot(initial);
    setSavedAt("Sin guardar todavía");
  }, [initial]);

  const dirty = JSON.stringify(form) !== JSON.stringify(snapshot);

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSnapshot(form);
      setSavedAt(`Guardado ${new Date().toLocaleTimeString("es-AR")}`);
      setSaving(false);
      setToast(`${sections.find((s) => s.key === active)?.label} actualizado.`);
    }, 600);
  };

  const reset = () => {
    setForm(snapshot);
    setToast("Cambios descartados.");
  };

  const updateSlaField = (id: string, key: "responseMinutes" | "resolutionMinutes", value: number) =>
    setForm((p) => ({
      ...p,
      slaRules: p.slaRules.map((r) => (r.id === id ? { ...r, [key]: value } : r)),
    }));

  const workspaceTemplates = messageTemplates.filter((t) => t.workspaceId === activeWorkspaceId);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="p-3">
          <p className="px-2 text-xs uppercase tracking-wide text-zinc-400">Configuración · {activeWorkspace.name}</p>
          <div className="mt-2 space-y-1">
            {sections.map((s) => (
              <button key={s.key} onClick={() => setActive(s.key)} className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${active === s.key ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-300 hover:bg-white/10"}`}>
                <p className="font-medium">{s.label}</p>
                <p className="text-[11px] text-zinc-500">{s.description}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">{sections.find((s) => s.key === active)?.label}</h3>
              <p className="text-xs text-zinc-400">{sections.find((s) => s.key === active)?.description}</p>
            </div>
            <div className="flex items-center gap-3">
              {dirty ? <span className="rounded-full border border-amber-300/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-100">Cambios sin guardar</span> : <span className="text-[11px] text-zinc-500">{savedAt}</span>}
            </div>
          </div>

          <div className="mt-4">
            {active === "negocio" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="Nombre comercial"><input value={form.businessName} onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
                <FormField label="Industria"><input value={form.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
                <FormField label="País"><input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
                <FormField label="Zona horaria"><input value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
                <FormField label="Días hábiles"><input value={form.workingDays} onChange={(e) => setForm((p) => ({ ...p, workingDays: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Hora inicio"><input type="time" value={form.startHour} onChange={(e) => setForm((p) => ({ ...p, startHour: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
                  <FormField label="Hora fin"><input type="time" value={form.endHour} onChange={(e) => setForm((p) => ({ ...p, endHour: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
                </div>
                <FormField label="Mensaje de bienvenida"><textarea value={form.welcomeMessage} onChange={(e) => setForm((p) => ({ ...p, welcomeMessage: e.target.value }))} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
                <FormField label="Mensaje fuera de horario"><textarea value={form.offHoursMessage} onChange={(e) => setForm((p) => ({ ...p, offHoursMessage: e.target.value }))} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
                <FormField label="Mensaje de derivación a humano"><textarea value={form.handoffMessage} onChange={(e) => setForm((p) => ({ ...p, handoffMessage: e.target.value }))} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
              </div>
            ) : null}

            {active === "whatsapp" ? (
              <Card className="p-4">
                <p className="text-sm text-zinc-400">Estado actual de la integración</p>
                <p className="mt-1 text-2xl font-semibold capitalize">{activeWorkspace.whatsappStatus}</p>
                <p className="mt-2 text-sm text-zinc-300">Configurá número, business account y webhook desde la pantalla de integración WhatsApp.</p>
                <a href="/dashboard/integracion-whatsapp" className="mt-3 inline-block rounded-xl border border-cyan-300/30 bg-cyan-500/20 px-3 py-2 text-sm">Ir a integración</a>
              </Card>
            ) : null}

            {active === "equipo" ? (
              <div className="space-y-2">
                <p className="text-sm text-zinc-400">Permisos predeterminados por rol. La gestión nominal del equipo está en la sección Equipo.</p>
                {[
                  { label: "Owner gestiona facturación y plan", key: "ownerCanManageBilling" },
                  { label: "Admin administra automatizaciones", key: "adminCanManageAutomations" },
                  { label: "Operator puede cerrar ventas", key: "operatorCanCloseSales" },
                  { label: "Viewer puede exportar reportes", key: "viewerCanExportReports" },
                ].map((p) => (
                  <div key={p.key} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                    <span>{p.label}</span>
                    <ToggleSwitch checked={true} onChange={() => setToast("Permisos guardados (mock)")} />
                  </div>
                ))}
              </div>
            ) : null}

            {active === "colas" ? (
              <div className="space-y-3">
                <FormField label="Colas activas (separadas por coma)"><input value={form.queues.join(", ")} onChange={(e) => setForm((p) => ({ ...p, queues: e.target.value.split(",").map((q) => q.trim()).filter(Boolean) }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
                <FormField label="Etiquetas por defecto (separadas por coma)"><input value={form.defaultTags.join(", ")} onChange={(e) => setForm((p) => ({ ...p, defaultTags: e.target.value.split(",").map((q) => q.trim()).filter(Boolean) }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
                <div className="flex flex-wrap gap-1.5">
                  {form.queues.map((q) => <span key={q} className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-100">{q}</span>)}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.defaultTags.map((t) => <span key={t} className="rounded-full border border-violet-300/30 bg-violet-500/10 px-2 py-0.5 text-[11px] text-violet-100">#{t}</span>)}
                </div>
              </div>
            ) : null}

            {active === "sla" ? (
              <Card className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/10 text-left text-xs text-zinc-400"><th className="p-3">Categoría</th><th className="p-3">Tiempo de respuesta (min)</th><th className="p-3">Tiempo de resolución (min)</th></tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {form.slaRules.map((r) => (
                      <tr key={r.id}>
                        <td className="p-3 capitalize">{r.category}</td>
                        <td className="p-3"><input type="number" value={r.responseMinutes} onChange={(e) => updateSlaField(r.id, "responseMinutes", Number(e.target.value))} className="w-24 rounded-xl border border-white/10 bg-white/5 p-2 text-sm" /></td>
                        <td className="p-3"><input type="number" value={r.resolutionMinutes} onChange={(e) => updateSlaField(r.id, "resolutionMinutes", Number(e.target.value))} className="w-24 rounded-xl border border-white/10 bg-white/5 p-2 text-sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ) : null}

            {active === "plantillas" ? (
              <div className="space-y-2">
                <p className="text-sm text-zinc-400">Plantillas reutilizables para respuestas y campañas.</p>
                {workspaceTemplates.map((t) => (
                  <Card key={t.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-[11px] text-zinc-400">Categoría: {t.category} · Variables: {t.variables.join(", ") || "ninguna"}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">{t.id}</span>
                    </div>
                    <p className="mt-2 max-w-xl rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-zinc-200">{t.body}</p>
                  </Card>
                ))}
                <Button onClick={() => setToast("Plantilla creada (mock)")} className="bg-emerald-500/30 hover:bg-emerald-500/40">Crear plantilla</Button>
              </div>
            ) : null}

            {active === "automatizaciones" ? (
              <div className="space-y-2">
                {[
                  { key: "aiEnabled" as const, label: "Clasificación automática IA", desc: "Habilita el motor de intención por mensaje." },
                  { key: "autoAssign" as const, label: "Asignación automática", desc: "Deriva según categoría detectada." },
                  { key: "pauseLowConfidence" as const, label: "Pausar baja confianza", desc: "Evita respuestas debajo del umbral." },
                  { key: "notifyHumanHandoff" as const, label: "Notificar derivaciones", desc: "Envía alerta cuando entra al humano." },
                ].map((opt) => (
                  <div key={opt.key} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                    <div><p>{opt.label}</p><p className="text-[11px] text-zinc-400">{opt.desc}</p></div>
                    <ToggleSwitch checked={Boolean(form[opt.key])} onChange={(v) => setForm((p) => ({ ...p, [opt.key]: v }))} />
                  </div>
                ))}
                <Card className="p-3 text-xs text-zinc-400">
                  <p>Categorías reconocidas: presupuesto, pedido, consulta, soporte humano.</p>
                  <p className="mt-1">Las categorías son fijas en esta versión y se reflejan en SLA y reportes.</p>
                </Card>
                <p className="text-[11px] text-zinc-500">Categorías ({(["presupuesto", "pedido", "consulta", "soporte humano"] as ConversationCategory[]).join(", ")})</p>
              </div>
            ) : null}

            {active === "branding" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="Nombre visible"><input value={form.brandName} onChange={(e) => setForm((p) => ({ ...p, brandName: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
                <FormField label="Color principal"><input value={form.primaryColor} onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
                <Card className="p-4 md:col-span-2">
                  <p className="text-sm font-semibold">Preview</p>
                  <div className="mt-2 rounded-xl border border-white/10 p-4">
                    <p style={{ color: form.primaryColor }} className="text-xl font-bold">{form.brandName}</p>
                    <p className="text-xs text-zinc-400">Logo placeholder · subir desde billing/branding (próximamente)</p>
                  </div>
                </Card>
              </div>
            ) : null}

            {active === "billing" ? (
              <Card className="p-4">
                <p className="text-sm text-zinc-400">Plan actual</p>
                <p className="mt-1 text-2xl font-semibold capitalize">{form.plan}</p>
                <p className="mt-2 text-sm text-zinc-300">El detalle de plan, consumo y método de pago está en la sección Facturación.</p>
                <a href="/dashboard/facturacion" className="mt-3 inline-block rounded-xl border border-cyan-300/30 bg-cyan-500/20 px-3 py-2 text-sm">Ir a facturación</a>
              </Card>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500">{savedAt}</span>
            <div className="flex gap-2">
              <Button onClick={reset} disabled={!dirty}>Descartar</Button>
              <Button onClick={save} disabled={!dirty || saving} className="bg-cyan-500/30 hover:bg-cyan-500/40">{saving ? "Guardando…" : "Guardar cambios"}</Button>
            </div>
          </div>
        </Card>
      </div>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
