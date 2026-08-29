import { Link } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { StatusBadge } from "../components/StatusBadge";
import { CtaButton } from "../components/CtaButton";
import { useProjects } from "../context/ProjectsContext";

export function ProjectListPage() {
  const { projects } = useProjects();

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="text-2xl font-semibold text-white">Workspace</h1>
        <p className="mt-2 text-sm text-white/50">Select a project to view the repair race.</p>

        {projects.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-white/40">No projects yet.</p>
            <CtaButton to="/create" label="Discover repos" className="mt-6" />
          </div>
        ) : (
          <ul className="mt-8 space-y-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/create/generated/${p.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div>
                    <p className="font-medium text-white">
                      {p.owner}/{p.name}
                    </p>
                    <p className="mt-0.5 text-xs text-white/40">{p.language}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
