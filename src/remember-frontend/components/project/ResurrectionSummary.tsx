import { Check, ExternalLink } from "lucide-react";
import type { ResurrectionManifest } from "../../types/projectDetail";

type ResurrectionSummaryProps = {
  manifest: ResurrectionManifest;
  owner: string;
  name: string;
};

export function ResurrectionSummary({ manifest, owner, name }: ResurrectionSummaryProps) {
  return (
    <div className="border-t border-archive-border p-4 sm:p-5">
      <p className="accession-label">What we reconstructed</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="specimen-card rounded-lg p-3">
          <p className="text-[10px] text-archive-muted">Framework</p>
          <p className="mt-1 text-sm font-medium text-archive-ink">{manifest.framework}</p>
        </div>
        <div className="specimen-card rounded-lg p-3">
          <p className="text-[10px] text-archive-muted">Runtime</p>
          <p className="mt-1 text-sm font-medium text-archive-ink">{manifest.runtime}</p>
        </div>
        <div className="specimen-card rounded-lg p-3">
          <p className="text-[10px] text-archive-muted">Package manager</p>
          <p className="mt-1 text-sm font-medium text-archive-ink">{manifest.packageManager}</p>
        </div>
        <div className="specimen-card rounded-lg p-3">
          <p className="text-[10px] text-archive-muted">Repair attempts</p>
          <p className="mt-1 text-sm font-medium text-archive-ink">{manifest.repairAttempts}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="rounded-lg border border-archive-border bg-archive-bg-deep px-3 py-2">
          <p className="text-[10px] text-archive-muted">Install</p>
          <p className="mt-0.5 font-mono text-xs text-archive-ink">{manifest.installCommand}</p>
        </div>
        <div className="rounded-lg border border-archive-border bg-archive-bg-deep px-3 py-2">
          <p className="text-[10px] text-archive-muted">Start</p>
          <p className="mt-0.5 font-mono text-xs text-archive-ink">{manifest.startCommand}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="accession-label">What we repaired</p>
        <p className="mt-2 text-sm text-archive-muted">
          Winner: strategy {manifest.winnerLane} — {manifest.winnerTitle}
        </p>
        <ul className="mt-3 space-y-1.5 text-xs text-archive-muted">
          <li>
            {manifest.environmentAdjustments} environment adjustment
            {manifest.environmentAdjustments !== 1 ? "s" : ""}
          </li>
          <li>
            {manifest.sourceFilesModified} source file
            {manifest.sourceFilesModified !== 1 ? "s" : ""} modified
          </li>
        </ul>
        {manifest.changedFiles.length > 0 && (
          <ul className="mt-2 space-y-1">
            {manifest.changedFiles.map((f) => (
              <li key={f} className="font-mono text-[10px] text-archive-faint">
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5">
        <p className="accession-label">Verification</p>
        <ul className="mt-3 space-y-2">
          {["Process verification", "HTTP verification", "Visual render check"].map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-xs text-archive-success"
            >
              <Check className="h-3.5 w-3.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <a
        href={`https://github.com/${owner}/${name}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex items-center gap-1 text-xs text-archive-muted transition-colors hover:text-archive-ink"
      >
        View source repository
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
