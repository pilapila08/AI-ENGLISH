import type { HTMLAttributes, ReactNode } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  as?: "section" | "aside" | "div";
  glow?: "cyan" | "violet" | "none";
}

export default function GlassCard({
  children,
  as: Component = "section",
  glow = "none",
  className = "",
  ...props
}: GlassCardProps) {
  return (
    <Component
      className={`glass-card ${glow === "cyan" ? "glass-glow-cyan" : glow === "violet" ? "glass-glow-violet" : ""} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
