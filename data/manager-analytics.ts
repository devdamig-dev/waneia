export type ManagerMetric = {
  label: string;
  value: string;
  delta?: string;
  tone?: "blue" | "green" | "amber" | "rose" | "violet";
};

export const managerMetrics: ManagerMetric[] = [
  { label: "Chats creados", value: "2.802", delta: "+12%", tone: "blue" },
  { label: "Respondidos", value: "1.694", delta: "+8%", tone: "green" },
  { label: "Sin respuesta", value: "1.072", delta: "-6%", tone: "rose" },
  { label: "1ra respuesta", value: "12m", delta: "-32%", tone: "violet" },
  { label: "Mensajes/chat", value: "5,7", delta: "-14%", tone: "blue" },
  { label: "Costo API estimado", value: "USD 78", delta: "-18%", tone: "amber" },
];

export const dailyChats = [86, 124, 142, 118, 12, 6, 136, 154, 121, 146, 17, 5, 128, 132, 119, 111, 138, 9, 4, 126, 121, 132, 98, 139, 14, 8, 120, 116, 112, 109];

export const sellers = [
  { name: "Julieta", chats: 642, answered: 462, pending: 180, firstResponse: "14m", messages: "6,2", status: "En línea" },
  { name: "Lucas", chats: 584, answered: 389, pending: 195, firstResponse: "18m", messages: "5,1", status: "En línea" },
  { name: "Carla", chats: 734, answered: 612, pending: 122, firstResponse: "8m", messages: "5,8", status: "En línea" },
  { name: "Juan", chats: 421, answered: 231, pending: 190, firstResponse: "22m", messages: "4,7", status: "Ausente" },
  { name: "Sofía", chats: 280, answered: 189, pending: 91, firstResponse: "16m", messages: "6,4", status: "En línea" },
  { name: "Marcos", chats: 141, answered: 98, pending: 43, firstResponse: "12m", messages: "5,9", status: "En línea" },
];

export const tagFamilies = [
  {
    title: "Vendedores",
    tone: "emerald",
    tags: ["Julieta", "Lucas", "Carla", "Juan", "Sofía", "Marcos"],
  },
  {
    title: "Estado comercial",
    tone: "blue",
    tags: ["Para presupuestar", "Presupuesto enviado", "Esperando cliente", "Seguimiento", "Cerrado"],
  },
  {
    title: "Tipo de trabajo",
    tone: "violet",
    tags: ["Offset", "Digital", "Packaging", "Gran formato"],
  },
];

export const recentActivity = [
  { title: "Julieta tomó una conversación", detail: "Etiqueta Julieta agregada", when: "hace 5 min" },
  { title: "Estado actualizado", detail: "Para presupuestar · Cliente #7841", when: "hace 12 min" },
  { title: "Nuevo lead desde Instagram", detail: "María González", when: "hace 28 min" },
  { title: "Presupuesto enviado", detail: "Etiqueta aplicada · Cliente #7830", when: "hace 1 h" },
];

export const tagFunnel = [
  { label: "Ingresaron", value: 2802 },
  { label: "Tomados por vendedor", value: 2110 },
  { label: "Para presupuestar", value: 1340 },
  { label: "Presupuesto enviado", value: 1086 },
  { label: "Esperando decisión", value: 621 },
  { label: "Cerrados", value: 327 },
];
