"use client";

import { useMemo, useState } from "react";
import { BookOpen, Brain, FileText, Globe, HelpCircle, Loader2, Plus, Search, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useDepartments, useKnowledge, useAISettings } from "@/lib/workspace-config";
import {
  KnowledgeArticle,
  KnowledgeSourceType,
  KnowledgeStatus,
  KnowledgeTrainingStatus,
} from "@/types/config";

const sourceLabel: Record<KnowledgeSourceType, string> = {
  manual: "Manual",
  pdf: "PDF",
  url: "URL",
  catalogo: "Catálogo",
  faq: "FAQ",
};

const sourceIcon: Record<KnowledgeSourceType, typeof FileText> = {
  manual: BookOpen,
  pdf: FileText,
  url: Globe,
  catalogo: Upload,
  faq: HelpCircle,
};

const trainingTone: Record<KnowledgeTrainingStatus, string> = {
  pendiente: "border-amber-300/40 bg-amber-500/10 text-amber-100",
  entrenando: "border-cyan-300/40 bg-cyan-500/10 text-cyan-100",
  activo: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100",
};

const statusTone: Record<KnowledgeStatus, string> = {
  borrador: "border-zinc-300/30 bg-zinc-500/10 text-zinc-200",
  activo: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100",
};

export function KnowledgeClient() {
  const { articles, setArticles } = useKnowledge();
  const { departments } = useDepartments();
  const { ai } = useAISettings();
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<KnowledgeStatus | "todos">("todos");
  const [openCreate, setOpenCreate] = useState(false);
  const [openSource, setOpenSource] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [training, setTraining] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => {
    return articles
      .filter((a) => filterDept === "todos" || a.departmentId === filterDept)
      .filter((a) => filterStatus === "todos" || a.status === filterStatus)
      .filter((a) => !search || `${a.title} ${a.tags.join(" ")} ${a.content}`.toLowerCase().includes(search.toLowerCase()));
  }, [articles, search, filterDept, filterStatus]);

  const selected = useMemo(() => articles.find((a) => a.id === selectedId) ?? filtered[0], [articles, selectedId, filtered]);
  const department = (id: string | null) => departments.find((d) => d.id === id);

  const trainArticle = (id: string) => {
    setTraining(id);
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, trainingStatus: "entrenando" } : a)));
    setTimeout(() => {
      setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, trainingStatus: "activo", status: "activo" } : a)));
      setTraining(null);
      setToast("Artículo entrenado y disponible para la IA.");
    }, 1100);
  };

  const removeArticle = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId("");
    setToast("Artículo eliminado.");
  };

  const toggleUsedByAi = (id: string) => {
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, usedByAi: !a.usedByAi } : a)));
  };

  const empty = articles.length === 0;
  const previewAnswer = selected
    ? `Según "${selected.title}": ${selected.content.slice(0, 200)}${selected.content.length > 200 ? "…" : ""}`
    : "";

  return (
    <>
      {!ai.enabled ? (
        <Card className="border-amber-300/30 bg-amber-500/5 p-3 text-xs text-amber-100">
          La IA está deshabilitada para este workspace. Activala desde <span className="underline">/dashboard/ia</span> para que use estos artículos.
        </Card>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Artículos</p><p className="mt-1 text-2xl font-bold">{articles.length}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">En uso por IA</p><p className="mt-1 text-2xl font-bold text-emerald-100">{articles.filter((a) => a.usedByAi).length}</p></Card>
        <Card className="p-4"><p className="text-xs uppercase tracking-wide text-zinc-400">Pendientes de entrenamiento</p><p className="mt-1 text-2xl font-bold text-amber-100">{articles.filter((a) => a.trainingStatus !== "activo").length}</p></Card>
      </div>

      <Card className="mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <Search className="h-4 w-4 text-zinc-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título, contenido o etiqueta" className="w-full bg-transparent outline-none" />
          </div>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <option value="todos" className="bg-[#0b1023]">Todos los departamentos</option>
            {departments.map((d) => <option key={d.id} value={d.id} className="bg-[#0b1023]">{d.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as KnowledgeStatus | "todos")} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <option value="todos" className="bg-[#0b1023]">Todos los estados</option>
            <option value="borrador" className="bg-[#0b1023]">Borrador</option>
            <option value="activo" className="bg-[#0b1023]">Activo</option>
          </select>
          <Button onClick={() => setOpenSource(true)}><Upload className="mr-1 h-4 w-4" />Subir fuente</Button>
          <Button onClick={() => setOpenCreate(true)} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Plus className="mr-1 h-4 w-4" />Nuevo artículo</Button>
        </div>
      </Card>

      {empty ? (
        <Card className="mt-4 p-10 text-center">
          <Brain className="mx-auto h-10 w-10 text-zinc-500" />
          <p className="mt-3 text-lg font-semibold">La IA todavía no tiene conocimiento cargado.</p>
          <p className="mt-1 text-sm text-zinc-400">Cargá un artículo manual, subí un PDF o conectá una FAQ para que la IA pueda responder con contexto real de tu negocio.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={() => setOpenCreate(true)} className="bg-emerald-500/30 hover:bg-emerald-500/40"><Plus className="mr-1 h-4 w-4" />Crear artículo</Button>
            <Button onClick={() => setOpenSource(true)}><Upload className="mr-1 h-4 w-4" />Subir fuente</Button>
          </div>
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-2">
            {filtered.length === 0 ? <Card className="p-6 text-center text-sm text-zinc-400">Sin resultados.</Card> : filtered.map((a) => {
              const Icon = sourceIcon[a.sourceType];
              return (
                <Card key={a.id} onClick={() => setSelectedId(a.id)} className={`cursor-pointer p-4 transition hover:bg-white/10 ${selected?.id === a.id ? "border-cyan-300/40 bg-cyan-500/10" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold inline-flex items-center gap-2"><Icon className="h-4 w-4 text-cyan-300" /> {a.title}</p>
                      <p className="text-[11px] text-zinc-400">{department(a.departmentId)?.name ?? "Sin departamento"} · {sourceLabel[a.sourceType]}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${statusTone[a.status]}`}>{a.status}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${trainingTone[a.trainingStatus]}`}>{a.trainingStatus}</span>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-zinc-300">{a.content}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {a.tags.map((t) => <span key={t} className="rounded-full border border-violet-300/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-100">#{t}</span>)}
                  </div>
                </Card>
              );
            })}
          </div>

          {selected ? (
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Artículo</p>
                  <input value={selected.title} onChange={(e) => setArticles((prev) => prev.map((a) => (a.id === selected.id ? { ...a, title: e.target.value, updatedAt: new Date().toISOString() } : a)))} className="w-full bg-transparent text-xl font-semibold focus:outline-none" />
                  <p className="text-[11px] text-zinc-500">Última actualización: {new Date(selected.updatedAt).toLocaleString("es-AR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${trainingTone[selected.trainingStatus]}`}>{selected.trainingStatus}</span>
                  <button onClick={() => removeArticle(selected.id)} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-rose-200 hover:bg-rose-500/10" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <FormField label="Departamento">
                  <select value={selected.departmentId ?? ""} onChange={(e) => setArticles((prev) => prev.map((a) => (a.id === selected.id ? { ...a, departmentId: e.target.value || null } : a)))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
                    <option value="" className="bg-[#0b1023]">Sin departamento</option>
                    {departments.map((d) => <option key={d.id} value={d.id} className="bg-[#0b1023]">{d.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Etiquetas (separadas por coma)">
                  <input value={selected.tags.join(", ")} onChange={(e) => setArticles((prev) => prev.map((a) => (a.id === selected.id ? { ...a, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) } : a)))} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
                </FormField>
              </div>

              <FormField label="Contenido" hint="La IA usa este texto como contexto cuando responde.">
                <textarea value={selected.content} onChange={(e) => setArticles((prev) => prev.map((a) => (a.id === selected.id ? { ...a, content: e.target.value, updatedAt: new Date().toISOString() } : a)))} className="mt-1 min-h-32 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
              </FormField>

              <Card className="mt-3 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Usado por IA</p>
                    <p className="text-zinc-400">Si está activo, este artículo entra al contexto del asistente.</p>
                  </div>
                  <ToggleSwitch checked={selected.usedByAi} onChange={() => toggleUsedByAi(selected.id)} />
                </div>
              </Card>

              <Card className="mt-3 border-cyan-300/30 bg-cyan-500/5 p-3 text-xs text-cyan-100">
                <p className="font-semibold inline-flex items-center gap-1"><Brain className="h-3.5 w-3.5" /> Vista previa de respuesta IA</p>
                <p className="mt-1 text-cyan-200/90">{previewAnswer}</p>
              </Card>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => trainArticle(selected.id)} disabled={training === selected.id} className="bg-emerald-500/30 hover:bg-emerald-500/40">
                  {training === selected.id ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Entrenando…</> : <><Brain className="mr-1 h-4 w-4" />Entrenar IA con este artículo</>}
                </Button>
                <Button onClick={() => setArticles((prev) => prev.map((a) => (a.id === selected.id ? { ...a, status: a.status === "activo" ? "borrador" : "activo" } : a)))}>
                  {selected.status === "activo" ? "Pasar a borrador" : "Marcar como activo"}
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      )}

      <CreateArticleModal open={openCreate} onClose={() => setOpenCreate(false)} departments={departments} onCreate={(article) => { setArticles((prev) => [article, ...prev]); setSelectedId(article.id); setOpenCreate(false); setToast("Artículo creado."); }} />

      <Modal open={openSource} onClose={() => setOpenSource(false)} title="Subir fuente de conocimiento">
        <p className="text-xs text-zinc-400">Cargá una fuente para entrenar a la IA. En esta versión la carga es simulada.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(["pdf", "url", "catalogo", "faq"] as KnowledgeSourceType[]).map((s) => (
            <button key={s} onClick={() => { const article: KnowledgeArticle = { id: `kb-${Date.now()}`, title: `Fuente ${sourceLabel[s]}`, departmentId: departments[0]?.id ?? null, tags: [s], content: `Fuente importada (${sourceLabel[s]}). Editá este texto con el contenido real.`, status: "borrador", sourceType: s, trainingStatus: "pendiente", usedByAi: false, updatedAt: new Date().toISOString() }; setArticles((prev) => [article, ...prev]); setSelectedId(article.id); setOpenSource(false); setToast("Fuente importada como borrador."); }} className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm hover:bg-white/10">
              <p className="font-medium">{sourceLabel[s]}</p>
              <p className="text-[11px] text-zinc-400">{s === "pdf" ? "Subir PDF de catálogo, manual o políticas." : s === "url" ? "Indexar contenido de una página web." : s === "catalogo" ? "Importar catálogo de productos." : "Preguntas frecuentes editables."}</p>
            </button>
          ))}
        </div>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}

function CreateArticleModal({ open, onClose, departments, onCreate }: { open: boolean; onClose: () => void; departments: ReturnType<typeof useDepartments>["departments"]; onCreate: (a: KnowledgeArticle) => void }) {
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState<string>(departments[0]?.id ?? "");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");

  return (
    <Modal open={open} onClose={onClose} title="Nuevo artículo de conocimiento">
      <div className="grid gap-3">
        <FormField label="Título" hint="Resumen claro del tema.">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Departamento">
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm">
              <option value="" className="bg-[#0b1023]">Sin departamento</option>
              {departments.map((d) => <option key={d.id} value={d.id} className="bg-[#0b1023]">{d.name}</option>)}
            </select>
          </FormField>
          <FormField label="Etiquetas (coma)">
            <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" placeholder="envíos, logística" />
          </FormField>
        </div>
        <FormField label="Contenido">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-32 w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm" placeholder="Texto que la IA usará como contexto..." />
        </FormField>
      </div>
      <Button onClick={() => onCreate({
        id: `kb-${Date.now()}`,
        title: title || "Artículo sin título",
        departmentId: departmentId || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        content,
        status: "borrador",
        sourceType: "manual",
        trainingStatus: "pendiente",
        usedByAi: false,
        updatedAt: new Date().toISOString(),
      })} className="mt-4 w-full bg-emerald-500/30 hover:bg-emerald-500/40">Crear artículo</Button>
    </Modal>
  );
}
