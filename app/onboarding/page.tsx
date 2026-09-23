import { redirect } from "next/navigation";
import { Building2, MessageCircleMore } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createWorkspace } from "@/app/onboarding/actions";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");

  const { data: workspaces } = await supabase.from("workspaces").select("id").limit(1);
  if (workspaces?.length) redirect("/dashboard");

  const metadata = data.claims.user_metadata as { full_name?: string } | undefined;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="mb-6">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-500/10">
            <MessageCircleMore className="h-5 w-5 text-emerald-200" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Primer paso</p>
          <h1 className="mt-2 text-3xl font-bold">Creá tu espacio de trabajo</h1>
          <p className="mt-2 text-sm text-zinc-400">Después vas a poder conectar WhatsApp, sumar al equipo y empezar a recibir conversaciones.</p>
        </div>

        <form action={createWorkspace} className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <label className="block">
            <span className="text-xs text-zinc-400">Tu nombre</span>
            <input name="fullName" defaultValue={metadata?.full_name ?? ""} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm" />
          </label>
          <label className="mt-3 block">
            <span className="text-xs text-zinc-400">Nombre del negocio</span>
            <input required name="name" placeholder="Ej.: Milen Muebles" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm" />
          </label>
          <label className="mt-3 block">
            <span className="text-xs text-zinc-400">Rubro</span>
            <input name="industry" placeholder="Ej.: Muebles, comercio, servicios" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm" />
          </label>

          <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/30 px-4 py-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-500/40">
            <Building2 className="h-4 w-4" />
            Crear espacio y entrar
          </button>
        </form>
      </div>
    </main>
  );
}
