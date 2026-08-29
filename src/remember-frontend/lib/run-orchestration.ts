import type { ResurrectionRun, RunStatus } from "@/lib/contracts/run";
import type { Project, ProjectStatus } from "../types/dashboard";

/** Run statuses where the Daytona + Nosana orchestration panel is shown. */
export const ORCHESTRATION_RUN_STATUSES = new Set<RunStatus>([
  "queued",
  "creating_sandbox",
  "cloning",
  "inspecting",
  "planning",
  "installing",
  "starting",
  "diagnosing",
  "verifying",
]);

export const isOrchestrationRunStatus = (status: RunStatus): boolean =>
  ORCHESTRATION_RUN_STATUSES.has(status);

export const shouldShowOrchestrationPanel = (
  project: Project,
  run?: ResurrectionRun,
): boolean => {
  if (project.presentationMode === "hero") return false;
  if (run) return isOrchestrationRunStatus(run.status);
  return project.status === "ingesting" || project.status === "isolating";
};

/** Map live run progress to OrchestrationFlowDiagram step (0–6). */
export const orchestrationStepFromRun = (run: ResurrectionRun): number => {
  switch (run.status) {
    case "queued":
      return 1;
    case "creating_sandbox":
      return 2;
    case "cloning":
      return 3;
    case "inspecting":
    case "planning":
    case "installing":
    case "starting":
    case "diagnosing":
      return 4;
    case "verifying":
      return 5;
    case "repairing":
      return 5;
    case "success":
      return 6;
    default:
      return 1;
  }
};

export const sandboxIdFromRun = (run: ResurrectionRun): string | undefined => {
  const fromAttempt = run.attempts.find((attempt) => attempt.sandboxId)?.sandboxId;
  if (fromAttempt) return fromAttempt;
  const technical = run.events.find((event) => event.technical?.includes("sbx"))?.technical;
  return technical;
};

export const nosanaStatusFromRun = (
  run: ResurrectionRun,
): "pending" | "running" | "connected" | "unavailable" => {
  if (run.visualProof) {
    if (run.visualProof.status === "passed") return "connected";
    if (run.visualProof.status === "unavailable") return "unavailable";
    return "running";
  }
  if (run.status === "verifying") return "running";
  if (run.status === "success" && run.detected?.isGui) return "pending";
  return "pending";
};

export const projectStatusLabel = (status: ProjectStatus, run?: ResurrectionRun): string => {
  if (run?.status === "creating_sandbox") return "Provisioning Daytona sandbox";
  if (run?.status === "cloning") return "Cloning repository";
  if (run?.status === "verifying") return "Nosana visual proof";
  if (status === "ingesting") return "Provisioning sandbox";
  if (status === "repairing") return "Resurrecting";
  if (status === "isolating") return "Verifying preview";
  if (status === "live") return "Project resurrected";
  if (status === "failed") return "Resurrection failed";
  return "Processing";
};
