import { AutomationRule, BusinessSettings, Conversation, Lead } from "@/types/entities";

export const conversations: Conversation[] = [
  {
    id: "c1",
    workspaceId: "ws-1",
    userId: "u-operator-1",
    customerName: "Carla Méndez",
    phone: "+54 11 4987 1221",
    businessName: "Mueblería Norte",
    lastMessage: "¿Cuánto demoran en instalar un placard a medida?",
    category: "presupuesto",
    status: "en seguimiento",
    assignedToHuman: false,
    createdAt: "2026-04-07T12:00:00Z",
    updatedAt: "2026-04-11T10:42:00Z",
    estimatedOpportunity: "AR$ 420.000",
    internalNotes: "Cliente con alto interés. Coordinar visita técnica.",
    messages: [
      { id: "m1", sender: "customer", content: "Hola, quería consultar precio para placard de 2.5m.", timestamp: "10:11" },
      { id: "m2", sender: "system", content: "¡Hola Carla! Gracias por escribir. ¿Querés que te enviemos un presupuesto base?", timestamp: "10:12" },
    ],
  },
  { id: "c2", workspaceId: "ws-1", userId: "u-operator-2", customerName: "Luis Arce", phone: "+54 9 351 702 0019", businessName: "PrintLab Córdoba", lastMessage: "Necesito presupuesto para 20 remeras estampadas", category: "presupuesto", status: "nuevo", assignedToHuman: false, createdAt: "2026-04-10T09:40:00Z", updatedAt: "2026-04-11T09:45:00Z", estimatedOpportunity: "AR$ 96.000", internalNotes: "Posible cliente recurrente para eventos corporativos.", messages: [{ id: "m1", sender: "customer", content: "Buenas, necesito presupuesto para 20 unidades.", timestamp: "09:42" }] },
  { id: "c3", workspaceId: "ws-1", userId: "u-admin-1", customerName: "María Pinto", phone: "+54 9 261 411 0088", businessName: "Dermacare Studio", lastMessage: "Quiero hablar con un asesor", category: "soporte humano", status: "esperando respuesta", assignedToHuman: true, createdAt: "2026-04-09T18:21:00Z", updatedAt: "2026-04-11T08:30:00Z", internalNotes: "Solicita plan de tratamientos combinados.", messages: [{ id: "m1", sender: "customer", content: "Hola, me pasás más información de depilación láser?", timestamp: "18:22" }] },
  { id: "c4", workspaceId: "ws-2", userId: "u-operator-3", customerName: "Tomás Delgado", phone: "+54 9 341 200 9930", businessName: "Óptica Vera", lastMessage: "¿Ya está listo mi pedido?", category: "pedido", status: "cerrado", assignedToHuman: false, createdAt: "2026-04-08T14:04:00Z", updatedAt: "2026-04-10T11:05:00Z", internalNotes: "Pedido entregado en sucursal Centro.", messages: [{ id: "m1", sender: "customer", content: "Hola, ¿ya está listo mi pedido 9871?", timestamp: "14:05" }] },
  { id: "c5", workspaceId: "ws-2", userId: "u-owner-2", customerName: "Valentina Ríos", phone: "+54 9 381 552 3920", businessName: "Academia Nova", lastMessage: "¿Trabajan con clases online?", category: "consulta", status: "nuevo", assignedToHuman: false, createdAt: "2026-04-11T11:21:00Z", updatedAt: "2026-04-11T11:24:00Z", estimatedOpportunity: "AR$ 65.000", internalNotes: "Interés en plan trimestral.", messages: [{ id: "m1", sender: "customer", content: "Hola, quería saber si hacen cursos online.", timestamp: "11:22" }] },
  { id: "c6", workspaceId: "ws-2", userId: "u-admin-2", customerName: "Rubén Cejas", phone: "+54 9 223 620 3321", businessName: "Ferretería Delta", lastMessage: "¿Hacen envíos al interior?", category: "consulta", status: "en seguimiento", assignedToHuman: false, createdAt: "2026-04-10T16:00:00Z", updatedAt: "2026-04-11T10:10:00Z", internalNotes: "Posible compra mayorista de herramientas.", messages: [{ id: "m1", sender: "customer", content: "Buenas, ¿hacen envíos a Tandil?", timestamp: "16:03" }] },
  { id: "c7", workspaceId: "ws-3", userId: "u-operator-4", customerName: "Micaela Funes", phone: "+54 9 299 441 0021", businessName: "Studio Glow", lastMessage: "¿Cuánto sale lifting de pestañas?", category: "presupuesto", status: "nuevo", assignedToHuman: false, createdAt: "2026-04-11T12:45:00Z", updatedAt: "2026-04-11T12:46:00Z", estimatedOpportunity: "AR$ 24.000", internalNotes: "Lead de campaña en Instagram.", messages: [{ id: "m1", sender: "customer", content: "Hola, quería consultar precio de lifting.", timestamp: "12:45" }] },
  { id: "c8", workspaceId: "ws-3", userId: "u-admin-3", customerName: "Diego Salvatierra", phone: "+54 9 11 6977 1110", businessName: "Clínica San Rafael", lastMessage: "Me gustaría hablar con recepción", category: "soporte humano", status: "en seguimiento", assignedToHuman: true, createdAt: "2026-04-09T08:20:00Z", updatedAt: "2026-04-11T09:10:00Z", internalNotes: "Pedir datos de obra social antes de derivar.", messages: [{ id: "m1", sender: "customer", content: "¿Tienen turnos para traumatología?", timestamp: "08:21" }] },
];

