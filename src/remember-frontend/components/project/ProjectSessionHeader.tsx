import { Link } from "react-router-dom";
import { Pause, Wrench } from "lucide-react";
import { Logo } from "../Logo";
import { PRODUCT_NAME } from "../../constants";

type ProjectSessionHeaderProps = {
  sessionId: string;
  isLive: boolean;
  projectLabel: string;
};

export function ProjectSessionHeader({
  sessionId,
  isLive,
  projectLabel,
}: ProjectSessionHeaderProps) {
  return (
    <header
      data-animate="project-header"
      className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#050505] px-4 py-3 sm:px-6"
    >
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 text-white/60 transition-colors hover:text-white">
          <Logo className="h-5 w-5 fill-white/80" />
          <span className="hidden text-sm font-semibold sm:inline">{PRODUCT_NAME}</span>
        </Link>
        <div className="hidden h-4 w-px bg-white/10 sm:block" />
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-white/50" />
          <span className="text-xs font-medium text-white/70">
            Project resurrection
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {isLive && (
          <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            <span className="text-[10px] font-medium text-amber-200">
              Live repair race
            </span>
          </div>
        )}
        <span className="hidden font-mono text-xs text-white/40 sm:inline">{projectLabel}</span>
        <span className="font-mono text-xs text-white/50">
          Session <span className="text-white/70">{sessionId}</span>
        </span>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-white/20 hover:text-white"
        >
          <Pause className="h-3 w-3" />
          <span className="hidden sm:inline">Pause</span>
        </button>
      </div>
    </header>
  );
}
