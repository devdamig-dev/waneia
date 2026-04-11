import { Bell, Search } from "lucide-react";

export function Topbar() {
  return (
    <header className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-zinc-400">
        <Search className="h-4 w-4" />
        <span className="text-sm">Buscar conversaciones, contactos o etiquetas</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-xl border border-white/10 bg-white/10 p-2 text-zinc-200"><Bell className="h-4 w-4" /></button>
        <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/20 px-3 py-2 text-sm font-semibold">CM</div>
      </div>
    </header>
  );
}
