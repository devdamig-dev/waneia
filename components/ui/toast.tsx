"use client";

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100 shadow-xl backdrop-blur">
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button onClick={onClose} className="text-xs text-emerald-200/90 hover:text-white">Cerrar</button>
      </div>
    </div>
  );
}
