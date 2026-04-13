"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar" />
      <div className={cn("relative z-10 w-full max-w-xl rounded-2xl border border-white/15 bg-[#090f24] p-6 shadow-2xl", className)}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg bg-white/10 px-2 py-1 text-xs hover:bg-white/20">Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  );
}
