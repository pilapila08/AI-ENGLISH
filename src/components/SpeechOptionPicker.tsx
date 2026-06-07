import { useEffect, useRef, useState } from "react";

export interface SpeechPickerOption<T extends string> {
  value: T;
  label: string;
  description: string;
  badge?: string;
}

interface SpeechOptionPickerProps<T extends string> {
  accent: "violet" | "cyan";
  icon: string;
  label: string;
  options: Array<SpeechPickerOption<T>>;
  value: T;
  onChange: (value: T) => void;
}

const tones = {
  violet: {
    border: "border-violet-200 hover:border-violet-400",
    icon: "from-violet-600 to-indigo-500",
    label: "text-violet-500",
    ring: "border-violet-300 bg-violet-50 text-violet-700",
    selected: "border-violet-200 bg-violet-50/90",
    dot: "bg-violet-600",
  },
  cyan: {
    border: "border-cyan-200 hover:border-cyan-400",
    icon: "from-cyan-500 to-blue-600",
    label: "text-cyan-600",
    ring: "border-cyan-300 bg-cyan-50 text-cyan-700",
    selected: "border-cyan-200 bg-cyan-50/90",
    dot: "bg-cyan-600",
  },
} as const;

export default function SpeechOptionPicker<T extends string>(
  props: SpeechOptionPickerProps<T>,
) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const tone = tones[props.accent];
  const selected =
    props.options.find((option) => option.value === props.value) ??
    props.options[0];

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative min-w-0" ref={rootRef}>
      <button
        aria-expanded={open}
        className={`group flex w-full items-center gap-2.5 rounded-xl border bg-white/95 px-3 py-2 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${tone.border} ${open ? "ring-2 ring-white shadow-md" : ""}`}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-[10px] font-black text-white shadow-sm ${tone.icon}`}
        >
          {props.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block text-[10px] font-black uppercase tracking-[0.14em] ${tone.label}`}
          >
            {props.label}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5">
            <span className="truncate text-xs font-black text-slate-800">
              {selected.label}
            </span>
            {selected.badge && (
              <span
                className={`rounded-full border px-1.5 py-0.5 text-[9px] font-black ${tone.ring}`}
              >
                {selected.badge}
              </span>
            )}
          </span>
        </span>
        <span
          className={`text-sm font-bold text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-slate-700" : ""}`}
        >
          ▾
        </span>
      </button>

      <div
        aria-hidden={!open}
        className={`speech-picker-menu absolute left-0 right-0 top-[calc(100%+8px)] z-40 origin-top overflow-hidden rounded-2xl border border-white/90 bg-white/95 p-1.5 shadow-[0_20px_50px_-18px_rgba(23,32,51,0.5)] backdrop-blur-xl ${open ? "speech-picker-menu-open" : "speech-picker-menu-closed"}`}
      >
        <div className="max-h-64 space-y-1 overflow-y-auto p-0.5">
          {props.options.map((option) => {
            const isSelected = option.value === props.value;
            return (
              <button
                className={`flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition duration-150 hover:translate-x-0.5 hover:border-slate-200 hover:bg-slate-50 ${isSelected ? tone.selected : "border-transparent"}`}
                key={option.value}
                onClick={() => {
                  props.onChange(option.value);
                  setOpen(false);
                }}
                type="button"
              >
                <span
                  className={`size-2 shrink-0 rounded-full transition ${isSelected ? tone.dot : "bg-slate-200"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-800">
                      {option.label}
                    </span>
                    {option.badge && (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                        {option.badge}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                    {option.description}
                  </span>
                </span>
                {isSelected && (
                  <span className={`text-xs font-black ${tone.label}`}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
