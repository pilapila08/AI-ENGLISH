import type { ReactNode } from "react";

interface StatusBadgeProps {
  children: ReactNode;
  tone?: "cyan" | "violet" | "green" | "amber" | "slate";
  pulse?: boolean;
}

const tones = {
  cyan: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
  violet: "border-violet-400/25 bg-violet-400/10 text-violet-200",
  green: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  amber: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  slate: "border-white/10 bg-white/[0.04] text-slate-300",
};

export default function StatusBadge({
  children,
  tone = "slate",
  pulse = false,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${tones[tone]}`}
    >
      <span
        className={`size-1.5 rounded-full ${pulse ? "animate-pulse" : ""} ${
          tone === "cyan"
            ? "bg-cyan-300"
            : tone === "violet"
              ? "bg-violet-300"
              : tone === "green"
                ? "bg-emerald-300"
                : tone === "amber"
                  ? "bg-amber-300"
                  : "bg-slate-400"
        }`}
      />
      {children}
    </span>
  );
}
