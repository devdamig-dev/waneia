"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  side?: "right" | "left";
  width?: string; // tailwind width class, ej: "max-w-md"
  children: ReactNode;
  footer?: ReactNode;
};

export function Drawer({ open, onClose, title, description, side = "right", width = "max-w-md", children, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex" aria-modal role="dialog">
      <button onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Cerrar" />
      <aside
        className={cn(
          "relative z-10 flex h-full w-full flex-col border-white/10 bg-[#070b1c]/98 shadow-2xl",
          width,
          side === "right" ? "ml-auto border-l" : "mr-auto border-r",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            {description ? <p className="mt-0.5 text-xs text-zinc-400">{description}</p> : null}
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-xs hover:bg-white/10"><X className="h-4 w-4" /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer ? <footer className="border-t border-white/10 p-3">{footer}</footer> : null}
      </aside>
    </div>
  );
}
