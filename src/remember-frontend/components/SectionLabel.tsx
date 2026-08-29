import type { ReactNode } from "react";

type SectionLabelProps = {
  children: ReactNode;
  className?: string;
  variant?: "dark" | "archival";
};

export function SectionLabel({
  children,
  className = "",
  variant = "dark",
}: SectionLabelProps) {
  const color =
    variant === "archival"
      ? "text-archive-muted font-mono text-[10px] tracking-[0.08em]"
      : "text-white/50 text-xs tracking-wide";

  return <p className={`font-medium ${color} ${className}`}>{children}</p>;
}
