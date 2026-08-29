import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { DashboardShell } from "../components/DashboardShell";
import { RepoUrlInput } from "../components/RepoUrlInput";
import { RepoCard } from "../components/RepoCard";
import { SectionLabel } from "../components/SectionLabel";
import { StatusBadge } from "../components/StatusBadge";
import { RECOMMENDED_REPOS, parseGitHubUrl } from "../data/mock";
import { useProjects } from "../context/ProjectsContext";
import {
  createHeroDemoProject,
  isHeroSpecimenEnabled,
  isHeroDemoProject,
  isPreparedSpecimenRepo,
  splitHeroFromProjects,
} from "../lib/demo-presentation";
import type { Project } from "../types/dashboard";
import { useCreatePageAnimations } from "../hooks/useCreatePageAnimations";

export function CreatePage() {
  const navigate = useNavigate();
  const { projects, createFromUrl, createFromRepo, openPreparedDemoProject, apiError, clearApiError } =
    useProjects();
  const [query, setQuery] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rootRef = useCreatePageAnimations();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RECOMMENDED_REPOS;
    return RECOMMENDED_REPOS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.owner.toLowerCase().includes(q) ||
        r.language.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query]);

  const { live: liveProjects, hero: preparedHero } = useMemo(() => {
    const split = splitHeroFromProjects(projects);
    const hero =
      split.hero ?? (isHeroSpecimenEnabled() ? createHeroDemoProject() : undefined);
    return { live: split.live, hero };
  }, [projects]);

  const recentProjects = useMemo(() => {
    const recentLive = liveProjects.slice(0, 5);
    return preparedHero ? [...recentLive, preparedHero] : recentLive;
  }, [liveProjects, preparedHero]);

  async function handleUrlSubmit(url: string) {
    if (!parseGitHubUrl(url)) {
      setUrlError("Enter a valid GitHub URL (e.g. github.com/owner/repo).");
      return;
    }
    setUrlError("");
    clearApiError();
    setIsSubmitting(true);
    try {
      const project = await createFromUrl(url);
      if (project) navigate(`/create/generated/${project.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openPreparedSpecimen() {
    const project = openPreparedDemoProject();
    navigate(`/create/generated/${project.id}`);
  }

  async function handleRepoSelect(repo: (typeof RECOMMENDED_REPOS)[0]) {
    if (isPreparedSpecimenRepo(repo.owner, repo.name)) {
      openPreparedSpecimen();
      return;
    }

    clearApiError();
    setIsSubmitting(true);
    try {
      const project = await createFromRepo(repo.owner, repo.name, repo.language, repo.thumbnailHue);
      navigate(`/create/generated/${project.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRecentProjectSelect(project: Project) {
    if (isHeroDemoProject(project)) {
      openPreparedSpecimen();
      return;
    }
    navigate(`/create/generated/${project.id}`);
  }

  return (
    <DashboardShell>
      <div ref={rootRef} className="flex min-h-[calc(100vh-65px)] flex-col">
        <section className="flex flex-1 flex-col items-center justify-center px-5 py-16 sm:px-8">
          <div className="w-full max-w-2xl text-center">
            <div data-animate="hero">
              <SectionLabel variant="archival" className="text-center">
                Project resurrection
              </SectionLabel>
            </div>
            <h1
              data-animate="hero"
              className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-archive-ink sm:text-4xl lg:text-5xl"
            >
              Bring software back to <span className="italic">life</span>
            </h1>
            <p
              data-animate="hero"
              className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-archive-muted"
            >
              Paste a dormant GitHub project. We safely reconstruct its environment, repair what
              is necessary, and turn it back into something you can experience.
            </p>
            <p
              data-animate="hero"
              className="mx-auto mt-3 max-w-md text-sm text-archive-faint"
            >
              We preserve software as software — not screenshots and dead links.
            </p>

            <div data-animate="hero" className="mx-auto mt-10 max-w-xl">
              <RepoUrlInput
                onSubmit={(url) => void handleUrlSubmit(url)}
                buttonLabel={isSubmitting ? "Starting…" : "Resurrect project"}
                variant="dark"
              />
              {(urlError || apiError) && (
                <p className="mt-2 text-sm text-red-400">{urlError || apiError}</p>
              )}
            </div>
          </div>
        </section>

        <section
          data-animate="grid-section"
          className="border-t border-archive-border px-5 py-14 sm:px-8 lg:px-12"
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="text-center sm:text-left">
                <SectionLabel variant="archival">Archive specimens</SectionLabel>
                <h2 className="mt-2 text-xl font-semibold text-archive-ink">
                  Dormant repos worth reviving
                </h2>
              </div>
              <div className="relative mx-auto w-full sm:mx-0 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-archive-faint" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search repos…"
                  className="glass-input-shell w-full py-2.5 pl-10 pr-4 text-sm text-archive-ink placeholder:text-archive-faint outline-none transition-colors focus:border-white/20"
                />
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((repo) => (
                <div key={repo.id} data-animate="repo-card">
                  <RepoCard
                    repo={repo}
                    onSelect={handleRepoSelect}
                    prepared={isPreparedSpecimenRepo(repo.owner, repo.name)}
                  />
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-archive-muted">
                No repos match &ldquo;{query}&rdquo;.
              </p>
            )}

            {(recentProjects.length > 0 || preparedHero) && (
              <div data-animate="recent" className="mt-16 border-t border-archive-border pt-12">
                <SectionLabel variant="archival">Recently resurrected</SectionLabel>
                <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                  {recentProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleRecentProjectSelect(project)}
                      className="specimen-card flex min-w-[200px] flex-col p-4 text-left transition-colors"
                    >
                      <p className="truncate text-sm font-medium text-archive-ink">
                        {project.owner}/{project.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={project.status} variant="archival" />
                        {isHeroDemoProject(project) && (
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                            Prepared iframe
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
