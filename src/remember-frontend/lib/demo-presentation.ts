import type { Project } from "../types/dashboard";
import { LOCAL_MOCK_PREVIEW_URL } from "./preview-url";
import { BONKY_NAME, BONKY_OWNER, BONKY_REPO_URL } from "../bonky-inu/constants";

/** Pinned “prepared” resurrection — fake Daytona + embed iframe (Bonky Inu). */
export const HERO_DEMO_PROJECT_ID = "demo-hero-bonky";

/** Bonky hero card + instant completed workspace — always available. */
export const isHeroSpecimenEnabled = (): boolean => true;

/**
 * Fake orchestration/repair dwell timers instead of following live run status.
 * Real API runs (`run_*`) never use fake pacing.
 */
export const isFakeRunPacingEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_REMEMBER_DEMO_FLOW !== "false";

/** @deprecated Prefer `isHeroSpecimenEnabled` or `isFakeRunPacingEnabled`. */
export const isDemoPresentationMode = isHeroSpecimenEnabled;

export const isRealResurrectionRun = (project: Project | undefined): boolean =>
  Boolean(project?.id.startsWith("run_"));

export const createHeroDemoProject = (): Project => ({
  id: HERO_DEMO_PROJECT_ID,
  repoUrl: BONKY_REPO_URL,
  owner: BONKY_OWNER,
  name: BONKY_NAME,
  language: "TypeScript",
  thumbnailHue: 28,
  status: "live",
  previewUrl: LOCAL_MOCK_PREVIEW_URL,
  presentationMode: "hero",
  createdAt: new Date(Date.now() - 7200000).toISOString(),
  logs: [
    { ts: "00:42", agent: "share", message: "Publishing preview URL" },
    { ts: "00:43", agent: "share", message: "Bonky Inu prototype is live — share link ready" },
  ],
});

export const isHeroDemoProject = (project: Project | undefined): boolean =>
  project?.id === HERO_DEMO_PROJECT_ID || project?.presentationMode === "hero";

/** Archive card specimen — already resurrected; not the same as pasting the same GitHub URL. */
export const isPreparedSpecimenRepo = (owner: string, name: string): boolean =>
  owner === BONKY_OWNER && name === BONKY_NAME;

/** Live runs stay on top; prepared Bonky iframe demo is always pinned at the bottom. */
export const ensureHeroProjectLast = (projects: Project[]): Project[] => {
  const hero = projects.find((p) => p.id === HERO_DEMO_PROJECT_ID) ?? createHeroDemoProject();
  const rest = projects.filter(
    (p) => p.id !== HERO_DEMO_PROJECT_ID && p.id !== "demo-hero-acme",
  );
  return [...rest, hero];
};

export const splitHeroFromProjects = (
  projects: Project[],
): { live: Project[]; hero: Project | undefined } => {
  const hero = projects.find((p) => isHeroDemoProject(p));
  const live = projects.filter((p) => !isHeroDemoProject(p));
  return { live, hero };
};
