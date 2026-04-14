import { Badge } from "@/components/ui/badge";
import { ConversationStatus, LeadStatus } from "@/types/entities";

const statusClasses: Record<string, string> = {
  nuevo: "border-cyan-300/40 bg-cyan-400/15 text-cyan-100",
  "en seguimiento": "border-emerald-300/40 bg-emerald-400/15 text-emerald-100",
  "esperando respuesta": "border-amber-300/40 bg-amber-300/15 text-amber-100",
  cerrado: "border-zinc-300/40 bg-zinc-400/15 text-zinc-100",
  new: "border-cyan-300/40 bg-cyan-400/15 text-cyan-100",
  "in progress": "border-emerald-300/40 bg-emerald-400/15 text-emerald-100",
  pending: "border-amber-300/40 bg-amber-300/15 text-amber-100",
  won: "border-emerald-300/40 bg-emerald-400/15 text-emerald-100",
  lost: "border-rose-300/40 bg-rose-400/15 text-rose-100",
  closed: "border-zinc-300/40 bg-zinc-400/15 text-zinc-100",
  calificado: "border-sky-300/40 bg-sky-400/15 text-sky-100",
  "en propuesta": "border-violet-300/40 bg-violet-400/15 text-violet-100",
  ganado: "border-emerald-300/40 bg-emerald-400/15 text-emerald-100",
  perdido: "border-rose-300/40 bg-rose-400/15 text-rose-100",
};

export function StatusBadge({ status }: { status: ConversationStatus | LeadStatus }) {
  return <Badge className={statusClasses[status]}>{status}</Badge>;
}
