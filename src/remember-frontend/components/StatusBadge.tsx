import { STATUS_LABELS } from "../constants";
import type { ProjectStatus } from "../types/dashboard";

const STATUS_STYLES: Record<
  ProjectStatus,
  { dark: string; archival: string }
> = {
  ingesting: {
    dark: "border-white/20 bg-white/10 text-white/80",
    archival: "border-white/20 bg-white/10 text-white/80",
  },
  repairing: {
    dark: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    archival: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
  isolating: {
    dark: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    archival: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  },
  live: {
    dark: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    archival: "border-archive-success-border bg-archive-success-bg text-archive-success",
  },
  failed: {
    dark: "border-red-500/30 bg-red-500/10 text-red-200",
    archival: "border-red-500/30 bg-red-500/10 text-red-200",
  },
};

export function StatusBadge({
  status,
  variant = "dark",
}: {
  status: ProjectStatus;
  variant?: "dark" | "archival";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status][variant]}`}
    >
      {status === "live" && (
        <span
          className={`mr-1.5 h-1.5 w-1.5 rounded-full ${variant === "archival" ? "bg-archive-success" : "bg-emerald-400"}`}
          aria-hidden
        />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}
