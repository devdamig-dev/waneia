"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { onboardingSteps } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";

export function OnboardingClient() {
  const { activeWorkspace } = useWorkspace();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState(onboardingSteps[0].id);

  const completion = useMemo(() => {
    const total = onboardingSteps.length;
    const completed = onboardingSteps.filter((s) => done[s.id]).length;
    return Math.round((completed / total) * 100);
  }, [done]);

  const active = onboardingSteps.find((s) => s.id === activeId) ?? onboardingSteps[0];
  const toggle = (id: string) => setDone((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="p-4">
        <p className="font-semibold">Setup inicial</p>
        <p className="mt-1 text-xs text-zinc-400">{activeWorkspace.name}</p>
        <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${Math.max(completion, activeWorkspace.onboardingCompletion)}%` }} /></div>
        <p className="mt-1 text-xs text-zinc-400">{Math.max(completion, activeWorkspace.onboardingCompletion)}% completado</p>
        <div className="mt-3 space-y-1">
          {onboardingSteps.map((step, index) => {
            const isDone = done[step.id];
            return (
              <button key={step.id} onClick={() => setActiveId(step.id)} className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${activeId === step.id ? "bg-cyan-500/20 text-cyan-100" : "bg-white/5 hover:bg-white/10"}`}>
                {isDone ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" /> : <Circle className="mt-0.5 h-4 w-4 text-zinc-500" />}
                <div className="flex-1">
                  <p className="text-sm font-medium">{index + 1}. {step.title}</p>
                  <p className="text-[11px] text-zinc-400">{step.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-wide text-zinc-400">Paso</p>
        <h3 className="text-xl font-semibold">{active.title}</h3>
        <p className="mt-1 text-sm text-zinc-300">{active.description}</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Card className="p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Por qué importa</p>
            <p className="mt-1 text-sm text-zinc-200">Completar este paso desbloquea funcionalidades operativas y mejora la calidad de la atención.</p>
          </Card>
          <Card className="p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-400">Acción recomendada</p>
            <p className="mt-1 text-sm text-zinc-200">Ir al módulo correspondiente y completar la configuración.</p>
            <Link href={active.href} className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-200">Ir a la sección <ArrowRight className="h-3 w-3" /></Link>
          </Card>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => toggle(active.id)} className={done[active.id] ? "bg-emerald-500/30 hover:bg-emerald-500/40" : ""}>{done[active.id] ? "Marcar como pendiente" : "Marcar como completado"}</Button>
          <Link href={active.href} className="inline-flex items-center gap-1 rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">Continuar en módulo <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </Card>
    </div>
  );
}
