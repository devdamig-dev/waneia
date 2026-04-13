"use client";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
};

export function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-emerald-500/70" : "bg-zinc-600/70"}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${checked ? "left-6" : "left-1"}`} />
    </button>
  );
}
