import {
  ArrowRight,
  Box,
  Cpu,
  GitBranch,
  MonitorPlay,
  Sparkles,
  Wrench,
} from "lucide-react";

const FLOW_NODES = [
  { id: "github", label: "GitHub repo", icon: GitBranch },
  { id: "remember", label: "Remember", icon: Sparkles },
  { id: "daytona", label: "Daytona", icon: Box },
  { id: "clone", label: "Clone", icon: GitBranch },
  { id: "nosana", label: "Nosana", icon: Cpu },
  { id: "repair", label: "Repair agents", icon: Wrench },
  { id: "live", label: "Live preview", icon: MonitorPlay },
] as const;

type OrchestrationFlowDiagramProps = {
  /** 0–5: cumulative step index; nodes at or before this index light up. */
  activeStep: number;
  className?: string;
};

function nodeState(index: number, activeStep: number): "pending" | "active" | "complete" {
  if (index < activeStep) return "complete";
  if (index === activeStep) return "active";
  return "pending";
}

const NODE_STYLES = {
  pending: {
    ring: "border-archive-border bg-white/[0.03] text-archive-faint",
    label: "text-archive-faint",
    connector: "bg-archive-border/60",
  },
  active: {
    ring: "border-amber-400/50 bg-amber-400/10 text-amber-300 shadow-[0_0_24px_rgb(251_191_36/0.12)]",
    label: "text-amber-200",
    connector: "bg-gradient-to-r from-amber-400/40 to-archive-border/60",
  },
  complete: {
    ring: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    label: "text-emerald-200/90",
    connector: "bg-emerald-500/35",
  },
} as const;

export function OrchestrationFlowDiagram({
  activeStep,
  className = "",
}: OrchestrationFlowDiagramProps) {
  const clampedStep = Math.max(0, Math.min(FLOW_NODES.length - 1, activeStep));

  return (
    <div className={`glass-panel rounded-sm p-4 sm:p-5 ${className}`}>
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-archive-muted">
        Orchestration flow
      </p>

      <div className="mt-4 hidden lg:flex lg:items-center lg:gap-0">
        {FLOW_NODES.map((node, index) => {
          const state = nodeState(index, clampedStep);
          const styles = NODE_STYLES[state];
          const Icon = node.icon;
          const isLast = index === FLOW_NODES.length - 1;

          return (
            <div key={node.id} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-col items-center gap-2">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-500 ${styles.ring}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`max-w-[5.5rem] text-center text-[10px] font-medium leading-tight ${styles.label}`}
                >
                  {node.label}
                </span>
              </div>
              {!isLast && (
                <div className="mx-1 flex h-10 flex-1 items-center">
                  <div className={`h-px w-full transition-colors duration-500 ${styles.connector}`} />
                  <ArrowRight className="mx-0.5 h-3 w-3 shrink-0 text-archive-faint/70" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:hidden">
        {FLOW_NODES.map((node, index) => {
          const state = nodeState(index, clampedStep);
          const styles = NODE_STYLES[state];
          const Icon = node.icon;

          return (
            <div key={node.id} className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-500 ${styles.ring}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className={`text-xs font-medium ${styles.label}`}>{node.label}</span>
              {state === "active" && (
                <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              )}
              {state === "complete" && (
                <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-emerald-400/80">
                  Done
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
