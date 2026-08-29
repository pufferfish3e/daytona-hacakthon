import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { Project } from "../types/dashboard";

type ProjectSidebarProps = {
  projects: Project[];
  activeId?: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ProjectSidebar({ projects, activeId }: ProjectSidebarProps) {
  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-[#0a0a0a]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <p className="text-xs font-medium text-white/50">
          Projects
        </p>
        <Link
          to="/create"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-white/20 hover:text-white"
          aria-label="Create project"
        >
          <Plus className="h-3.5 w-3.5" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {projects.length === 0 ? (
          <p className="px-2 py-4 text-sm text-white/40">No projects yet.</p>
        ) : (
          <ul className="space-y-1">
            {projects.map((project) => {
              const isActive = project.id === activeId;
              return (
                <li key={project.id}>
                  <Link
                    to={`/create/generated/${project.id}`}
                    className={`block rounded-xl border px-3 py-3 transition-colors ${
                      isActive
                        ? "border-white/20 bg-white/[0.06]"
                        : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium text-white">
                        {project.owner}/{project.name}
                      </p>
                      <StatusBadge status={project.status} />
                    </div>
                    <p className="mt-1 text-xs text-white/40">
                      {project.language} · {timeAgo(project.createdAt)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
