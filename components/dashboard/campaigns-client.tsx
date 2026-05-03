"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Plus, Send, Sparkles } from "lucide-react";
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

export function CampaignsClient() {
  const { activeWorkspaceId } = useWorkspace();
  const [items, setItems] = useState<Campaign[]>(seedCampaigns);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "todas">("todas");
  const [selectedId, setSelectedId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    segmentId: "",
    templateId: "",
    scheduledFor: "",
    status: "borrador" as CampaignStatus,
  });

  const workspaceCampaigns = useMemo(
    () =>
      items.filter(
        (c) => c.workspaceId === activeWorkspaceId && (statusFilter === "todas" || c.status === statusFilter),
      ),
    [items, activeWorkspaceId, statusFilter],
  );
  const workspaceSegments = useMemo(() => segments.filter((s) => s.workspaceId === activeWorkspaceId), [activeWorkspaceId]);
  const workspaceTemplates = useMemo(
    () => messageTemplates.filter((t) => t.workspaceId === activeWorkspaceId),
    [activeWorkspaceId],
  );

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

  const createCampaign = () => {
    const segment = workspaceSegments.find((s) => s.id === draft.segmentId) ?? workspaceSegments[0];
    const template = workspaceTemplates.find((t) => t.id === draft.templateId) ?? workspaceTemplates[0];
    if (!segment || !template) {
      setToast("Definí segmento y plantilla antes de crear la campaña.");
      return;
    }
    const created: Campaign = {
      id: `cm-${Date.now()}`,
      workspaceId: activeWorkspaceId,
      name: draft.name || "Campaña sin nombre",
      status: draft.status,
      segmentId: segment.id,
      templateId: template.id,
      scheduledFor: draft.scheduledFor || undefined,
      estimatedRecipients: segment.contactIds.length,
      sentRecipients: 0,
      preview: template.body,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setOpen(false);
    setToast("Campaña creada como borrador.");
    setDraft({ name: "", segmentId: "", templateId: "", scheduledFor: "", status: "borrador" });
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
    setToast(`Campaña actualizada: ${status}.`);
  };

  return (
    <>
      <Card className="border-amber-300/30 bg-amber-500/5 p-3 text-xs text-amber-100">
        Las campañas se preparan en WANEIA y quedan listas para envío real cuando WhatsApp Business API esté conectado. En esta vista los envíos son simulados.
      </Card>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Campañas activas</p><p className="mt-1 text-2xl font-bold">{workspaceCampaigns.length}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Mensajes enviados (mock)</p><p className="mt-1 text-2xl font-bold text-cyan-100">{totalSent}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Reply rate promedio</p><p className="mt-1 text-2xl font-bold text-emerald-100">{avgReply}%</p></Card>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
          {(["todas", "borrador", "programada", "enviada", "pausada"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-lg px-3 py-1.5 transition ${statusFilter === s ? "bg-cyan-500/20 text-cyan-100" : "text-zinc-300 hover:bg-white/10"}`}>{s}</button>
          ))}
        </div>
        <Button onClick={() => setOpen(true)} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Plus className="mr-1 h-4 w-4" />Nueva campaña</Button>
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
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusTone[c.status]}`}>{c.status}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-zinc-300">{c.preview}</p>
                  {c.status === "enviada" ? (
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-zinc-400">
                      <span>Enviados {c.sentRecipients}</span>
                      <span>Open {c.openRate}%</span>
                      <span>Reply {c.replyRate}%</span>
                      <span>Conv {c.conversionRate}%</span>
                    </div>
                  ) : c.status === "programada" ? (
                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-200"><CalendarClock className="h-3 w-3" />Programada para {c.scheduledFor?.slice(0, 16).replace("T", " ")}</p>
                  ) : (
                    <p className="mt-2 text-[11px] text-zinc-500">Lista para envío cuando esté lista la integración.</p>
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
              <span className={`rounded-full border px-2 py-0.5 text-xs ${statusTone[selected.status]}`}>{selected.status}</span>
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
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Open rate</p><p className="text-lg font-bold text-cyan-100">{selected.openRate}%</p></Card>
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Reply rate</p><p className="text-lg font-bold text-emerald-100">{selected.replyRate}%</p></Card>
                <Card className="p-3"><p className="text-[11px] text-zinc-400">Conversión</p><p className="text-lg font-bold text-violet-100">{selected.conversionRate}%</p></Card>
              </div>
            ) : (
              <Card className="mt-3 border-cyan-300/30 bg-cyan-500/10 p-3 text-xs text-cyan-100">
                <p className="inline-flex items-center gap-1 font-semibold"><Sparkles className="h-3.5 w-3.5" /> Estimaciones AI</p>
                <p className="mt-1">Open rate esperado: 65–72% · Reply rate: 18–24% · Conversión: 6–9%.</p>
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
              <Button onClick={() => setToast("Campaña duplicada como borrador.")}>Duplicar</Button>
            </div>
          </Card>
        ) : null}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva campaña">
        <div className="grid gap-3">
          <FormField label="Nombre"><input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
          <FormField label="Segmento">
            <select value={draft.segmentId} onChange={(e) => setDraft((p) => ({ ...p, segmentId: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
              <option value="" className="bg-[#0b1023]">Seleccioná un segmento</option>
              {workspaceSegments.map((s) => <option key={s.id} value={s.id} className="bg-[#0b1023]">{s.name} · {s.contactIds.length} contactos</option>)}
            </select>
          </FormField>
          <FormField label="Plantilla">
            <select value={draft.templateId} onChange={(e) => setDraft((p) => ({ ...p, templateId: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
              <option value="" className="bg-[#0b1023]">Seleccioná una plantilla</option>
              {workspaceTemplates.map((t) => <option key={t.id} value={t.id} className="bg-[#0b1023]">{t.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Fecha programada"><input type="datetime-local" value={draft.scheduledFor} onChange={(e) => setDraft((p) => ({ ...p, scheduledFor: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5" /></FormField>
            <FormField label="Estado inicial">
              <select value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value as CampaignStatus }))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5">
                <option value="borrador" className="bg-[#0b1023]">Borrador</option>
                <option value="programada" className="bg-[#0b1023]">Programada</option>
              </select>
            </FormField>
          </div>
        </div>
        <Button onClick={createCampaign} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40">Crear campaña</Button>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
