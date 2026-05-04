import { Badge } from "@/components/ui/badge";
import { ConversationStatus, LeadStage } from "@/types/entities";

const statusClasses: Record<string, string> = {
  // Conversation status (Spanish unified)
  nuevo: "border-cyan-300/40 bg-cyan-400/15 text-cyan-100",
  "en curso": "border-emerald-300/40 bg-emerald-400/15 text-emerald-100",
  pendiente: "border-violet-300/40 bg-violet-400/15 text-violet-100",
  ganado: "border-emerald-300/40 bg-emerald-400/15 text-emerald-100",
  perdido: "border-rose-300/40 bg-rose-400/15 text-rose-100",
  cerrado: "border-zinc-300/40 bg-zinc-400/15 text-zinc-100",
  // Lead stages
  contactado: "border-sky-300/40 bg-sky-400/15 text-sky-100",
  cotizando: "border-violet-300/40 bg-violet-400/15 text-violet-100",
  negociacion: "border-amber-300/40 bg-amber-300/15 text-amber-100",
};

const labelMap: Record<string, string> = {
  negociacion: "En negociación",
  "en curso": "En curso",
};

export function StatusBadge({ status }: { status: ConversationStatus | LeadStage }) {
  const label = labelMap[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge className={statusClasses[status]}>{label}</Badge>;
}
