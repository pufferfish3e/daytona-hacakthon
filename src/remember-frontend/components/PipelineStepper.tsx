import { PIPELINE_STEPS } from "../constants";
import type { ProjectStatus } from "../types/dashboard";

type PipelineStepperProps = {
  status: ProjectStatus;
  compact?: boolean;
};

const STATUS_TO_STEP: Record<ProjectStatus, number> = {
  ingesting: 0,
  repairing: 1,
  isolating: 2,
  live: 3,
  failed: -1,
};

export function PipelineStepper({ status, compact = false }: PipelineStepperProps) {
  const activeIdx = STATUS_TO_STEP[status];

  return (
    <ol className={`flex ${compact ? "gap-2" : "gap-3 sm:gap-4"}`}>
      {PIPELINE_STEPS.map((step, idx) => {
        const isComplete = activeIdx > idx;
        const isActive = activeIdx === idx;
        const isFailed = status === "failed";

        return (
          <li
            key={step.key}
            className={`flex flex-1 flex-col ${compact ? "min-w-0" : ""}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`name-stat-number shrink-0 text-xs ${
                  isComplete || isActive
                    ? "text-white"
                    : isFailed && idx === 0
                      ? "text-red-400"
                      : "text-white/25"
                }`}
              >
                {step.num}
              </span>
              <div
                className={`h-px flex-1 ${
                  isComplete ? "bg-white/40" : "bg-white/10"
                }`}
              />
            </div>
            {!compact && (
              <>
                <p
                  className={`mt-2 text-sm font-medium ${
                    isActive ? "text-white" : isComplete ? "text-white/70" : "text-white/35"
                  }`}
                >
                  {step.title}
                </p>
                <p className="mt-0.5 hidden text-xs leading-relaxed text-white/40 sm:block">
                  {step.body}
                </p>
              </>
            )}
            {compact && (
              <p
                className={`mt-1 truncate text-xs font-medium ${
                  isActive ? "text-white" : "text-white/35"
                }`}
              >
                {step.title}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
