"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/components/dashboard/workspace-context";
import {
  AISettings,
  BotFlow,
  Category,
  ConfigurableTemplate,
  Department,
  KnowledgeArticle,
  Pipeline,
  TagItem,
  WaneiaConfig,
} from "@/types/config";

const STORAGE_PREFIX = "waneia.config.";

function makeDefaults(workspaceId: string): WaneiaConfig {
  const baseCategories: Category[] = [
    { id: "cat-presupuesto", name: "Presupuesto", color: "emerald", icon: "DollarSign", isDefault: true, order: 0, usage: { conversations: 14, leads: 8, automations: 2, campaigns: 1 } },
    { id: "cat-pedido", name: "Pedido", color: "cyan", icon: "Package", isDefault: false, order: 1, usage: { conversations: 9, leads: 3, automations: 1, campaigns: 0 } },
    { id: "cat-consulta", name: "Consulta general", color: "violet", icon: "MessageCircle", isDefault: false, order: 2, usage: { conversations: 22, leads: 5, automations: 1, campaigns: 0 } },
    { id: "cat-soporte", name: "Soporte", color: "amber", icon: "LifeBuoy", isDefault: false, order: 3, usage: { conversations: 6, leads: 0, automations: 1, campaigns: 0 } },
    { id: "cat-reclamo", name: "Reclamo", color: "rose", icon: "AlertTriangle", isDefault: false, order: 4, usage: { conversations: 3, leads: 0, automations: 0, campaigns: 0 } },
    { id: "cat-postventa", name: "Postventa", color: "sky", icon: "Heart", isDefault: false, order: 5, usage: { conversations: 4, leads: 1, automations: 0, campaigns: 1 } },
  ];

  const tags: TagItem[] = [
    { id: "tg-alta", name: "alta-intencion", color: "emerald", appliesTo: ["leads", "conversaciones"] },
    { id: "tg-mayorista", name: "mayorista", color: "cyan", appliesTo: ["leads", "contactos"] },
    { id: "tg-recurrente", name: "recurrente", color: "violet", appliesTo: ["contactos"] },
    { id: "tg-churn", name: "churn-riesgo", color: "rose", appliesTo: ["contactos"] },
    { id: "tg-urgente", name: "urgente", color: "amber", appliesTo: ["conversaciones"] },
  ];

  const defaultPipeline: Pipeline = {
    id: "pl-default",
    name: "Pipeline comercial",
    isDefault: true,
    stages: [
      { id: "st-nuevo", name: "Nuevo", color: "cyan", probability: 10, slaTargetMinutes: 30, automationTrigger: "Asignar al equipo Comercial", statusType: "abierto", order: 0 },
      { id: "st-contactado", name: "Contactado", color: "sky", probability: 30, slaTargetMinutes: 240, automationTrigger: "Enviar plantilla 'Cotización rápida'", statusType: "abierto", order: 1 },
      { id: "st-cotizando", name: "Cotizando", color: "violet", probability: 55, slaTargetMinutes: 720, automationTrigger: "Recordatorio si no responde 24h", statusType: "abierto", order: 2 },
      { id: "st-negociacion", name: "En negociación", color: "amber", probability: 75, slaTargetMinutes: 1440, automationTrigger: "Notificar al admin", statusType: "abierto", order: 3 },
      { id: "st-ganado", name: "Ganado", color: "emerald", probability: 100, slaTargetMinutes: 0, automationTrigger: "Mover a postventa", statusType: "ganado", order: 4 },
      { id: "st-perdido", name: "Perdido", color: "rose", probability: 0, slaTargetMinutes: 0, automationTrigger: "Agregar a campaña de reactivación", statusType: "perdido", order: 5 },
    ],
  };

  const supportPipeline: Pipeline = {
    id: "pl-soporte",
    name: "Pipeline de soporte",
    isDefault: false,
    stages: [
      { id: "ss-nuevo", name: "Nuevo", color: "cyan", probability: 0, slaTargetMinutes: 15, automationTrigger: "Acuse automático", statusType: "abierto", order: 0 },
      { id: "ss-curso", name: "En curso", color: "amber", probability: 0, slaTargetMinutes: 120, automationTrigger: "—", statusType: "abierto", order: 1 },
      { id: "ss-resuelto", name: "Resuelto", color: "emerald", probability: 0, slaTargetMinutes: 0, automationTrigger: "Encuesta CSAT", statusType: "ganado", order: 2 },
      { id: "ss-escalado", name: "Escalado", color: "rose", probability: 0, slaTargetMinutes: 0, automationTrigger: "Notificar a líder", statusType: "abierto", order: 3 },
    ],
  };

  const departments: Department[] = [
    { id: "dep-ventas", name: "Ventas", description: "Equipo comercial y cotizaciones.", memberIds: ["tm-2", "tm-3"], categoryIds: ["cat-presupuesto", "cat-pedido"], slaMinutes: 15, defaultBotId: "bf-bienvenida", routingRule: "category in [presupuesto, pedido]" },
    { id: "dep-soporte", name: "Soporte", description: "Atención técnica y postventa.", memberIds: ["tm-1"], categoryIds: ["cat-soporte", "cat-reclamo"], slaMinutes: 30, defaultBotId: null, routingRule: "category in [soporte, reclamo]" },
    { id: "dep-administracion", name: "Administración", description: "Facturación y administrativos.", memberIds: ["tm-1"], categoryIds: ["cat-postventa"], slaMinutes: 120, defaultBotId: null, routingRule: "tag = administracion" },
  ];

  const ai: AISettings = {
    enabled: true,
    provider: "openai",
    model: "gpt-4o-mini",
    apiKey: "",
    temperature: 0.4,
    tone: "comercial",
    fallback: "derivar humano",
    fallbackTemplateId: null,
    connectionStatus: "no probada",
    lastTestedAt: null,
    monthlyMessageCap: 5000,
  };

  const knowledge: KnowledgeArticle[] = [
    { id: "kb-1", title: "Política de envíos y plazos", departmentId: "dep-ventas", tags: ["envíos", "logística"], content: "Realizamos envíos a todo el país por correo y mensajería. CABA y GBA 24-48hs, interior 3-5 días hábiles.", status: "activo", sourceType: "manual", trainingStatus: "activo", usedByAi: true, updatedAt: "2026-04-28T10:00:00Z" },
    { id: "kb-2", title: "Catálogo de productos premium", departmentId: "dep-ventas", tags: ["catálogo"], content: "Línea premium: placard 2.5m, vestidor 3.5m, mueble TV. Materiales y precios actualizados.", status: "activo", sourceType: "catalogo", sourceRef: "catalogo_2026Q2.pdf", trainingStatus: "activo", usedByAi: true, updatedAt: "2026-04-22T14:30:00Z" },
    { id: "kb-3", title: "Garantía y postventa", departmentId: "dep-soporte", tags: ["postventa", "garantía"], content: "Todos los productos cuentan con garantía oficial de fábrica de 12 meses contra defectos.", status: "activo", sourceType: "manual", trainingStatus: "activo", usedByAi: true, updatedAt: "2026-03-15T09:00:00Z" },
    { id: "kb-4", title: "Preguntas frecuentes financiación", departmentId: "dep-administracion", tags: ["financiación", "faq"], content: "Aceptamos hasta 12 cuotas con tarjeta. Transferencia 5% off. Efectivo solo en sucursal.", status: "borrador", sourceType: "faq", trainingStatus: "pendiente", usedByAi: false, updatedAt: "2026-05-01T10:00:00Z" },
  ];

  const botFlows: BotFlow[] = [
    {
      id: "bf-bienvenida",
      name: "Bienvenida y calificación",
      description: "Saluda al cliente, identifica intención y deriva al equipo correcto.",
      status: "activa",
      trigger: "Cualquier mensaje nuevo de un contacto desconocido",
      nodes: [
        { id: "n1", type: "trigger", label: "Mensaje nuevo", body: "Disparado por nuevo contacto sin historial." },
        { id: "n2", type: "message", label: "Saludar", body: "¡Hola! 👋 Soy el asistente de Mueblería Norte. ¿En qué te puedo ayudar?" },
        { id: "n3", type: "buttons", label: "Pregunta inicial", body: "Elegí una opción:", options: ["Cotizar producto", "Estado de pedido", "Hablar con humano"] },
        { id: "n4", type: "condition", label: "Decidir derivación", body: "Según opción elegida", branches: [{ value: "Cotizar producto", nextId: "n5" }, { value: "Estado de pedido", nextId: "n6" }, { value: "Hablar con humano", nextId: "n7" }] },
        { id: "n5", type: "assign", label: "Derivar a Ventas", body: "Asignar a cola Ventas y agregar etiqueta 'cotizar'." },
        { id: "n6", type: "message", label: "Estado de pedido", body: "Compartime tu número de pedido y consulto el estado." },
        { id: "n7", type: "assign", label: "Derivar humano", body: "Asignar al primer operador disponible." },
        { id: "n8", type: "end", label: "Fin", body: "Cierra el flujo." },
      ],
      updatedAt: "2026-04-30T09:00:00Z",
    },
    {
      id: "bf-postventa",
      name: "Encuesta de postventa",
      description: "Recoge feedback automáticamente 7 días después del cierre.",
      status: "borrador",
      trigger: "Lead movido a Ganado · 7 días después",
      nodes: [
        { id: "n1", type: "trigger", label: "Tiempo después de venta", body: "+7 días desde stage = ganado." },
        { id: "n2", type: "message", label: "Saludo", body: "Hola {{nombre}}, gracias por elegirnos. ¿Cómo fue tu experiencia?" },
        { id: "n3", type: "question", label: "Calificación", body: "¿Del 1 al 5 cómo nos calificás?", options: ["1", "2", "3", "4", "5"] },
        { id: "n4", type: "tag", label: "Etiquetar promotor", body: "Si calificación >= 4, agregar etiqueta 'promotor'." },
        { id: "n5", type: "end", label: "Fin", body: "Cierra el flujo." },
      ],
      updatedAt: "2026-04-29T18:00:00Z",
    },
  ];

  const templates: ConfigurableTemplate[] = [
    { id: "tpl-cot", name: "Cotización rápida", category: "cat-presupuesto", channel: "whatsapp", approved: true, body: "¡Hola {{nombre}}! Te paso un presupuesto base por {{producto}}: {{precio}}. ¿Coordinamos visita?", variables: ["nombre", "producto", "precio"], shortcut: "/cot" },
    { id: "tpl-fol", name: "Recordatorio follow-up", category: "general", channel: "general", approved: true, body: "Hola {{nombre}}, retomamos la conversación sobre {{producto}}. ¿Seguís interesado/a?", variables: ["nombre", "producto"], shortcut: "/fup" },
    { id: "tpl-pos", name: "Confirmación postventa", category: "cat-postventa", channel: "whatsapp", approved: true, body: "Hola {{nombre}}, tu pedido fue entregado. ¡Gracias por elegirnos!", variables: ["nombre"], shortcut: "/post" },
    { id: "tpl-rec", name: "Reactivación inactivos", category: "cat-postventa", channel: "whatsapp", approved: false, body: "Hola {{nombre}}, hace tiempo que no nos vemos. Tenemos novedades para vos.", variables: ["nombre"], shortcut: "/reac" },
  ];

  return {
    categories: baseCategories,
    tags,
    pipelines: [defaultPipeline, supportPipeline],
    defaultPipelineId: defaultPipeline.id,
    departments,
    ai: workspaceId === "ws-1" ? ai : { ...ai, enabled: false, model: "gpt-4o-mini" },
    knowledge,
    botFlows,
    templates,
  };
}

