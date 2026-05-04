"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Check, ChevronLeft, ChevronRight, Plus, Send, ShieldCheck, Sparkles } from "lucide-react";
import { campaigns as seedCampaigns, segments, messageTemplates } from "@/data/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Toast } from "@/components/ui/toast";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import { Campaign, CampaignStatus } from "@/types/entities";

const statusTone: Record<CampaignStatus, string> = {
  borrador: "border-zinc-300/40 bg-zinc-500/10 text-zinc-200",
  programada: "border-cyan-300/40 bg-cyan-500/10 text-cyan-100",
  enviada: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100",
  pausada: "border-amber-300/40 bg-amber-500/10 text-amber-100",
};

const statusLabel: Record<CampaignStatus | "todas", string> = {
  todas: "Todas",
  borrador: "Borrador",
  programada: "Programada",
  enviada: "Enviada",
  pausada: "Pausada",
};

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export function CampaignsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const [items, setItems] = useState<Campaign[]>(seedCampaigns);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "todas">("todas");
  const [selectedId, setSelectedId] = useState<string>("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);
  const [toast, setToast] = useState("");

  const [draftName, setDraftName] = useState("");
  const [draftSegmentId, setDraftSegmentId] = useState("");
  const [draftTemplateId, setDraftTemplateId] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [draftScheduledFor, setDraftScheduledFor] = useState("");
  const [simulated, setSimulated] = useState<{ open: number; reply: number; conv: number; recipients: number } | null>(null);

  const workspaceCampaigns = useMemo(
    () => items.filter((c) => c.workspaceId === activeWorkspaceId && (statusFilter === "todas" || c.status === statusFilter)),
    [items, activeWorkspaceId, statusFilter],
  );
  const workspaceSegments = useMemo(() => segments.filter((s) => s.workspaceId === activeWorkspaceId), [activeWorkspaceId]);
  const workspaceTemplates = useMemo(() => messageTemplates.filter((t) => t.workspaceId === activeWorkspaceId), [activeWorkspaceId]);

  const selected = useMemo(
    () => items.find((c) => c.id === selectedId) ?? workspaceCampaigns[0],
    [items, selectedId, workspaceCampaigns],
  );

  const segmentFor = (id: string) => segments.find((s) => s.id === id);
  const templateFor = (id: string) => messageTemplates.find((t) => t.id === id);

  const totalSent = workspaceCampaigns.reduce((acc, c) => acc + c.sentRecipients, 0);
  const avgReply = (() => {
    const sent = workspaceCampaigns.filter((c) => c.status === "enviada" && typeof c.replyRate === "number");
    if (sent.length === 0) return 0;
    return Math.round(sent.reduce((acc, c) => acc + (c.replyRate ?? 0), 0) / sent.length);
  })();

  const resetWizard = () => {
    setStep(1);
    setDraftName("");
    setDraftSegmentId("");
    setDraftTemplateId("");
    setDraftMessage("");
    setDraftScheduledFor("");
    setSimulated(null);
  };

  const openWizard = () => {
    resetWizard();
    setWizardOpen(true);
  };

  const segmentChosen = workspaceSegments.find((s) => s.id === draftSegmentId);
  const templateChosen = workspaceTemplates.find((t) => t.id === draftTemplateId);

  const goNext = () => {
    if (step === 1 && !draftSegmentId) { setToast("Elegí un segmento."); return; }
    if (step === 2 && !draftTemplateId) { setToast("Elegí una plantilla."); return; }
    if (step === 2 && templateChosen && !draftMessage) setDraftMessage(templateChosen.body);
    if (step === 3 && !draftMessage.trim()) { setToast("El mensaje no puede estar vacío."); return; }
    if (step === 6) return;
    setStep((s) => (Math.min(s + 1, 6) as WizardStep));
  };
  const goBack = () => setStep((s) => (Math.max(s - 1, 1) as WizardStep));

  const runSimulation = () => {
    if (!segmentChosen) return;
    const recipients = segmentChosen.contactIds.length;
    const open = 60 + Math.round(Math.random() * 15);
    const reply = 18 + Math.round(Math.random() * 10);
    const conv = 5 + Math.round(Math.random() * 6);
    setSimulated({ open, reply, conv, recipients });
  };

  const finishWizard = (mode: "borrador" | "programada") => {
    if (!segmentChosen || !templateChosen) {
      setToast("Completá los pasos previos.");
      return;
    }
    const created: Campaign = {
      id: `cm-${Date.now()}`,
      workspaceId: activeWorkspaceId,
      name: draftName || `Campaña ${new Date().toLocaleDateString("es-AR")}`,
      status: mode,
      segmentId: segmentChosen.id,
      templateId: templateChosen.id,
      scheduledFor: mode === "programada" && draftScheduledFor ? draftScheduledFor : undefined,
      estimatedRecipients: segmentChosen.contactIds.length,
      sentRecipients: 0,
      preview: draftMessage,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setWizardOpen(false);
    setToast(mode === "programada" ? "Campaña programada." : "Campaña guardada como borrador.");
  };

  const changeStatus = (id: string, status: CampaignStatus) => {
    setItems((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (status === "enviada") {
          return { ...c, status, sentRecipients: c.estimatedRecipients, openRate: 65, replyRate: 24, conversionRate: 8 };
        }
        return { ...c, status };
      }),
    );
    setToast(`Campaña actualizada: ${statusLabel[status]}.`);
  };

  const duplicate = (id: string) => {
    const c = items.find((x) => x.id === id);
    if (!c) return;
    const cloned: Campaign = { ...c, id: `cm-${Date.now()}`, name: `${c.name} (copia)`, status: "borrador", sentRecipients: 0, openRate: undefined, replyRate: undefined, conversionRate: undefined, createdAt: new Date().toISOString() };
    setItems((prev) => [cloned, ...prev]);
    setSelectedId(cloned.id);
    setToast("Campaña duplicada como borrador.");
  };

  return (
    <>
      <Card className="border-amber-300/30 bg-amber-500/5 p-3 text-xs text-amber-100">
        <p className="inline-flex items-center gap-1 font-semibold"><ShieldCheck className="h-3.5 w-3.5" /> Cumplimiento WhatsApp</p>
        <p className="mt-1 text-amber-200/90">Las campañas en WhatsApp solo se envían a contactos con opt-in y deben usar plantillas aprobadas. En esta vista los envíos son simulados.</p>
      </Card>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Campañas en este workspace</p><p className="mt-1 text-2xl font-bold">{workspaceCampaigns.length}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Mensajes enviados (simulado)</p><p className="mt-1 text-2xl font-bold text-cyan-100">{totalSent}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Tasa de respuesta promedio</p><p className="mt-1 text-2xl font-bold text-emerald-100">{avgReply}%</p></Card>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
          {(["todas", "borrador", "programada", "enviada", "pausada"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-lg px-3 py-1.5 transition ${statusFilter === s ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-300 hover:bg-white/10"}`}>{statusLabel[s]}</button>
          ))}
        </div>
        <Button onClick={openWizard} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Plus className="mr-1 h-4 w-4" />Nueva campaña</Button>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">
          {workspaceCampaigns.length === 0 ? (
            <Card className="p-6 text-center text-sm text-zinc-400">Todavía no hay campañas en este workspace.</Card>
          ) : (
            workspaceCampaigns.map((c) => {
              const seg = segmentFor(c.segmentId);
              return (
                <Card key={c.id} onClick={() => setSelectedId(c.id)} className={`cursor-pointer p-4 transition hover:bg-white/10 ${selected?.id === c.id ? "border-cyan-300/40 bg-cyan-500/10" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-zinc-400">Segmento: {seg?.name ?? "—"} · {c.estimatedRecipients} destinatarios</p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusTone[c.status]}`}>{statusLabel[c.status]}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-zinc-300">{c.preview}</p>
                  {c.status === "enviada" ? (
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-zinc-400">
                      <span>Enviados {c.sentRecipients}</span>
                      <span>Apertura {c.openRate}%</span>
                      <span>Respuesta {c.replyRate}%</span>
                      <span>Conversión {c.conversionRate}%</span>
                    </div>
                  ) : c.status === "programada" ? (
                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-200"><CalendarClock className="h-3 w-3" />Programada para {c.scheduledFor?.slice(0, 16).replace("T", " ")}</p>
                  ) : (
                    <p className="mt-2 text-[11px] text-zinc-500">Lista para envío cuando se conecte WhatsApp Business API.</p>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {selected ? (
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">Campaña</p>
                <h3 className="text-xl font-semibold">{selected.name}</h3>
                <p className="text-sm text-zinc-400">Creada {selected.createdAt.slice(0, 10)}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-xs ${statusTone[selected.status]}`}>{statusLabel[selected.status]}</span>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Card className="p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Segmento</p>
                <p className="mt-1 text-sm font-medium">{segmentFor(selected.segmentId)?.name}</p>
                <p className="text-[11px] text-zinc-400">{segmentFor(selected.segmentId)?.ruleSummary}</p>
                <p className="mt-1 text-[11px] text-emerald-200">{selected.estimatedRecipients} destinatarios estimados</p>
              </Card>
              <Card className="p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Plantilla</p>
                <p className="mt-1 text-sm font-medium">{templateFor(selected.templateId)?.name}</p>
                <p className="text-[11px] text-zinc-400">Variables: {templateFor(selected.templateId)?.variables.join(", ") || "ninguna"}</p>
              </Card>
            </div>

            <Card className="mt-3 p-3">
              <p className="text-xs uppercase tracking-wide text-zinc-400">Vista previa</p>
              <div className="mt-2 max-w-sm rounded-2xl bg-emerald-500/15 p-3 text-sm text-emerald-50">
                {selected.preview}
              </div>
            </Card>

            {selected.status === "enviada" ? (
              <div className="mt-3 grid grid-cols-2 gap-2 text-center md:grid-cols-4">
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Enviados</p><p className="text-lg font-bold">{selected.sentRecipients}</p></Card>
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Apertura</p><p className="text-lg font-bold text-cyan-100">{selected.openRate}%</p></Card>
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Respuesta</p><p className="text-lg font-bold text-emerald-100">{selected.replyRate}%</p></Card>
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Conversión</p><p className="text-lg font-bold text-violet-100">{selected.conversionRate}%</p></Card>
              </div>
            ) : (
              <Card className="mt-3 border-cyan-300/30 bg-cyan-500/10 p-3 text-xs text-cyan-100">
                <p className="inline-flex items-center gap-1 font-semibold"><Sparkles className="h-3.5 w-3.5" /> Estimación AI</p>
                <p className="mt-1">Apertura esperada 65–72% · Respuesta 18–24% · Conversión 6–9%.</p>
              </Card>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {selected.status !== "enviada" ? (
                <Button onClick={() => changeStatus(selected.id, "enviada")} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Send className="mr-1 h-4 w-4" />Simular envío</Button>
              ) : null}
              {selected.status === "borrador" ? (
                <Button onClick={() => changeStatus(selected.id, "programada")}>Programar</Button>
              ) : null}
              {selected.status === "programada" ? (
                <Button onClick={() => changeStatus(selected.id, "pausada")}>Pausar</Button>
              ) : null}
              {selected.status === "pausada" ? (
                <Button onClick={() => changeStatus(selected.id, "programada")}>Reanudar</Button>
              ) : null}
              <Button onClick={() => duplicate(selected.id)}>Duplicar</Button>
            </div>
          </Card>
        ) : null}
      </div>

      <Modal open={wizardOpen} onClose={() => setWizardOpen(false)} title="Asistente · Nueva campaña" className="max-w-2xl">
        <div className="mb-3 flex flex-wrap gap-1.5 text-[11px]">
          {[
            { id: 1, label: "Segmento" },
            { id: 2, label: "Plantilla" },
            { id: 3, label: "Mensaje" },
            { id: 4, label: "Vista previa" },
            { id: 5, label: "Programación" },
            { id: 6, label: "Simulación" },
          ].map((s) => (
            <span key={s.id} className={`flex items-center gap-1 rounded-full border px-2 py-0.5 ${step === s.id ? "border-cyan-300/40 bg-cyan-500/10 text-cyan-100" : step > s.id ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-100" : "border-white/10 bg-white/5 text-zinc-400"}`}>
              {step > s.id ? <Check className="h-3 w-3" /> : <span className="font-bold">{s.id}.</span>} {s.label}
            </span>
          ))}
        </div>

        {step === 1 ? (
          <div className="space-y-2">
            <FormField label="Nombre de la campaña"><input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Ej.: Promo otoño placards" className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" /></FormField>
            <p className="text-xs text-zinc-400">Elegí el segmento de contactos al que querés llegar. La cantidad estimada surge del segmento.</p>
            <div className="grid gap-2 max-h-72 overflow-y-auto">
              {workspaceSegments.length === 0 ? <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">No hay segmentos cargados. Creá uno desde Contactos.</p> : workspaceSegments.map((s) => (
                <button key={s.id} onClick={() => setDraftSegmentId(s.id)} className={`rounded-xl border p-3 text-left text-sm transition ${draftSegmentId === s.id ? "border-cyan-300/40 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{s.name}</p>
                    <span className="text-[11px] text-zinc-400">{s.contactIds.length} contactos</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">{s.description} · {s.ruleSummary}</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-2">
            <p className="text-xs text-zinc-400">Las campañas WhatsApp deben usar plantillas aprobadas (HSM). Elegí una plantilla compatible con la categoría.</p>
            <div className="grid gap-2 max-h-72 overflow-y-auto">
              {workspaceTemplates.map((t) => (
                <button key={t.id} onClick={() => { setDraftTemplateId(t.id); setDraftMessage(t.body); }} className={`rounded-xl border p-3 text-left text-sm transition ${draftTemplateId === t.id ? "border-cyan-300/40 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{t.name}</p>
                    <span className="text-[11px] text-zinc-400">{t.category}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">{t.body}</p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-2">
            <p className="text-xs text-zinc-400">Revisá el mensaje. Las variables como {"{{nombre}}"} se reemplazan por contacto al enviar.</p>
            <textarea value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} className="min-h-32 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
            {templateChosen && templateChosen.variables.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-zinc-400">Variables disponibles:</span>
                {templateChosen.variables.map((v) => <span key={v} className="rounded-full border border-violet-300/30 bg-violet-500/10 px-2 py-0.5 text-violet-100">{`{{${v}}}`}</span>)}
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">Así se verá la campaña en WhatsApp.</p>
            <div className="rounded-2xl border border-white/10 bg-[#0a1628] p-4">
              <p className="text-[11px] text-zinc-400">{segmentChosen?.name} · {segmentChosen?.contactIds.length} destinatarios</p>
              <div className="mt-2 max-w-sm rounded-2xl bg-emerald-500/20 p-3 text-sm text-emerald-50">
                {draftMessage}
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">Para responder o darse de baja, los contactos pueden escribir BAJA en cualquier momento.</p>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-2">
            <p className="text-xs text-zinc-400">Programá el envío o guardá como borrador.</p>
            <FormField label="Fecha y hora de envío"><input type="datetime-local" value={draftScheduledFor} onChange={(e) => setDraftScheduledFor(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" /></FormField>
            <p className="text-[11px] text-zinc-500">Recomendación: enviar en horarios laborales locales aumenta 18% la tasa de respuesta.</p>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">Simulá los resultados antes de finalizar. Los envíos reales requieren WhatsApp Business API conectada.</p>
            <Button onClick={runSimulation} className="bg-cyan-500/30 hover:bg-cyan-500/40"><Sparkles className="mr-1 h-4 w-4" />Simular performance</Button>
            {simulated ? (
              <div className="grid grid-cols-2 gap-2 text-center md:grid-cols-4">
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Destinatarios</p><p className="text-lg font-bold">{simulated.recipients}</p></Card>
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Apertura</p><p className="text-lg font-bold text-cyan-100">{simulated.open}%</p></Card>
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Respuesta</p><p className="text-lg font-bold text-emerald-100">{simulated.reply}%</p></Card>
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Conversión</p><p className="text-lg font-bold text-violet-100">{simulated.conv}%</p></Card>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button onClick={goBack} disabled={step === 1}><ChevronLeft className="mr-1 h-4 w-4" />Atrás</Button>
          {step < 6 ? (
            <Button onClick={goNext}>Siguiente<ChevronRight className="ml-1 h-4 w-4" /></Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => finishWizard("borrador")}>Guardar borrador</Button>
              <Button onClick={() => finishWizard("programada")} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Send className="mr-1 h-4 w-4" />Programar campaña</Button>
            </div>
          )}
        </div>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
