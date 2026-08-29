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
import { useCreatePageAnimations } from "../hooks/useCreatePageAnimations";

export function CreatePage() {
  const navigate = useNavigate();
  const { projects, createFromUrl, createFromRepo } = useProjects();
  const [query, setQuery] = useState("");
  const [urlError, setUrlError] = useState("");
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

  function handleUrlSubmit(url: string) {
    if (!parseGitHubUrl(url)) {
      setUrlError("Enter a valid GitHub URL (e.g. github.com/owner/repo).");
      return;
    }
    setUrlError("");
    const project = createFromUrl(url);
    if (project) navigate(`/create/generated/${project.id}`);
  }

  function handleRepoSelect(repo: (typeof RECOMMENDED_REPOS)[0]) {
    const project = createFromRepo(repo.owner, repo.name, repo.language, repo.thumbnailHue);
    navigate(`/create/generated/${project.id}`);
  }

  return (
    <DashboardShell>
      <div ref={rootRef} className="flex min-h-[calc(100vh-65px)] flex-col">
        <section className="flex flex-1 flex-col items-center justify-center px-5 py-16 sm:px-8">
          <div className="w-full max-w-2xl text-center">
            <div data-animate="hero">
              <SectionLabel className="text-center">Discover</SectionLabel>
            </div>
            <h1
              data-animate="hero"
              className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Find a repo worth <span className="italic">remembering</span>
            </h1>
            <p
              data-animate="hero"
              className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/60"
            >
              Paste a dormant GitHub URL or pick from the archive. Remember rebuilds it in
              isolation and turns it into a prototype anyone can click through.
            </p>

            <div data-animate="hero" className="mx-auto mt-10 max-w-xl">
              <RepoUrlInput onSubmit={handleUrlSubmit} />
              {urlError && <p className="mt-2 text-sm text-red-400">{urlError}</p>}
            </div>
          </div>
        </section>

        <section
          data-animate="grid-section"
          className="border-t border-white/10 px-5 py-14 sm:px-8 lg:px-12"
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="text-center sm:text-left">
                <SectionLabel>Recommended</SectionLabel>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Archived repos worth reviving
                </h2>
              </div>
              <div className="relative mx-auto w-full sm:mx-0 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search repos…"
                  className="w-full rounded-full border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/20"
                />
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((repo) => (
                <div key={repo.id} data-animate="repo-card">
                  <RepoCard repo={repo} onSelect={handleRepoSelect} />
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-white/40">
                No repos match &ldquo;{query}&rdquo;.
              </p>
            )}

            {projects.length > 0 && (
              <div data-animate="recent" className="mt-16 border-t border-white/10 pt-12">
                <SectionLabel>Recently remembered</SectionLabel>
                <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
                  {projects.slice(0, 6).map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => navigate(`/create/generated/${project.id}`)}
                      className="flex min-w-[200px] flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-white/20"
                    >
                      <p className="truncate text-sm font-medium text-white">
                        {project.owner}/{project.name}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={project.status} />
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
