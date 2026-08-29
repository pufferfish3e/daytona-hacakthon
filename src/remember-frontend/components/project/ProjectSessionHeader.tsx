import { Link } from "react-router-dom";
import { Pause } from "lucide-react";
import { Logo } from "../Logo";
import { PRODUCT_NAME } from "../../constants";

type ProjectSessionHeaderProps = {
  sessionId: string;
  statusLabel: string;
  statusTone?: "progress" | "success" | "idle";
  projectLabel: string;
  showPause?: boolean;
};

export function ProjectSessionHeader({
  sessionId,
  statusLabel,
  statusTone = "idle",
  projectLabel,
  showPause = true,
}: ProjectSessionHeaderProps) {
  const statusStyles = {
    progress: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    success: "border-archive-success-border bg-archive-success-bg text-archive-success",
    idle: "border-archive-border bg-white/[0.04] text-archive-muted",
  };

  return (
    <header
      data-animate="project-header"
      className="glass-header flex shrink-0 items-center justify-between px-4 py-3 sm:px-6"
    >
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-archive-muted transition-colors hover:text-archive-ink"
        >
          <Logo className="h-5 w-5 fill-archive-ink/80" />
          <span className="hidden text-sm font-semibold sm:inline">{PRODUCT_NAME}</span>
        </Link>
        <div className="hidden h-4 w-px bg-archive-border sm:block" />
        <span className="accession-label hidden sm:inline">Accession {sessionId}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1 ${statusStyles[statusTone]}`}
        >
          {statusTone === "progress" && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          )}
          {statusTone === "success" && (
            <span className="h-1.5 w-1.5 rounded-full bg-archive-success" />
          )}
          <span className="text-xs font-medium">{statusLabel}</span>
        </div>
        <span className="hidden font-mono text-xs text-archive-faint sm:inline">
          {projectLabel}
        </span>
        {showPause && (
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-archive-border px-3 py-1.5 text-xs text-archive-muted transition-colors hover:border-archive-border-strong hover:text-archive-ink"
          >
            <Pause className="h-3 w-3" />
            <span className="hidden sm:inline">Pause</span>
          </button>
        )}
      </div>
    </header>
  );
}
