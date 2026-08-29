import { ArrowRight, FileCode } from "lucide-react";
import type { RepairLane } from "../../types/projectDetail";
import { formatElapsed } from "../../data/projectDetail";

const ACCENT_STYLES: Record<
  RepairLane["accent"],
  { border: string; bg: string; dot: string; text: string }
> = {
  emerald: {
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/[0.06]",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
  },
  amber: {
    border: "border-amber-500/25",
    bg: "bg-amber-500/[0.06]",
    dot: "bg-amber-400",
    text: "text-amber-300",
  },
  red: {
    border: "border-red-500/25",
    bg: "bg-red-500/[0.06]",
    dot: "bg-red-400",
    text: "text-red-300",
  },
};

function RepairLaneCard({ lane }: { lane: RepairLane }) {
  const accent = ACCENT_STYLES[lane.accent];

  return (
    <article
      data-animate="repair-lane"
      className={`flex flex-col rounded-xl border ${accent.border} ${accent.bg} p-4 transition-colors`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accent.dot}`} />
          <h3 className="text-sm font-semibold text-white">{lane.title}</h3>
        </div>
        <span className={`text-xs font-medium ${accent.text}`}>{lane.statusLabel}</span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/50">{lane.hypothesis}</p>

      <div className="mt-4 space-y-1.5">
        {lane.changedFiles.map((file) => (
          <div key={file} className="flex items-center gap-2 text-xs text-white/60">
            <FileCode className="h-3 w-3 shrink-0 text-white/30" />
            <span className="font-mono">{file}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-white/10 pt-3">
        <p className="font-mono text-[10px] text-white/40">{lane.footerStatus}</p>
      </div>
    </article>
  );
}

type RepairRacePanelProps = {
  snapshotHash: string;
  lanes: RepairLane[];
  elapsedSeconds: number;
  estimatedSeconds: number;
  isEvaluating: boolean;
};

export function RepairRacePanel({
  snapshotHash,
  lanes,
  elapsedSeconds,
  estimatedSeconds,
  isEvaluating,
}: RepairRacePanelProps) {
  const progress = Math.min(100, Math.round((elapsedSeconds / estimatedSeconds) * 100));

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <p className="text-[10px] font-medium text-white/40">
          Repair strategy
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6">
        {/* Snapshot node */}
        <div className="flex flex-col items-center">
          <div
            data-animate="snapshot"
            className="w-full max-w-xs rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center"
          >
            <p className="text-[10px] text-white/40">
              Pristine snapshot
            </p>
            <p className="mt-1 font-mono text-sm text-white/80">commit {snapshotHash}</p>
            <span className="mt-2 inline-block rounded border border-white/10 px-2 py-0.5 text-[10px] text-white/40">
              Read-only
            </span>
          </div>

          <div className="my-4 flex flex-col items-center gap-1 text-white/20">
            <span className="h-6 w-px bg-white/15" />
            <ArrowRight className="h-4 w-4 rotate-90" />
            <span className="h-6 w-px bg-white/15" />
          </div>
        </div>

        {/* Parallel lanes */}
        <div className="grid gap-4 lg:grid-cols-3">
          {lanes.map((lane) => (
            <RepairLaneCard key={lane.id} lane={lane} />
          ))}
        </div>
      </div>

      {/* Status footer */}
      <div className="border-t border-white/10 bg-[#050505] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-10 w-10">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="rgb(255 255 255 / 0.08)"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="rgb(255 255 255 / 0.5)"
                  strokeWidth="2"
                  strokeDasharray={`${progress} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-white/60">
                {progress}%
              </span>
            </div>
            <div>
              <p className="text-sm text-white/80">
                {isEvaluating
                  ? "Evaluating three isolated repairs"
                  : "Repair race complete"}
              </p>
              <button
                type="button"
                className="mt-0.5 text-xs text-white/40 underline-offset-2 hover:text-white/60 hover:underline"
              >
                View logs
              </button>
            </div>
          </div>
          <p className="font-mono text-xs text-white/40">
            {formatElapsed(elapsedSeconds)} elapsed
            {isEvaluating && ` · ~${formatElapsed(estimatedSeconds - elapsedSeconds)} left`}
          </p>
        </div>
      </div>
    </div>
  );
}
