import { useEffect, useState } from "react";
import type { ResurrectionRun } from "@/lib/contracts/run";
import type { Project } from "../types/dashboard";
import {
  isFakeRunPacingEnabled,
  isHeroDemoProject,
  isRealResurrectionRun,
} from "../lib/demo-presentation";

export type RunPresentationPhase = "orchestration" | "repair" | "live";

const ORCHESTRATION_DWELL_MS = 5_000;
const REPAIR_DWELL_MS = 12_000;

function phaseFromRun(project: Project, run?: ResurrectionRun): RunPresentationPhase {
  if (project.status === "live" || run?.status === "success") return "live";
  if (project.status === "failed" || run?.status === "failed") return "repair";
  if (run?.status === "verifying" || project.status === "isolating") return "orchestration";
  if (project.status === "repairing" || run?.status === "repairing") return "repair";
  return "orchestration";
}

/**
 * Demo script pacing: orchestration → repair race → live preview.
 * Hero specimen skips pacing and opens live immediately.
 */
export function useRunPresentationPhase(
  project: Project | undefined,
  run: ResurrectionRun | undefined,
): RunPresentationPhase {
  const fakePacing =
    isFakeRunPacingEnabled() && Boolean(project) && !isRealResurrectionRun(project);
  const projectId = project?.id;
  const [demoPhase, setDemoPhase] = useState<RunPresentationPhase>("orchestration");
  const [phaseProjectId, setPhaseProjectId] = useState(projectId);

  if (projectId !== phaseProjectId) {
    setPhaseProjectId(projectId);
    setDemoPhase("orchestration");
  }

  useEffect(() => {
    if (!fakePacing || !project || isHeroDemoProject(project)) return;

    if (demoPhase === "orchestration") {
      const timer = window.setTimeout(() => setDemoPhase("repair"), ORCHESTRATION_DWELL_MS);
      return () => window.clearTimeout(timer);
    }

    if (demoPhase === "repair") {
      const timer = window.setTimeout(() => {
        if (project.status === "failed" || run?.status === "failed") return;
        setDemoPhase("live");
      }, REPAIR_DWELL_MS);
      return () => window.clearTimeout(timer);
    }
  }, [fakePacing, project, run, demoPhase]);

  if (!project) return "orchestration";
  if (isHeroDemoProject(project)) return "live";
  if (!fakePacing) return phaseFromRun(project, run);
  return demoPhase;
}
