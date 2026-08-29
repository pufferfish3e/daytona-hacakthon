import { Link } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { StatusBadge } from "../components/StatusBadge";
import { SectionLabel } from "../components/SectionLabel";
import { useProjects } from "../context/ProjectsContext";

export function ProjectListPage() {
  const { projects } = useProjects();

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <SectionLabel variant="archival">Workspace</SectionLabel>
        <h1 className="mt-2 text-2xl font-semibold text-archive-ink">Resurrection runs</h1>
        <p className="mt-2 text-sm text-archive-muted">
          Select a project to view the repair race or completed prototype.
        </p>

        {projects.length === 0 ? (
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
          <ul className="mt-8 space-y-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/create/generated/${p.id}`}
                  className="specimen-card flex items-center justify-between rounded-xl px-4 py-4 transition-colors hover:border-archive-border-strong"
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
      </div>
    </DashboardShell>
  );
}
