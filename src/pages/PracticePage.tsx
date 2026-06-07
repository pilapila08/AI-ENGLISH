import type { ReactNode } from "react";

export default function PracticePage({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate overflow-hidden bg-[#050711]">
      <div className="cockpit-grid pointer-events-none fixed inset-0 -z-10 opacity-40" />
      <div className="app-float pointer-events-none fixed -left-32 top-20 -z-10 size-96 rounded-full bg-violet-600/15 blur-3xl" />
      <div className="app-float-delayed pointer-events-none fixed -right-36 bottom-24 -z-10 size-[28rem] rounded-full bg-cyan-500/10 blur-3xl" />
      {children}
    </div>
  );
}
