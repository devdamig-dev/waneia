import { AutomationRule, Conversation, Lead } from "@/types/entities";

export const conversations: Conversation[] = [
  {
    id: "c1",
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
      { id: "m3", sender: "customer", content: "Sí, y también tiempos de instalación.", timestamp: "10:14" },
      { id: "m4", sender: "agent", content: "Perfecto, hoy te enviamos propuesta completa con opciones.", timestamp: "10:16" }
    ]
  },
  {
    id: "c2", customerName: "Luis Arce", phone: "+54 9 351 702 0019", businessName: "PrintLab Córdoba", lastMessage: "Necesito presupuesto para 20 remeras estampadas", category: "presupuesto", status: "nuevo", assignedToHuman: false, createdAt: "2026-04-10T09:40:00Z", updatedAt: "2026-04-11T09:45:00Z", estimatedOpportunity: "AR$ 96.000", internalNotes: "Posible cliente recurrente para eventos corporativos.", messages: [
      { id: "m1", sender: "customer", content: "Buenas, necesito presupuesto para 20 unidades.", timestamp: "09:42" },
      { id: "m2", sender: "system", content: "¡Hola! ¿Tenés diseño listo o necesitás ayuda con eso?", timestamp: "09:43" },
      { id: "m3", sender: "customer", content: "Tengo diseño, necesito entrega para el viernes.", timestamp: "09:45" }
    ]
  },
  {
    id: "c3", customerName: "María Pinto", phone: "+54 9 261 411 0088", businessName: "Dermacare Studio", lastMessage: "Quiero hablar con un asesor", category: "soporte humano", status: "esperando respuesta", assignedToHuman: true, createdAt: "2026-04-09T18:21:00Z", updatedAt: "2026-04-11T08:30:00Z", internalNotes: "Solicita plan de tratamientos combinados.", messages: [
      { id: "m1", sender: "customer", content: "Hola, me pasás más información de depilación láser?", timestamp: "18:22" },
      { id: "m2", sender: "system", content: "¡Claro! Tenemos planes por zona y por pack. ¿Querés que te asesore una especialista?", timestamp: "18:23" },
      { id: "m3", sender: "customer", content: "Sí, prefiero hablar con un asesor.", timestamp: "18:25" },
      { id: "m4", sender: "agent", content: "Te contactamos por este medio en menos de 20 minutos.", timestamp: "18:27" }
    ]
  },
  {
    id: "c4", customerName: "Tomás Delgado", phone: "+54 9 341 200 9930", businessName: "Óptica Vera", lastMessage: "¿Ya está listo mi pedido?", category: "pedido", status: "cerrado", assignedToHuman: false, createdAt: "2026-04-08T14:04:00Z", updatedAt: "2026-04-10T11:05:00Z", internalNotes: "Pedido entregado en sucursal Centro.", messages: [
      { id: "m1", sender: "customer", content: "Hola, ¿ya está listo mi pedido 9871?", timestamp: "14:05" },
      { id: "m2", sender: "system", content: "Tu pedido está en preparación final. Te avisamos apenas quede listo.", timestamp: "14:06" },
      { id: "m3", sender: "system", content: "¡Listo para retirar desde las 17 hs!", timestamp: "16:32" }
    ]
  },
  {
    id: "c5", customerName: "Valentina Ríos", phone: "+54 9 381 552 3920", businessName: "Academia Nova", lastMessage: "¿Trabajan con clases online?", category: "consulta", status: "nuevo", assignedToHuman: false, createdAt: "2026-04-11T11:21:00Z", updatedAt: "2026-04-11T11:24:00Z", estimatedOpportunity: "AR$ 65.000", internalNotes: "Interés en plan trimestral.", messages: [
      { id: "m1", sender: "customer", content: "Hola, quería saber si hacen cursos online.", timestamp: "11:22" },
      { id: "m2", sender: "system", content: "Sí, tenemos modalidad en vivo y grabada. ¿Qué curso te interesa?", timestamp: "11:23" }
    ]
  },
  {
    id: "c6", customerName: "Rubén Cejas", phone: "+54 9 223 620 3321", businessName: "Ferretería Delta", lastMessage: "¿Hacen envíos al interior?", category: "consulta", status: "en seguimiento", assignedToHuman: false, createdAt: "2026-04-10T16:00:00Z", updatedAt: "2026-04-11T10:10:00Z", internalNotes: "Posible compra mayorista de herramientas.", messages: [
      { id: "m1", sender: "customer", content: "Buenas, ¿hacen envíos a Tandil?", timestamp: "16:03" },
      { id: "m2", sender: "system", content: "Sí, enviamos a todo el país por logística tercerizada.", timestamp: "16:04" }
    ]
  },
  {
    id: "c7", customerName: "Micaela Funes", phone: "+54 9 299 441 0021", businessName: "Studio Glow", lastMessage: "¿Cuánto sale lifting de pestañas?", category: "presupuesto", status: "nuevo", assignedToHuman: false, createdAt: "2026-04-11T12:45:00Z", updatedAt: "2026-04-11T12:46:00Z", estimatedOpportunity: "AR$ 24.000", internalNotes: "Lead de campaña en Instagram.", messages: [
      { id: "m1", sender: "customer", content: "Hola, quería consultar precio de lifting.", timestamp: "12:45" },
      { id: "m2", sender: "system", content: "¡Hola! El servicio tiene promo esta semana. ¿Querés reservar turno?", timestamp: "12:46" }
    ]
  },
  {
    id: "c8", customerName: "Diego Salvatierra", phone: "+54 9 11 6977 1110", businessName: "Clínica San Rafael", lastMessage: "Me gustaría hablar con recepción", category: "soporte humano", status: "en seguimiento", assignedToHuman: true, createdAt: "2026-04-09T08:20:00Z", updatedAt: "2026-04-11T09:10:00Z", internalNotes: "Pedir datos de obra social antes de derivar.", messages: [
      { id: "m1", sender: "customer", content: "¿Tienen turnos para traumatología?", timestamp: "08:21" },
      { id: "m2", sender: "system", content: "Sí, podemos ayudarte con eso. ¿Preferís que te contacte recepción?", timestamp: "08:22" },
      { id: "m3", sender: "customer", content: "Sí por favor.", timestamp: "08:23" }
    ]
  },
  {
    id: "c9", customerName: "Agustina Meza", phone: "+54 9 351 500 7410", businessName: "Panadería San Benito", lastMessage: "Necesito 100 medialunas para evento", category: "pedido", status: "esperando respuesta", assignedToHuman: false, createdAt: "2026-04-10T07:02:00Z", updatedAt: "2026-04-11T07:40:00Z", estimatedOpportunity: "AR$ 58.000", internalNotes: "Confirmar horario de entrega y pago anticipado.", messages: [
      { id: "m1", sender: "customer", content: "Hola, necesito 100 medialunas para mañana.", timestamp: "07:03" },
      { id: "m2", sender: "agent", content: "¡Perfecto! ¿Para qué horario las necesitás?", timestamp: "07:05" }
    ]
  },
  {
    id: "c10", customerName: "Gonzalo Vera", phone: "+54 9 266 470 8912", businessName: "TecnoFix", lastMessage: "¿Cuánto sale cambiar pantalla?", category: "presupuesto", status: "cerrado", assignedToHuman: false, createdAt: "2026-04-04T15:52:00Z", updatedAt: "2026-04-08T16:10:00Z", internalNotes: "Presupuesto aceptado y equipo entregado.", messages: [
      { id: "m1", sender: "customer", content: "¿Cuánto demoran en cambiar pantalla de iPhone 12?", timestamp: "15:53" },
      { id: "m2", sender: "system", content: "Demoramos entre 2 y 3 horas según stock.", timestamp: "15:55" }
    ]
  },
  {
    id: "c11", customerName: "Sofía Arrieta", phone: "+54 9 379 421 9082", businessName: "Mundo Bebé", lastMessage: "¿Tienen cuna en cuotas?", category: "consulta", status: "en seguimiento", assignedToHuman: false, createdAt: "2026-04-10T19:01:00Z", updatedAt: "2026-04-11T09:55:00Z", estimatedOpportunity: "AR$ 310.000", internalNotes: "Enviar opciones de financiación bancaria.", messages: [
      { id: "m1", sender: "customer", content: "Buenas, ¿tienen cuna convertible?", timestamp: "19:02" },
      { id: "m2", sender: "system", content: "Sí, y podés pagar en 6 cuotas. ¿Te paso catálogo?", timestamp: "19:03" }
    ]
  },
  {
    id: "c12", customerName: "Nicolás Rosas", phone: "+54 9 11 4300 1919", businessName: "FixIt Hogar", lastMessage: "¿Hacen instalación de aire acondicionado?", category: "consulta", status: "nuevo", assignedToHuman: false, createdAt: "2026-04-11T13:00:00Z", updatedAt: "2026-04-11T13:01:00Z", estimatedOpportunity: "AR$ 150.000", internalNotes: "Servicio hogar zona norte.", messages: [
      { id: "m1", sender: "customer", content: "Hola, ¿trabajan con instalación y garantía?", timestamp: "13:00" },
      { id: "m2", sender: "system", content: "Sí, instalación certificada y garantía escrita por 6 meses.", timestamp: "13:01" }
    ]
  }
];

