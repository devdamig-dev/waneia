"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Bot, BriefcaseBusiness, CreditCard, ExternalLink, LifeBuoy, MegaphoneIcon, Plug, Search, Sparkles, Star, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useHelpArticles } from "@/lib/workspace-config";
import { HelpArticle } from "@/types/config";

type Category = HelpArticle["category"];

const categoryMeta: Record<Category, { label: string; icon: typeof LifeBuoy; description: string }> = {
  comenzando: { label: "Cómo empezar", icon: Sparkles, description: "Onboarding, primer pipeline y workspace." },
  whatsapp: { label: "WhatsApp Cloud API", icon: Plug, description: "Conexión, webhook, plantillas HSM." },
  ia: { label: "IA y conocimiento", icon: BookOpen, description: "Modelos, prompts y base de conocimiento." },
  automatizaciones: { label: "Automatizaciones y bots", icon: Bot, description: "Reglas y flujos visuales." },
  campañas: { label: "Campañas WhatsApp", icon: MegaphoneIcon, description: "Cumplimiento y envíos masivos." },
  facturacion: { label: "Facturación y planes", icon: CreditCard, description: "Plan, consumo y upgrades." },
  equipo: { label: "Equipo y permisos", icon: UsersRound, description: "Roles y operadores." },
};

export function HelpClient() {
  const { articles } = useHelpArticles();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<Category | "todos">("todos");
  const [selectedId, setSelectedId] = useState<string>(articles[0]?.id ?? "");

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (activeCat !== "todos" && a.category !== activeCat) return false;
      if (search && !`${a.title} ${a.body}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [articles, activeCat, search]);

  const selected = articles.find((a) => a.id === selectedId) ?? filtered[0];
  const featured = articles.filter((a) => a.featured);

  const counts = useMemo(() => {
    const out: Record<Category, number> = { comenzando: 0, whatsapp: 0, ia: 0, automatizaciones: 0, campañas: 0, facturacion: 0, equipo: 0 };
    articles.forEach((a) => { out[a.category] = (out[a.category] ?? 0) + 1; });
    return out;
  }, [articles]);

  return (
    <>
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
            <Search className="h-4 w-4 text-zinc-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en el centro de ayuda" className="w-full bg-transparent outline-none" />
          </div>
          <span className="text-[11px] text-zinc-500">{filtered.length} resultados</span>
        </div>
      </Card>

      {featured.length > 0 && activeCat === "todos" && !search ? (
        <Card className="mt-4 p-5">
          <p className="text-sm font-semibold inline-flex items-center gap-2"><Star className="h-4 w-4 text-amber-300" /> Artículos destacados</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            {featured.map((a) => (
              <button key={a.id} onClick={() => setSelectedId(a.id)} className="rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-cyan-300/40 hover:bg-cyan-500/5">
                <p className="text-xs uppercase tracking-wide text-zinc-400">{categoryMeta[a.category].label}</p>
                <p className="mt-1 text-sm font-medium">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">{a.body}</p>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="p-3">
          <p className="px-2 text-xs uppercase tracking-wide text-zinc-400">Categorías</p>
          <button onClick={() => setActiveCat("todos")} className={`mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${activeCat === "todos" ? "bg-cyan-500/20 text-cyan-100" : "hover:bg-white/10"}`}>
            <span className="inline-flex items-center gap-2"><BriefcaseBusiness className="h-3.5 w-3.5" />Todos</span>
            <span className="text-xs text-zinc-400">{articles.length}</span>
          </button>
          <div className="mt-1 space-y-1">
            {(Object.keys(categoryMeta) as Category[]).map((cat) => {
              const meta = categoryMeta[cat];
              const Icon = meta.icon;
              return (
                <button key={cat} onClick={() => setActiveCat(cat)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${activeCat === cat ? "bg-cyan-500/20 text-cyan-100" : "hover:bg-white/10"}`}>
                  <span className="inline-flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{meta.label}</span>
                  <span className="text-xs text-zinc-400">{counts[cat] ?? 0}</span>
                </button>
              );
            })}
          </div>
          <Card className="mt-3 p-3 text-xs text-zinc-400">
            <p className="font-medium text-zinc-200 inline-flex items-center gap-1"><LifeBuoy className="h-3.5 w-3.5 text-emerald-300" />¿Necesitás más ayuda?</p>
            <p className="mt-1">Escribinos a soporte@waneia.app o agendá una llamada con tu CSM.</p>
          </Card>
        </Card>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <Card className="p-3">
            <div className="space-y-1">
              {filtered.length === 0 ? <p className="px-3 py-6 text-center text-sm text-zinc-400">Sin resultados.</p> : filtered.map((a) => (
                <button key={a.id} onClick={() => setSelectedId(a.id)} className={`w-full rounded-xl border p-3 text-left transition ${selected?.id === a.id ? "border-cyan-300/40 bg-cyan-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.featured ? <Star className="h-3.5 w-3.5 fill-amber-300/60 text-amber-300" /> : null}
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-400">{categoryMeta[a.category].label}</p>
                </button>
              ))}
            </div>
          </Card>

          {selected ? (
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-400">{categoryMeta[selected.category].label}</p>
              <h3 className="text-xl font-semibold">{selected.title}</h3>
              <p className="mt-2 text-sm text-zinc-300">{selected.body}</p>
              {selected.contextLinks.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">Enlaces relacionados</p>
                  <div className="mt-2 space-y-2">
                    {selected.contextLinks.map((href) => (
                      <Link key={href} href={href} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-500/10">
                        {href}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              <p className="mt-4 text-[11px] text-zinc-500">Última actualización: {new Date(selected.updatedAt).toLocaleDateString("es-AR")}</p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
                <span>¿Te ayudó?</span>
                <button className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10">Sí</button>
                <button className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10">No</button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center text-sm text-zinc-400">Seleccioná un artículo para verlo.</Card>
          )}
        </div>
      </div>

      <Card className="mt-4 p-5">
        <p className="text-sm font-semibold">Atajos para configurar</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3 lg:grid-cols-4">
          {[
            { href: "/dashboard/integracion-whatsapp", label: "Conectar WhatsApp", icon: Plug },
            { href: "/dashboard/ia", label: "Centro IA", icon: Sparkles },
            { href: "/dashboard/base-conocimiento", label: "Base de conocimiento", icon: BookOpen },
            { href: "/dashboard/bots", label: "Flujos de bot", icon: Bot },
            { href: "/dashboard/configuracion/categorias", label: "Categorías", icon: BriefcaseBusiness },
            { href: "/dashboard/configuracion/pipelines", label: "Pipelines", icon: BriefcaseBusiness },
            { href: "/dashboard/configuracion/departamentos", label: "Departamentos", icon: UsersRound },
            { href: "/dashboard/onboarding", label: "Setup inicial", icon: ArrowRight },
          ].map((s) => (
            <Link key={s.href} href={s.href} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:border-cyan-300/40 hover:bg-cyan-500/5">
              <span className="inline-flex items-center gap-2"><s.icon className="h-4 w-4 text-cyan-300" />{s.label}</span>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </Link>
          ))}
        </div>
      </Card>
    </>
  );
}
