import { ArrowRight } from "lucide-react";
import type { RecommendedRepo } from "../types/dashboard";

type RepoCardProps = {
  repo: RecommendedRepo;
  onSelect: (repo: RecommendedRepo) => void;
};

function RepoThumbnail({
  owner,
  name,
  imageUrl,
}: {
  owner: string;
  name: string;
  imageUrl: string;
}) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
      <img
        src={imageUrl}
        alt={`${owner}/${name} preview`}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="font-mono text-[10px] tracking-wide text-white/60">Archive preview</p>
        <p className="mt-1 text-sm font-medium text-white">
          {owner}/{name}
        </p>
      </div>
    </div>
  );
}

export function RepoCard({ repo, onSelect }: RepoCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(repo)}
      className="specimen-card group flex w-full flex-col rounded-2xl p-4 text-left transition-colors hover:border-archive-border-strong"
    >
      <RepoThumbnail owner={repo.owner} name={repo.name} imageUrl={repo.imageUrl} />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-archive-ink">
            {repo.owner}/{repo.name}
          </h3>
          <p className="mt-1 text-sm text-archive-muted">
            {repo.language} · last commit {repo.lastCommitYear}
          </p>
        </div>
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-archive-faint transition-transform group-hover:translate-x-0.5 group-hover:text-archive-ink" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {repo.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-archive-border px-2 py-0.5 text-[10px] font-medium text-archive-muted"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}