export const leads: Lead[] = [
  { id: "l1", name: "Carla Méndez", phone: "+54 11 4987 1221", source: "WhatsApp", business: "Mueblería Norte", category: "presupuesto", status: "en propuesta", lastInteraction: "Hoy, 10:16", estimatedValue: 420000 },
  { id: "l2", name: "Luis Arce", phone: "+54 9 351 702 0019", source: "Meta Ads", business: "PrintLab Córdoba", category: "presupuesto", status: "calificado", lastInteraction: "Hoy, 09:45", estimatedValue: 96000 },
  { id: "l3", name: "Valentina Ríos", phone: "+54 9 381 552 3920", source: "Instagram", business: "Academia Nova", category: "consulta", status: "nuevo", lastInteraction: "Hoy, 11:23", estimatedValue: 65000 },
  { id: "l4", name: "Sofía Arrieta", phone: "+54 9 379 421 9082", source: "WhatsApp", business: "Mundo Bebé", category: "consulta", status: "en propuesta", lastInteraction: "Hoy, 09:55", estimatedValue: 310000 },
  { id: "l5", name: "Nicolás Rosas", phone: "+54 9 11 4300 1919", source: "Google", business: "FixIt Hogar", category: "consulta", status: "calificado", lastInteraction: "Hoy, 13:01", estimatedValue: 150000 },
  { id: "l6", name: "Micaela Funes", phone: "+54 9 299 441 0021", source: "Instagram", business: "Studio Glow", category: "presupuesto", status: "ganado", lastInteraction: "Hoy, 12:46", estimatedValue: 24000 },
  { id: "l7", name: "Agustina Meza", phone: "+54 9 351 500 7410", source: "WhatsApp", business: "Panadería San Benito", category: "pedido", status: "calificado", lastInteraction: "Hoy, 07:05", estimatedValue: 58000 },
  { id: "l8", name: "Diego Salvatierra", phone: "+54 9 11 6977 1110", source: "Referido", business: "Clínica San Rafael", category: "soporte humano", status: "nuevo", lastInteraction: "Hoy, 08:23", estimatedValue: 190000 }
];

export const automationRules: AutomationRule[] = [
  { id: "a1", name: "Flujo de presupuesto inmediato", trigger: "Detecta palabras: precio, presupuesto, costo", action: "Responde con plantilla comercial y solicita datos clave", active: true, category: "presupuesto", confidence: 94 },
  { id: "a2", name: "Estado de pedido", trigger: "Detecta: pedido, seguimiento, envío", action: "Consulta estado mock y responde ETA con tono cercano", active: true, category: "pedido", confidence: 91 },
  { id: "a3", name: "Consulta general", trigger: "Detecta intención informativa sin urgencia", action: "Entrega FAQ contextual y propone siguiente paso", active: true, category: "consulta", confidence: 88 },
  { id: "a4", name: "Derivación a asesor", trigger: "Detecta: quiero hablar con un asesor / humano", action: "Etiqueta soporte humano y notifica al equipo", active: true, category: "soporte humano", confidence: 97 }
];
