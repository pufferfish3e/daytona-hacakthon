import { STATUS_LABELS } from "../constants";
import type { ProjectStatus } from "../types/dashboard";

const STATUS_STYLES: Record<ProjectStatus, string> = {
  ingesting: "border-white/20 bg-white/10 text-white/80",
  repairing: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  isolating: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  live: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  failed: "border-red-500/30 bg-red-500/10 text-red-200",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status === "live" && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}
