import { GitBranch, ExternalLink } from "lucide-react";
import type { Project } from "../../types/dashboard";
import type { ProjectDetail } from "../../types/projectDetail";

type RepoSubmittedPanelProps = {
  project: Project;
  detail: ProjectDetail;
};

export function RepoSubmittedPanel({ project, detail }: RepoSubmittedPanelProps) {
  return (
    <div className="border-b border-archive-border p-4 sm:p-5">
      <p className="accession-label">Submitted repository</p>
      <div className="mt-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-archive-border bg-archive-bg-deep">
          <GitBranch className="h-4 w-4 text-archive-muted" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-archive-ink">
            {project.owner}/{project.name}
          </p>
          <p className="mt-0.5 text-xs text-archive-muted">{detail.visibility} repository</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {detail.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-archive-border px-1.5 py-0.5 text-[10px] text-archive-muted"
              >
                {tag}
              </span>
            ))}
            {detail.inactiveYears && (
              <span className="rounded border border-archive-border px-1.5 py-0.5 text-[10px] text-archive-muted">
                Last active {Math.round(detail.inactiveYears)} yrs ago
              </span>
            )}
          </div>
        </div>
        <a
          href={project.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-archive-faint transition-colors hover:text-archive-ink"
          aria-label="Open on GitHub"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