type WorkspaceConfigContextValue = {
  config: WaneiaConfig;
  setConfig: (next: WaneiaConfig | ((prev: WaneiaConfig) => WaneiaConfig)) => void;
  resetConfig: () => void;
  hydrated: boolean;
};

const WorkspaceConfigContext = createContext<WorkspaceConfigContextValue | null>(null);

export function WorkspaceConfigProvider({ children }: { children: React.ReactNode }) {
  const { activeWorkspaceId } = useWorkspace();
  const [configByWs, setConfigByWs] = useState<Record<string, WaneiaConfig>>({});
  const [hydrated, setHydrated] = useState(false);

  // hydrate when workspace changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (configByWs[activeWorkspaceId]) {
      setHydrated(true);
      return;
    }
    let initial: WaneiaConfig | null = null;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${activeWorkspaceId}`);
      if (raw) initial = JSON.parse(raw) as WaneiaConfig;
    } catch {
      initial = null;
    }
    if (!initial) initial = makeDefaults(activeWorkspaceId);
    setConfigByWs((prev) => ({ ...prev, [activeWorkspaceId]: initial! }));
    setHydrated(true);
  }, [activeWorkspaceId, configByWs]);

  const config = configByWs[activeWorkspaceId] ?? makeDefaults(activeWorkspaceId);

  const setConfig = useCallback(
    (next: WaneiaConfig | ((prev: WaneiaConfig) => WaneiaConfig)) => {
      setConfigByWs((prev) => {
        const current = prev[activeWorkspaceId] ?? makeDefaults(activeWorkspaceId);
        const updated = typeof next === "function" ? (next as (prev: WaneiaConfig) => WaneiaConfig)(current) : next;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`${STORAGE_PREFIX}${activeWorkspaceId}`, JSON.stringify(updated));
          } catch {
            // ignore quota errors
          }
        }
        return { ...prev, [activeWorkspaceId]: updated };
      });
    },
    [activeWorkspaceId],
  );

  const resetConfig = useCallback(() => {
    const fresh = makeDefaults(activeWorkspaceId);
    setConfigByWs((prev) => ({ ...prev, [activeWorkspaceId]: fresh }));
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(`${STORAGE_PREFIX}${activeWorkspaceId}`);
      } catch {
        // ignore
      }
    }
  }, [activeWorkspaceId]);

  const value = useMemo(() => ({ config, setConfig, resetConfig, hydrated }), [config, setConfig, resetConfig, hydrated]);

  return <WorkspaceConfigContext.Provider value={value}>{children}</WorkspaceConfigContext.Provider>;
}

export function useWorkspaceConfig() {
  const ctx = useContext(WorkspaceConfigContext);
  if (!ctx) throw new Error("useWorkspaceConfig must be used within WorkspaceConfigProvider");
  return ctx;
}

export function useCategories() {
  const { config, setConfig } = useWorkspaceConfig();
  const update = useCallback((updater: (prev: Category[]) => Category[]) => setConfig((p) => ({ ...p, categories: updater(p.categories) })), [setConfig]);
  return { categories: config.categories, setCategories: update };
}

export function usePipelines() {
  const { config, setConfig } = useWorkspaceConfig();
  return {
    pipelines: config.pipelines,
    defaultPipelineId: config.defaultPipelineId,
    setPipelines: (updater: (prev: Pipeline[]) => Pipeline[]) => setConfig((p) => ({ ...p, pipelines: updater(p.pipelines) })),
    setDefaultPipelineId: (id: string) => setConfig((p) => ({ ...p, defaultPipelineId: id })),
  };
}

export function useDepartments() {
  const { config, setConfig } = useWorkspaceConfig();
  return {
    departments: config.departments,
    setDepartments: (updater: (prev: Department[]) => Department[]) => setConfig((p) => ({ ...p, departments: updater(p.departments) })),
  };
}

export function useAISettings() {
  const { config, setConfig } = useWorkspaceConfig();
  return {
    ai: config.ai,
    setAI: (updater: AISettings | ((prev: AISettings) => AISettings)) => setConfig((p) => ({ ...p, ai: typeof updater === "function" ? (updater as (prev: AISettings) => AISettings)(p.ai) : updater })),
  };
}

export function useKnowledge() {
  const { config, setConfig } = useWorkspaceConfig();
  return {
    articles: config.knowledge,
    setArticles: (updater: (prev: KnowledgeArticle[]) => KnowledgeArticle[]) => setConfig((p) => ({ ...p, knowledge: updater(p.knowledge) })),
  };
}

export function useBotFlows() {
  const { config, setConfig } = useWorkspaceConfig();
  return {
    flows: config.botFlows,
    setFlows: (updater: (prev: BotFlow[]) => BotFlow[]) => setConfig((p) => ({ ...p, botFlows: updater(p.botFlows) })),
  };
}

export function useTags() {
  const { config, setConfig } = useWorkspaceConfig();
  return {
    tags: config.tags,
    setTags: (updater: (prev: TagItem[]) => TagItem[]) => setConfig((p) => ({ ...p, tags: updater(p.tags) })),
  };
}

export function useConfigurableTemplates() {
  const { config, setConfig } = useWorkspaceConfig();
  return {
    templates: config.templates,
    setTemplates: (updater: (prev: ConfigurableTemplate[]) => ConfigurableTemplate[]) => setConfig((p) => ({ ...p, templates: updater(p.templates) })),
  };
}
