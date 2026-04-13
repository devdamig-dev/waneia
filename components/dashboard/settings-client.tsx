"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Toast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

type SectionKey = "negocio" | "automatizaciones" | "mensajes" | "horarios" | "derivacion" | "branding" | "whatsapp";

const sectionLabels: Record<SectionKey, string> = {
  negocio: "Negocio",
  automatizaciones: "Automatizaciones",
  mensajes: "Mensajes automáticos",
  horarios: "Horarios",
  derivacion: "Derivación a humano",
  branding: "Branding",
  whatsapp: "Integración WhatsApp",
};

type SettingsState = {
  businessName: string;
  industry: string;
  mainBranch: string;
  objective: string;
  volume: string;
  aiEnabled: boolean;
  autoAssign: boolean;
  pauseLowConfidence: boolean;
  welcomeMessage: string;
  offHoursMessage: string;
  handoffMessage: string;
  closingMessage: string;
  days: string;
  startHour: string;
  endHour: string;
  afterHoursReply: boolean;
  holidayMode: boolean;
  slaMinutes: string;
  humanQueue: string;
  autoPriority: string;
  humanAlerts: boolean;
  brandVisibleName: string;
  primaryColor: string;
  logoPlaceholder: string;
  whatsappStatus: "connected" | "pending" | "not-configured";
};

const initialState: SettingsState = {
  businessName: "WANEIA Demo Store",
  industry: "retail",
  mainBranch: "Palermo, Buenos Aires",
  objective: "Convertir consultas en ventas",
  volume: "120 - 200 por día",
  aiEnabled: true,
  autoAssign: true,
  pauseLowConfidence: false,
  welcomeMessage: "¡Hola! Gracias por escribirnos. En segundos te ayudamos.",
  offHoursMessage: "Estamos fuera de horario. Te respondemos apenas volvamos.",
  handoffMessage: "Te derivo con un asesor especializado en este momento.",
  closingMessage: "¡Gracias por elegirnos! Quedamos disponibles para ayudarte otra vez.",
  days: "Lunes a Sábado",
  startHour: "09:00",
  endHour: "19:00",
  afterHoursReply: true,
  holidayMode: false,
  slaMinutes: "15",
  humanQueue: "Ventas",
  autoPriority: "Alta",
  humanAlerts: true,
  brandVisibleName: "WANEIA",
  primaryColor: "#20f7b8",
  logoPlaceholder: "Logo principal (placeholder)",
  whatsappStatus: "pending",
};

