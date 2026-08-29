import { ArrowRight, FileCode } from "lucide-react";
import type { Invasiveness, RepairLane } from "../../types/projectDetail";
import { formatElapsed } from "../../data/projectDetail";

const INVASIVENESS_LABELS: Record<Invasiveness, string> = {
  environment: "Environment",
  dependency: "Dependency",
  source: "Source",
  config: "Config",
};

const LANE_STYLES: Record<
  RepairLane["accent"],
  { border: string; bg: string; letter: string; text: string }
> = {
  emerald: {
    border: "border-archive-success-border",
    bg: "bg-archive-success-bg/50",
    letter: "bg-archive-success text-white",
    text: "text-archive-success",
  },
  amber: {
    border: "border-amber-500/25",
    bg: "bg-amber-500/[0.06]",
    letter: "bg-amber-500 text-white",
    text: "text-amber-300",
  },
  red: {
    border: "border-red-500/25",
    bg: "bg-red-500/[0.06]",
    letter: "bg-red-500 text-white",
    text: "text-red-300",
  },
};

function RepairLaneCard({ lane }: { lane: RepairLane }) {
  const style = LANE_STYLES[lane.accent];
  const isWinner = lane.status === "passed";
  const isFailed = lane.status === "failed";
  const isRunning = ["repairing", "verifying"].includes(lane.status);

  return (
    <article
      data-animate="repair-lane"
      data-testid="repair-attempt"
      className={`specimen-card flex flex-col p-4 transition-all ${
        isWinner ? "ring-2 ring-archive-success/30" : ""
      } ${isFailed ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${style.letter}`}
          >
            {lane.laneLetter}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-archive-ink">{lane.title}</h3>
            <span className="mt-0.5 inline-block rounded border border-archive-border px-1.5 py-0.5 text-[10px] text-archive-muted">
              {INVASIVENESS_LABELS[lane.invasiveness]}
            </span>
          </div>
        </div>
        <span className={`text-xs font-medium ${style.text}`}>
          {isRunning && "● "}
          {lane.statusLabel}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-archive-muted">{lane.hypothesis}</p>

      {lane.changedFiles.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {lane.changedFiles.map((file) => (
            <div key={file} className="flex items-center gap-2 text-xs text-archive-muted">
              <FileCode className="h-3 w-3 shrink-0 text-archive-faint" />
              <span className="font-mono">{file}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto border-t border-archive-border pt-3">
        <p className="font-mono text-[10px] text-archive-faint">{lane.footerStatus}</p>
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
    <div className="flex h-full flex-col overflow-hidden bg-archive-bg">
      <div className="border-b border-archive-border px-5 py-4 sm:px-6">
        <p className="accession-label">Repair strategy</p>
        {isEvaluating && (
          <p className="mt-1 text-sm font-medium text-archive-ink">Resurrecting</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6">
        <div className="flex flex-col items-center">
          <div
            data-animate="snapshot"
            className="specimen-card w-full max-w-xs p-4 text-center"
          >
            <p className="accession-label">Clean snapshot S0</p>
            <p className="mt-1 font-mono text-sm text-archive-ink">commit {snapshotHash}</p>
            <span className="mt-2 inline-block rounded border border-archive-border px-2 py-0.5 text-[10px] text-archive-muted">
              Read-only
            </span>
          </div>

          <div className="my-4 flex flex-col items-center gap-1 text-archive-faint">
            <span className="h-6 w-px bg-archive-border" />
            <ArrowRight className="h-4 w-4 rotate-90" />
            <span className="h-6 w-px bg-archive-border" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {lanes.map((lane) => (
            <RepairLaneCard key={lane.id} lane={lane} />
          ))}
        </div>
      </div>

      <div className="border-t border-archive-border bg-archive-bg-deep px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-10 w-10">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="var(--archive-border)"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="var(--archive-ink)"
                  strokeWidth="2"
                  strokeDasharray={`${progress} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-archive-muted">
                {progress}%
              </span>
            </div>
            <div>
              <p className="text-sm text-archive-ink">
                {isEvaluating
                  ? "Evaluating three isolated repairs"
                  : "Repair race complete"}
              </p>
              <details className="mt-0.5">
                <summary className="cursor-pointer text-xs text-archive-muted hover:text-archive-ink">
                  View technical logs
                </summary>
                <p className="mt-2 font-mono text-[10px] leading-relaxed text-archive-faint">
                  Fork A: verifying Node runtime…
                  <br />
                  Fork B: npm install --legacy-peer-deps…
                  <br />
                  Fork C: patching src/styles/main.scss…
                </p>
              </details>
            </div>
          </div>
          <p className="font-mono text-xs text-archive-muted">
            {formatElapsed(elapsedSeconds)} elapsed
            {isEvaluating && ` · ~${formatElapsed(estimatedSeconds - elapsedSeconds)} left`}
          </p>
        </div>
      </div>
    </div>
  );
}
