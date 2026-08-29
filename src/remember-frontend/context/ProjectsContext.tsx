import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ResurrectionRun } from "@/lib/contracts/run";
import { parseGitHubUrl } from "../data/mock";
import {
  createResurrectionRun,
  fetchResurrectionRun,
  ResurrectionApiError,
} from "../lib/resurrection-api";
import {
  isTerminalRunStatus,
  mapRunStatusToProjectStatus,
  projectFromRun,
} from "../lib/run-mapper";
import type { Project } from "../types/dashboard";

const STORAGE_KEY = "remember-projects";
const POLL_INTERVAL_MS = 1000;

type ProjectExtras = {
  language?: string;
  thumbnailHue?: number;
};

type ProjectsContextValue = {
  projects: Project[];
  runs: Record<string, ResurrectionRun>;
  apiError: string;
  clearApiError: () => void;
  createFromUrl: (url: string, language?: string, thumbnailHue?: number) => Promise<Project | null>;
  createFromRepo: (
    owner: string,
    name: string,
    language: string,
    thumbnailHue?: number,
  ) => Promise<Project>;
  getProject: (id: string) => Project | undefined;
  getRun: (id: string) => ResurrectionRun | undefined;
  refreshRun: (id: string) => Promise<void>;
};

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Project[];
  } catch {
    /* ignore */
  }
  return [];
}

function persistProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function mergeProject(existing: Project | undefined, next: Project): Project {
  if (!existing) return next;
  return {
    ...existing,
    ...next,
    language: existing.language || next.language,
    thumbnailHue: existing.thumbnailHue ?? next.thumbnailHue,
  };
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [runs, setRuns] = useState<Record<string, ResurrectionRun>>({});
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    persistProjects(projects);
  }, [projects]);

  const clearApiError = useCallback(() => setApiError(""), []);

  const upsertRun = useCallback((run: ResurrectionRun, extras?: ProjectExtras) => {
    setRuns((prev) => ({ ...prev, [run.id]: run }));
    setProjects((prev) => {
      const existing = prev.find((project) => project.id === run.id);
      const mapped = projectFromRun(run, {
        language: extras?.language ?? existing?.language,
        thumbnailHue: extras?.thumbnailHue ?? existing?.thumbnailHue,
      });
      const next = mergeProject(existing, mapped);
      if (existing) return prev.map((project) => (project.id === run.id ? next : project));
      return [next, ...prev];
    });
  }, []);

  const refreshRun = useCallback(
    async (id: string) => {
      const run = await fetchResurrectionRun(id);
      upsertRun(run);
    },
    [upsertRun],
  );

  const startRun = useCallback(
    async (repoUrl: string, extras?: ProjectExtras): Promise<Project> => {
      setApiError("");
      const { id } = await createResurrectionRun(repoUrl);
      const run = await fetchResurrectionRun(id);
      upsertRun(run, extras);
      return projectFromRun(run, extras);
    },
    [upsertRun],
  );

  const createFromUrl = useCallback(
    async (url: string, language = "Unknown", thumbnailHue?: number) => {
      const parsed = parseGitHubUrl(url);
      if (!parsed) return null;
      try {
        return await startRun(parsed.url, { language, thumbnailHue });
      } catch (error: unknown) {
        setApiError(error instanceof ResurrectionApiError ? error.message : "Unable to start resurrection.");
        return null;
      }
    },
    [startRun],
  );

  const createFromRepo = useCallback(
    async (owner: string, name: string, language: string, thumbnailHue?: number) => {
      const url = `https://github.com/${owner}/${name}`;
      try {
        return await startRun(url, { language, thumbnailHue });
      } catch (error: unknown) {
        setApiError(error instanceof ResurrectionApiError ? error.message : "Unable to start resurrection.");
        throw error;
      }
    },
    [startRun],
  );

  const getProject = useCallback((id: string) => projects.find((project) => project.id === id), [projects]);
  const getRun = useCallback((id: string) => runs[id], [runs]);

  useEffect(() => {
    const active = projects.filter((project) => !["live", "failed"].includes(project.status));
    if (active.length === 0) return;

    const poll = async () => {
      await Promise.all(
        active.map(async (project) => {
          try {
            const run = await fetchResurrectionRun(project.id);
            upsertRun(run);
          } catch (error: unknown) {
            console.error("resurrection poll failed", { projectId: project.id, error });
          }
        }),
      );
    };

    void poll();
    const timer = window.setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [projects, upsertRun]);

  useEffect(() => {
    const restore = async () => {
      const restorable = projects.filter((project) => project.id.startsWith("run_"));
      await Promise.all(
        restorable.map(async (project) => {
          try {
            const run = await fetchResurrectionRun(project.id);
            if (!isTerminalRunStatus(run.status)) {
              upsertRun(run);
              return;
            }
            if (mapRunStatusToProjectStatus(run.status) !== project.status || run.previewUrl !== project.previewUrl) {
              upsertRun(run);
            }
          } catch {
            /* stale local entry */
          }
        }),
      );
    };
    void restore();
  }, []);

  const value = useMemo(
    () => ({
      projects,
      runs,
      apiError,
      clearApiError,
      createFromUrl,
      createFromRepo,
      getProject,
      getRun,
      refreshRun,
    }),
    [projects, runs, apiError, clearApiError, createFromUrl, createFromRepo, getProject, getRun, refreshRun],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
}