export function SettingsClient() {
  const [active, setActive] = useState<SectionKey>("negocio");
  const [form, setForm] = useState<SettingsState>(initialState);
  const [savedSnapshot, setSavedSnapshot] = useState<SettingsState>(initialState);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const hasUnsavedChanges = JSON.stringify(form) !== JSON.stringify(savedSnapshot);

  const save = () => {
    setLoading(true);
    setTimeout(() => {
      setSavedSnapshot(form);
      setLoading(false);
      setToast(`${sectionLabels[active]} guardado correctamente.`);
    }, 700);
  };

  const resetSection = () => {
    setForm(savedSnapshot);
    setToast("Cambios descartados.");
  };

  const sectionContent = useMemo(() => {
    switch (active) {
      case "negocio":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Nombre del negocio"><input value={form.businessName} onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Rubro"><input value={form.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Sucursal principal"><input value={form.mainBranch} onChange={(e) => setForm((p) => ({ ...p, mainBranch: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Objetivo principal"><input value={form.objective} onChange={(e) => setForm((p) => ({ ...p, objective: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Volumen estimado de conversaciones"><input value={form.volume} onChange={(e) => setForm((p) => ({ ...p, volume: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          </div>
        );
      case "automatizaciones":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"><div><p>Clasificación automática IA</p><p className="text-xs text-zinc-400">Habilita el motor de intención por mensaje.</p></div><ToggleSwitch checked={form.aiEnabled} onChange={(v) => setForm((p) => ({ ...p, aiEnabled: v }))} /></div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"><div><p>Asignación automática</p><p className="text-xs text-zinc-400">Deriva según categoría detectada.</p></div><ToggleSwitch checked={form.autoAssign} onChange={(v) => setForm((p) => ({ ...p, autoAssign: v }))} /></div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"><div><p>Pausar baja confianza</p><p className="text-xs text-zinc-400">Evita respuestas por debajo del umbral.</p></div><ToggleSwitch checked={form.pauseLowConfidence} onChange={(v) => setForm((p) => ({ ...p, pauseLowConfidence: v }))} /></div>
          </div>
        );
      case "mensajes":
        return (
          <div className="space-y-4">
            <FormField label="Mensaje de bienvenida"><textarea value={form.welcomeMessage} onChange={(e) => setForm((p) => ({ ...p, welcomeMessage: e.target.value }))} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Mensaje fuera de horario"><textarea value={form.offHoursMessage} onChange={(e) => setForm((p) => ({ ...p, offHoursMessage: e.target.value }))} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Mensaje de derivación"><textarea value={form.handoffMessage} onChange={(e) => setForm((p) => ({ ...p, handoffMessage: e.target.value }))} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Mensaje de cierre"><textarea value={form.closingMessage} onChange={(e) => setForm((p) => ({ ...p, closingMessage: e.target.value }))} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <Card className="p-3"><p className="text-sm font-semibold">Vista previa</p><p className="mt-2 text-sm text-zinc-300">{form.welcomeMessage}</p></Card>
          </div>
        );
      case "horarios":
        return (
          <div className="space-y-4">
            <FormField label="Días de atención"><input value={form.days} onChange={(e) => setForm((p) => ({ ...p, days: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Inicio"><input type="time" value={form.startHour} onChange={(e) => setForm((p) => ({ ...p, startHour: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
              <FormField label="Fin"><input type="time" value={form.endHour} onChange={(e) => setForm((p) => ({ ...p, endHour: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"><span>Responder fuera de horario</span><ToggleSwitch checked={form.afterHoursReply} onChange={(v) => setForm((p) => ({ ...p, afterHoursReply: v }))} /></div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"><span>Feriados / excepciones (mock)</span><ToggleSwitch checked={form.holidayMode} onChange={(v) => setForm((p) => ({ ...p, holidayMode: v }))} /></div>
          </div>
        );
      case "derivacion":
        return (
          <div className="space-y-4">
            <FormField label="SLA objetivo (min)"><input value={form.slaMinutes} onChange={(e) => setForm((p) => ({ ...p, slaMinutes: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Cola / equipo"><input value={form.humanQueue} onChange={(e) => setForm((p) => ({ ...p, humanQueue: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Prioridad automática"><input value={form.autoPriority} onChange={(e) => setForm((p) => ({ ...p, autoPriority: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"><span>Notificaciones internas</span><ToggleSwitch checked={form.humanAlerts} onChange={(v) => setForm((p) => ({ ...p, humanAlerts: v }))} /></div>
          </div>
        );
      case "branding":
        return (
          <div className="space-y-4">
            <FormField label="Nombre visible"><input value={form.brandVisibleName} onChange={(e) => setForm((p) => ({ ...p, brandVisibleName: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Color principal"><input value={form.primaryColor} onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Logo placeholder"><input value={form.logoPlaceholder} onChange={(e) => setForm((p) => ({ ...p, logoPlaceholder: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <Card className="p-4"><p className="text-sm font-semibold">Preview</p><div className="mt-2 rounded-xl border border-white/10 p-4"><p style={{ color: form.primaryColor }} className="font-bold">{form.brandVisibleName}</p><p className="text-xs text-zinc-500">{form.logoPlaceholder}</p></div></Card>
          </div>
        );
      case "whatsapp":
        return (
          <Card className="p-5">
            <p className="text-sm text-zinc-400">Estado de integración</p>
            <p className="mt-2 text-2xl font-semibold capitalize">{form.whatsappStatus.replace("-", " ")}</p>
            <p className="mt-2 text-sm text-zinc-300">Próximamente vas a conectar WhatsApp Business API desde esta pantalla. Por ahora podés usar el entorno demo con lógica simulada premium.</p>
          </Card>
        );
      default:
        return null;
    }
  }, [active, form]);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card className="p-3">
          {(Object.keys(sectionLabels) as SectionKey[]).map((section) => (
            <button key={section} onClick={() => setActive(section)} className={`mb-1 w-full rounded-xl px-3 py-2 text-left text-sm transition ${active === section ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-300 hover:bg-white/10"}`}>{sectionLabels[section]}</button>
          ))}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{sectionLabels[active]}</h3>
            {hasUnsavedChanges ? <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-100">Cambios sin guardar</span> : <span className="text-xs text-zinc-500">Todo guardado</span>}
          </div>
          {sectionContent}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button onClick={resetSection} disabled={!hasUnsavedChanges}>Cancelar / Reset</Button>
            <Button onClick={save} disabled={!hasUnsavedChanges || loading} className="bg-cyan-500/20 hover:bg-cyan-500/30">{loading ? "Guardando..." : "Guardar cambios"}</Button>
          </div>
        </Card>
      </div>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
