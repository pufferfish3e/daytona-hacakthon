import type { ResurrectionAttempt, ResurrectionRun, RunEvent, RunStatus } from "@/lib/contracts/run";
import type { Project, ProjectStatus } from "../types/dashboard";
import type {
  Invasiveness,
  ProjectDetail,
  RepairLane,
  RepairLaneStatus,
  TimelineEvent,
  TimelineEventStatus,
} from "../types/projectDetail";
import { previewUrlForProject } from "./preview-url";

const TERMINAL_RUN_STATUSES = new Set<RunStatus>(["success", "failed"]);
const LANE_LETTERS = ["A", "B", "C"] as const;
const LANE_ACCENTS = ["emerald", "amber", "red"] as const;

export const isTerminalRunStatus = (status: RunStatus): boolean => TERMINAL_RUN_STATUSES.has(status);

export const mapRunStatusToProjectStatus = (status: RunStatus): ProjectStatus => {
  switch (status) {
    case "queued":
    case "creating_sandbox":
    case "cloning":
    case "inspecting":
    case "planning":
    case "installing":
    case "starting":
    case "diagnosing":
      return "ingesting";
    case "repairing":
      return "repairing";
    case "verifying":
      return "isolating";
    case "success":
      return "live";
    case "failed":
      return "failed";
  }
};

const formatClock = (iso: string | undefined): string | undefined => {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleTimeString("en-US", { hour: "2-digit", hour12: false, minute: "2-digit", second: "2-digit" });
};

const elapsedSeconds = (run: ResurrectionRun): number => {
  const start = new Date(run.startedAt).getTime();
  const end = run.completedAt ? new Date(run.completedAt).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.floor((end - start) / 1000));
};

const mapAttemptStatus = (status: ResurrectionAttempt["status"], runStatus: RunStatus): RepairLaneStatus => {
  if (status === "success") return "passed";
  if (status === "failed") return "failed";
  if (status === "running") return runStatus === "verifying" ? "verifying" : "repairing";
  return "pending";
};

const mapInvasiveness = (value: ResurrectionAttempt["invasiveness"]): Invasiveness => value;

const mapAttemptToLane = (attempt: ResurrectionAttempt, index: number, run: ResurrectionRun): RepairLane => {
  const laneLetter = LANE_LETTERS[index] ?? "A";
  const status = mapAttemptStatus(attempt.status, run.status);
  const statusLabel =
    status === "passed" ? "Passed" : status === "failed" ? "Failed" : status === "verifying" ? "Verifying…" : status === "repairing" ? "Repairing…" : "Pending";
  const footerStatus =
    status === "passed" ? "Verified" : status === "failed" ? "Failed" : status === "verifying" ? "Verifying…" : status === "repairing" ? "Running checks…" : "Waiting";

  return {
    id: attempt.id,
    laneLetter,
    title: attempt.title,
    accent: LANE_ACCENTS[index] ?? "emerald",
    invasiveness: mapInvasiveness(attempt.invasiveness),
    status,
    statusLabel,
    hypothesis: attempt.hypothesis,
    changedFiles: attempt.changedFiles,
    footerStatus,
  };
};

const mapEventStatus = (event: RunEvent, run: ResurrectionRun, index: number): TimelineEventStatus => {
  const lastIndex = run.events.length - 1;
  if (run.status === "failed" && index === lastIndex) return "failed";
  if (index < lastIndex) return "done";
  if (run.status === "success") return "done";
  return "active";
};

const mapEventsToTimeline = (run: ResurrectionRun): TimelineEvent[] =>
  run.events.map((event, index) => ({
    id: event.id,
    label: event.summary,
    detail: event.technical,
    timestamp: formatClock(event.at),
    status: mapEventStatus(event, run, index),
  }));

const defaultLanes = (run: ResurrectionRun): RepairLane[] => {
  if (run.attempts.length > 0) return run.attempts.map((attempt, index) => mapAttemptToLane(attempt, index, run));
  return [
    {
      id: "repair-a",
      laneLetter: "A",
      title: "Strategy A",
      accent: "emerald",
      invasiveness: "environment",
      status: run.status === "repairing" ? "repairing" : "pending",
      statusLabel: run.status === "repairing" ? "Repairing…" : "Pending",
      hypothesis: "Waiting for repair race to start.",
      changedFiles: [],
      footerStatus: "Waiting",
    },
    {
      id: "repair-b",
      laneLetter: "B",
      title: "Strategy B",
      accent: "amber",
      invasiveness: "config",
      status: "pending",
      statusLabel: "Pending",
      hypothesis: "Waiting for repair race to start.",
      changedFiles: [],
      footerStatus: "Waiting",
    },
    {
      id: "repair-c",
      laneLetter: "C",
      title: "Strategy C",
      accent: "red",
      invasiveness: "dependency",
      status: "pending",
      statusLabel: "Pending",
      hypothesis: "Waiting for repair race to start.",
      changedFiles: [],
      footerStatus: "Waiting",
    },
  ];
};

const profileFromRun = (run: ResurrectionRun): ProjectDetail["profile"] => {
  if (!run.detected) {
    return [{ name: "Repository", version: "detecting" }];
  }
  const items: ProjectDetail["profile"] = [{ name: run.detected.framework, version: "detected" }];
  if (run.detected.runtime) items.push({ name: "Runtime", version: run.detected.runtime });
  if (run.detected.packageManager !== "unknown") {
    items.push({ name: run.detected.packageManager, version: "detected" });
  }
  return items;
};

export const projectFromRun = (
  run: ResurrectionRun,
  extras?: { language?: string; thumbnailHue?: number },
): Project => ({
  id: run.id,
  repoUrl: run.repoUrl,
  owner: run.repoOwner,
  name: run.repoName,
  language: extras?.language ?? run.detected?.framework ?? "Unknown",
  thumbnailHue: extras?.thumbnailHue,
  status: mapRunStatusToProjectStatus(run.status),
  previewUrl: previewUrlForProject(run.previewUrl),
  logs: run.events.map((event) => ({
    ts: formatClock(event.at) ?? "00:00",
    agent: event.kind === "repairing" ? "repair" : event.kind === "verifying" ? "isolate" : "ingest",
    message: event.summary,
  })),
  createdAt: run.startedAt,
});

export const projectDetailFromRun = (project: Project, run: ResurrectionRun): ProjectDetail => {
  const elapsed = elapsedSeconds(run);
  const hex = run.id.replace(/\D/g, "").slice(-6).padStart(6, "0");

  return {
    sessionId: `PR-${hex || "7f3a2c"}`,
    snapshotHash: run.events.find((event) => event.kind === "snapshot")?.forkId?.slice(0, 7) ?? "pending",
    visibility: "public",
    tags: ["dormant", project.language.toLowerCase()],
    timeline: mapEventsToTimeline(run),
    repairLanes: defaultLanes(run),
    safetyChecks: [
      { label: "Network egress: Blocked", passed: true },
      { label: "Write access: Denied", passed: true },
      { label: "Secrets quarantined", passed: true },
      { label: "Read-only snapshot", passed: true },
    ],
    profile: profileFromRun(run),
    elapsedSeconds: elapsed,
    estimatedSeconds: 300,
  };
};
