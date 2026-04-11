import { Badge } from "@/components/ui/badge";
import { ConversationCategory } from "@/types/entities";

const categoryStyles: Record<ConversationCategory, string> = {
  presupuesto: "border-emerald-300/40 bg-emerald-400/10 text-emerald-100",
  pedido: "border-cyan-300/40 bg-cyan-400/10 text-cyan-100",
  consulta: "border-violet-300/40 bg-violet-400/10 text-violet-100",
  "soporte humano": "border-amber-300/40 bg-amber-400/10 text-amber-100",
};

export function CategoryBadge({ category }: { category: ConversationCategory }) {
  return <Badge className={categoryStyles[category]}>{category}</Badge>;
}