export const leads: Lead[] = [
  { id: "l1", workspaceId: "ws-1", userId: "u-operator-1", name: "Carla Méndez", phone: "+54 11 4987 1221", source: "WhatsApp", business: "Mueblería Norte", category: "presupuesto", status: "en propuesta", lastInteraction: "Hoy, 10:16", estimatedValue: 420000 },
  { id: "l2", workspaceId: "ws-1", userId: "u-operator-2", name: "Luis Arce", phone: "+54 9 351 702 0019", source: "Meta Ads", business: "PrintLab Córdoba", category: "presupuesto", status: "calificado", lastInteraction: "Hoy, 09:45", estimatedValue: 96000 },
  { id: "l3", workspaceId: "ws-2", userId: "u-owner-2", name: "Valentina Ríos", phone: "+54 9 381 552 3920", source: "Instagram", business: "Academia Nova", category: "consulta", status: "nuevo", lastInteraction: "Hoy, 11:23", estimatedValue: 65000 },
  { id: "l4", workspaceId: "ws-2", userId: "u-admin-2", name: "Sofía Arrieta", phone: "+54 9 379 421 9082", source: "WhatsApp", business: "Mundo Bebé", category: "consulta", status: "en propuesta", lastInteraction: "Hoy, 09:55", estimatedValue: 310000 },
  { id: "l5", workspaceId: "ws-3", userId: "u-operator-4", name: "Nicolás Rosas", phone: "+54 9 11 4300 1919", source: "Google", business: "FixIt Hogar", category: "consulta", status: "calificado", lastInteraction: "Hoy, 13:01", estimatedValue: 150000 },
];

export const automationRules: AutomationRule[] = [
  { id: "a1", workspaceId: "ws-1", userId: "u-admin-1", name: "Flujo de presupuesto inmediato", trigger: "Detecta palabras: precio, presupuesto, costo", action: "Responde con plantilla comercial y solicita datos clave", active: true, category: "presupuesto", confidence: 94 },
  { id: "a2", workspaceId: "ws-1", userId: "u-admin-1", name: "Estado de pedido", trigger: "Detecta: pedido, seguimiento, envío", action: "Consulta estado mock y responde ETA con tono cercano", active: true, category: "pedido", confidence: 91 },
  { id: "a3", workspaceId: "ws-2", userId: "u-admin-2", name: "Consulta general", trigger: "Detecta intención informativa sin urgencia", action: "Entrega FAQ contextual y propone siguiente paso", active: true, category: "consulta", confidence: 88 },
  { id: "a4", workspaceId: "ws-3", userId: "u-admin-3", name: "Derivación a asesor", trigger: "Detecta: quiero hablar con un asesor / humano", action: "Etiqueta soporte humano y notifica al equipo", active: true, category: "soporte humano", confidence: 97 },
];

export const businessSettings: BusinessSettings[] = [
  { workspaceId: "ws-1", plan: "growth", businessName: "Mueblería Norte", industry: "Hogar", timezone: "America/Argentina/Buenos_Aires", welcomeMessage: "¡Hola! Te ayudamos con tu presupuesto en minutos." },
  { workspaceId: "ws-2", plan: "starter", businessName: "Academia Nova", industry: "Educación", timezone: "America/Argentina/Cordoba", welcomeMessage: "¡Bienvenido! Elegí tu curso y te guiamos." },
  { workspaceId: "ws-3", plan: "pro", businessName: "Clínica San Rafael", industry: "Salud", timezone: "America/Argentina/Buenos_Aires", welcomeMessage: "Estamos para ayudarte con turnos y consultas." },
];
