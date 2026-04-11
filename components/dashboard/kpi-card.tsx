import { Card } from "@/components/ui/card";

export function KpiCard({ title, value, delta }: { title: string; value: string; delta: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs text-emerald-300">{delta}</p>
    </Card>
  );
}
