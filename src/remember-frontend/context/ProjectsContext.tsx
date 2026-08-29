import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createProjectFromUrl,
  DEMO_PROJECTS,
  logsForStatus,
  parseGitHubUrl,
} from "../data/mock";
import type { Project, ProjectStatus } from "../types/dashboard";

const STORAGE_KEY = "remember-projects";

type ProjectsContextValue = {
  projects: Project[];
  createFromUrl: (url: string, language?: string, thumbnailHue?: number) => Project | null;
  createFromRepo: (
    owner: string,
    name: string,
    language: string,
    thumbnailHue?: number,
  ) => Project;
  advanceProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

const STATUS_ORDER: ProjectStatus[] = ["ingesting", "repairing", "isolating", "live"];

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Project[];
  } catch {
    /* use defaults */
  }
  return DEMO_PROJECTS;
}

function persistProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(loadProjects);

  useEffect(() => {
    persistProjects(projects);
  }, [projects]);

  const createFromUrl = useCallback(
    (url: string, language = "Unknown", thumbnailHue?: number) => {
      const parsed = parseGitHubUrl(url);
      if (!parsed) return null;
      const project = createProjectFromUrl(parsed.url, parsed.owner, parsed.name, language, thumbnailHue);
      setProjects((prev) => [project, ...prev]);
      return project;
    },
    [],
  );

  const createFromRepo = useCallback(
    (owner: string, name: string, language: string, thumbnailHue?: number) => {
      const url = `https://github.com/${owner}/${name}`;
      const project = createProjectFromUrl(url, owner, name, language, thumbnailHue);
      setProjects((prev) => [project, ...prev]);
      return project;
    },
    [],
  );

  const advanceProject = useCallback((id: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id || p.status === "live" || p.status === "failed") return p;
        const idx = STATUS_ORDER.indexOf(p.status);
        const next = STATUS_ORDER[idx + 1] ?? "live";
        return {
          ...p,
          status: next,
          logs: logsForStatus(next, p.owner, p.name),
          previewUrl: next === "live" ? `https://preview.remember.dev/${p.owner}/${p.name}` : undefined,
        };
      }),
    );
  }, []);

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects],
  );

  const value = useMemo(
    () => ({ projects, createFromUrl, createFromRepo, advanceProject, getProject }),
    [projects, createFromUrl, createFromRepo, advanceProject, getProject],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
}
