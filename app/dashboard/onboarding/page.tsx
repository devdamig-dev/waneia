import { OnboardingClient } from "@/components/dashboard/onboarding-client";

export default function OnboardingPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Onboarding</h2>
      <p className="text-zinc-400">Configuración inicial guiada para lanzar operación en WANEIA.</p>
      <OnboardingClient />
    </section>
  );
}
