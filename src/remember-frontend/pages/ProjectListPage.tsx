import { Link } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { StatusBadge } from "../components/StatusBadge";
import { SectionLabel } from "../components/SectionLabel";
import { useProjects } from "../context/ProjectsContext";
import {
  createHeroDemoProject,
  isHeroSpecimenEnabled,
  splitHeroFromProjects,
} from "../lib/demo-presentation";

export function ProjectListPage() {
  const { projects, openPreparedDemoProject } = useProjects();
  const { live, hero } = splitHeroFromProjects(projects);
  const preparedHero =
    hero ?? (isHeroSpecimenEnabled() ? createHeroDemoProject() : undefined);
  const hasAny = live.length > 0 || Boolean(preparedHero);

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <SectionLabel variant="archival">Workspace</SectionLabel>
        <h1 className="mt-2 text-2xl font-semibold text-archive-ink">Resurrection runs</h1>
        <p className="mt-2 text-sm text-archive-muted">
          Live Daytona runs appear above. The prepared specimen at the bottom uses the local iframe
          preview.
        </p>

        {!hasAny ? (
          <div className="mt-12 text-center">
            <p className="text-archive-muted">No projects yet.</p>
            <Link
              to="/create"
              className="archive-cta mt-6 inline-flex rounded-full px-6 py-2.5 text-sm font-medium"
            >
              Resurrect project
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {live.length > 0 && (
              <ul className="space-y-2">
                {live.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/create/generated/${p.id}`}
                      className="specimen-card flex items-center justify-between px-4 py-4 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-archive-ink">
                          {p.owner}/{p.name}
                        </p>
                        <p className="mt-0.5 text-xs text-archive-muted">{p.language}</p>
                      </div>
                      <StatusBadge status={p.status} variant="archival" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {preparedHero && (
              <div>
                <SectionLabel variant="archival">Prepared specimen</SectionLabel>
                <p className="mt-1 text-xs text-archive-faint">
                  Already resurrected — opens the live Bonky Inu workspace instantly.
                </p>
                <ul className="mt-3 space-y-2">
                  <li>
                    <Link
                      to={`/create/generated/${preparedHero.id}`}
                      onClick={() => openPreparedDemoProject()}
                      className="specimen-card flex items-center justify-between px-4 py-4 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-archive-ink">
                          {preparedHero.owner}/{preparedHero.name}
                          <span className="ml-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                            Prepared
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-archive-muted">
                          {preparedHero.language} · local embed preview
                        </p>
                      </div>
                      <StatusBadge status={preparedHero.status} variant="archival" />
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
