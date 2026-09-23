"use client";

import { FormEvent, useState } from "react";
import { Loader2, LockKeyhole, MessageCircleMore } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus(error.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : error.message);
        setLoading(false);
        return;
      }
      window.location.assign(nextPath);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath === "/dashboard" ? "/onboarding" : nextPath)}`,
      },
    });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.assign(nextPath === "/dashboard" ? "/onboarding" : nextPath);
      return;
    }

    setStatus("Cuenta creada. Revisá tu email para confirmar el acceso.");
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-500/10">
          <MessageCircleMore className="h-5 w-5 text-emerald-200" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">WANEIA</p>
        <h1 className="mt-2 text-3xl font-bold">WhatsApp + CRM</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Centralizá conversaciones, ventas y seguimientos de tu equipo.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <div className="mb-5 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1 text-sm">
          <button onClick={() => setMode("login")} className={`rounded-lg px-3 py-2 ${mode === "login" ? "bg-white/10 text-white" : "text-zinc-400"}`}>
            Ingresar
          </button>
          <button onClick={() => setMode("signup")} className={`rounded-lg px-3 py-2 ${mode === "signup" ? "bg-white/10 text-white" : "text-zinc-400"}`}>
            Crear cuenta
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" ? (
            <label className="block">
              <span className="text-xs text-zinc-400">Nombre</span>
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm outline-none focus:border-cyan-300/30"
                placeholder="Tu nombre"
              />
            </label>
          ) : null}
          <label className="block">
            <span className="text-xs text-zinc-400">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm outline-none focus:border-cyan-300/30"
              placeholder="nombre@empresa.com"
            />
          </label>
          <label className="block">
            <span className="text-xs text-zinc-400">Contraseña</span>
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm outline-none focus:border-cyan-300/30"
              placeholder="Mínimo 8 caracteres"
            />
          </label>

          {status ? <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-300">{status}</p> : null}

          <button
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/30 px-4 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-500/40 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            {mode === "login" ? "Entrar a Waneia" : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
