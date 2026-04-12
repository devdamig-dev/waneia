"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Toast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

type SectionKey = "negocio" | "automatizaciones" | "mensajes" | "horarios" | "derivacion";

const sectionLabels: Record<SectionKey, string> = {
  negocio: "Negocio",
  automatizaciones: "Automatizaciones",
  mensajes: "Mensajes automáticos",
  horarios: "Horarios",
  derivacion: "Derivación a humano",
};

export function SettingsClient() {
  const [active, setActive] = useState<SectionKey>("negocio");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    businessName: "WANEIA Demo Store",
    industry: "retail",
    timezone: "America/Argentina/Buenos_Aires",
    aiEnabled: true,
    autoAssign: true,
    welcomeMessage: "¡Hola! Gracias por escribirnos. En segundos te ayudamos.",
    followUpMessage: "¿Querés que te enviemos una propuesta personalizada?",
    startHour: "09:00",
    endHour: "19:00",
    afterHoursReply: true,
    humanQueue: "Ventas",
    slaMinutes: "15",
    humanAlerts: true,
  });

  const save = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setToast(`${sectionLabels[active]} guardado correctamente.`);
    }, 700);
  };

  const sectionContent = useMemo(() => {
    switch (active) {
      case "negocio":
        return (
          <div className="space-y-4">
            <FormField label="Nombre comercial">
              <input value={form.businessName} onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
            </FormField>
            <FormField label="Industria">
              <select value={form.industry} onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
                <option value="retail" className="bg-[#0b1023]">Retail</option>
                <option value="servicios" className="bg-[#0b1023]">Servicios</option>
                <option value="salud" className="bg-[#0b1023]">Salud</option>
                <option value="educacion" className="bg-[#0b1023]">Educación</option>
              </select>
            </FormField>
            <FormField label="Zona horaria">
              <input value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
            </FormField>
          </div>
        );
      case "automatizaciones":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <p>IA de clasificación</p>
                <p className="text-xs text-zinc-400">Detecta intención en tiempo real</p>
              </div>
              <ToggleSwitch checked={form.aiEnabled} onChange={(v) => setForm((p) => ({ ...p, aiEnabled: v }))} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <p>Asignación automática</p>
                <p className="text-xs text-zinc-400">Envía a cola según categoría</p>
              </div>
              <ToggleSwitch checked={form.autoAssign} onChange={(v) => setForm((p) => ({ ...p, autoAssign: v }))} />
            </div>
          </div>
        );
      case "mensajes":
        return (
          <div className="space-y-4">
            <FormField label="Mensaje de bienvenida">
              <textarea value={form.welcomeMessage} onChange={(e) => setForm((p) => ({ ...p, welcomeMessage: e.target.value }))} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
            </FormField>
            <FormField label="Mensaje de seguimiento">
              <textarea value={form.followUpMessage} onChange={(e) => setForm((p) => ({ ...p, followUpMessage: e.target.value }))} className="min-h-20 w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
            </FormField>
          </div>
        );
      case "horarios":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Inicio de atención">
                <input type="time" value={form.startHour} onChange={(e) => setForm((p) => ({ ...p, startHour: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
              </FormField>
              <FormField label="Fin de atención">
                <input type="time" value={form.endHour} onChange={(e) => setForm((p) => ({ ...p, endHour: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
              </FormField>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <p>Respuesta fuera de horario</p>
                <p className="text-xs text-zinc-400">Enviá mensaje automático nocturno</p>
              </div>
              <ToggleSwitch checked={form.afterHoursReply} onChange={(v) => setForm((p) => ({ ...p, afterHoursReply: v }))} />
            </div>
          </div>
        );
      case "derivacion":
        return (
          <div className="space-y-4">
            <FormField label="Cola de derivación">
              <select value={form.humanQueue} onChange={(e) => setForm((p) => ({ ...p, humanQueue: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
                <option className="bg-[#0b1023]">Ventas</option>
                <option className="bg-[#0b1023]">Soporte</option>
                <option className="bg-[#0b1023]">Recepción</option>
              </select>
            </FormField>
            <FormField label="SLA objetivo (minutos)">
              <input type="number" value={form.slaMinutes} onChange={(e) => setForm((p) => ({ ...p, slaMinutes: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" />
            </FormField>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <p>Alertas internas</p>
                <p className="text-xs text-zinc-400">Notificar si no hay respuesta en SLA</p>
              </div>
              <ToggleSwitch checked={form.humanAlerts} onChange={(v) => setForm((p) => ({ ...p, humanAlerts: v }))} />
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [active, form]);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <Card className="p-3">
          <div className="space-y-1">
            {(Object.keys(sectionLabels) as SectionKey[]).map((section) => (
              <button
                key={section}
                onClick={() => setActive(section)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${active === section ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-300 hover:bg-white/10"}`}
              >
                {sectionLabels[section]}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-lg font-semibold">{sectionLabels[active]}</h3>
          {sectionContent}
          <Button onClick={save} disabled={loading} className="mt-6 w-full bg-cyan-500/20 hover:bg-cyan-500/30">
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </Card>
      </div>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
