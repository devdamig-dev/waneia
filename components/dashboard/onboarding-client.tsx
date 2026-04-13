"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { onboardingSteps } from "@/data/saas-data";
import { useWorkspace } from "@/components/dashboard/workspace-context";

export function OnboardingClient() {
  const { activeWorkspace } = useWorkspace();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});

  const completion = useMemo(() => Math.round(((currentIndex + 1) / onboardingSteps.length) * 100), [currentIndex]);
  const activeStep = onboardingSteps[currentIndex];

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="p-4">
        <p className="font-semibold">Setup inicial</p>
        <p className="mt-1 text-xs text-zinc-400">{activeWorkspace.name}</p>
        <div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${completion}%` }} /></div>
        <p className="mt-1 text-xs text-zinc-400">{completion}% completado</p>
        <div className="mt-3 space-y-2">
          {onboardingSteps.map((step, index) => (
            <button key={step.id} onClick={() => setCurrentIndex(index)} className={`w-full rounded-xl px-3 py-2 text-left text-sm ${index === currentIndex ? "bg-cyan-500/20" : "bg-white/5"}`}>{index + 1}. {step.title}</button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-wide text-zinc-400">Paso {currentIndex + 1}</p>
        <h3 className="text-xl font-semibold">{activeStep.title}</h3>
        <p className="text-sm text-zinc-300">{activeStep.description}</p>
        <textarea value={data[activeStep.id] ?? ""} onChange={(e) => setData((prev) => ({ ...prev, [activeStep.id]: e.target.value }))} placeholder="Completá este paso..." className="mt-4 min-h-28 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm" />
        <div className="mt-3 flex gap-2">
          <button disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)} className="rounded-xl border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Anterior</button>
          <button disabled={currentIndex === onboardingSteps.length - 1} onClick={() => setCurrentIndex((i) => i + 1)} className="rounded-xl border border-emerald-300/30 bg-emerald-500/20 px-3 py-2 text-sm disabled:opacity-40">Siguiente</button>
        </div>
      </Card>
    </div>
  );
}
