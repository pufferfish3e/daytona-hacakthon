import { ExternalLink, GitBranch } from "lucide-react";
import type { Project } from "../../types/dashboard";
import type { ProjectDetail } from "../../types/projectDetail";

type RepoSubmittedPanelProps = {
  project: Project;
  detail: ProjectDetail;
};

export function RepoSubmittedPanel({ project, detail }: RepoSubmittedPanelProps) {
  return (
    <div className="border-b border-white/10 p-4 sm:p-5">
      <p className="text-[10px] font-medium text-white/40">
        Submitted repository
      </p>
      <div className="mt-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
          <GitBranch className="h-4 w-4 text-white/60" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {project.owner}/{project.name}
          </p>
          <p className="mt-0.5 text-xs text-white/40">{detail.visibility} repository</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {detail.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/50"
              >
                {tag}
              </span>
            ))}
            {detail.inactiveYears && (
              <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
                {detail.inactiveYears} yrs inactive
              </span>
            )}
          </div>
        </div>
        <a
          href={project.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-white/30 transition-colors hover:text-white/70"
          aria-label="Open on GitHub"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
