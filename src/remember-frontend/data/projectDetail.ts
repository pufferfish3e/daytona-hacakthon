import type { ResurrectionRun } from "@/lib/contracts/run";
import type { Project, ProjectStatus } from "../types/dashboard";
import type { ProjectDetail } from "../types/projectDetail";
import { projectDetailFromRun } from "../lib/run-mapper";

function sessionIdFromProject(id: string): string {
  const hex = id.replace(/\D/g, "").slice(-6).padStart(6, "0");
  return `PR-${hex || "7f3a2c"}`;
}

function timelineForStatus(status: ProjectStatus, owner: string, name: string): ProjectDetail["timeline"] {
  const base: ProjectDetail["timeline"] = [
    {
      id: "clone",
      label: "Cloning repository",
      detail: `https://github.com/${owner}/${name}.git`,
      duration: "12s",
      timestamp: "12:04:01",
      status: "done",
    },
    {
      id: "inspect",
      label: "Inspecting project",
      detail: "Mapped dependency tree and runtime",
      duration: "8s",
      timestamp: "12:04:09",
      status: "done",
    },
    {
      id: "baseline",
      label: "Baseline failed",
      detail: "npm ci exited 1 — lockfile out of sync",
      duration: "34s",
      timestamp: "12:04:43",
      status: status === "ingesting" ? "pending" : "failed",
    },
    {
      id: "plan",
      label: "Planning repairs",
      detail: "3 parallel repair lanes spawned",
      duration: "6s",
      timestamp: "12:04:49",
      status:
        status === "ingesting"
          ? "pending"
          : ["repairing", "isolating", "live"].includes(status)
            ? "done"
            : "pending",
    },
    {
      id: "repair",
      label: "Repairing",
      detail: "Live repair race in progress",
      duration: status === "repairing" ? "…" : "2m 21s",
      timestamp: status === "repairing" ? "now" : "12:07:10",
      status:
        status === "repairing"
          ? "active"
          : ["isolating", "live"].includes(status)
            ? "done"
            : "pending",
    },
    {
      id: "isolate",
      label: "Isolating sandbox",
      detail: "Ephemeral build environment",
      duration: status === "isolating" ? "…" : "48s",
      timestamp: status === "isolating" ? "now" : "12:08:02",
      status:
        status === "isolating"
          ? "active"
          : ["ingesting", "repairing"].includes(status)
            ? "pending"
            : "done",
    },
    {
      id: "share",
      label: "Publishing preview",
      detail: "Share link generation",
      duration: status === "live" ? "4s" : "—",
      timestamp: status === "live" ? "12:08:54" : "—",
      status: status === "live" ? "done" : "pending",
    },
  ];

  if (status === "failed") {
    const repairIdx = base.findIndex((e) => e.id === "repair");
    if (repairIdx >= 0) base[repairIdx] = { ...base[repairIdx], status: "failed" };
  }

  return base;
}

function lanesForStatus(status: ProjectStatus): ProjectDetail["repairLanes"] {
  const repairing = status === "repairing";
  const pastRepair = ["isolating", "live"].includes(status);
  const failed = status === "failed";

  return [
    {
      id: "env",
      laneLetter: "A",
      title: "Historical Node runtime",
      accent: "emerald",
      invasiveness: "environment",
      status: pastRepair ? "passed" : repairing ? "verifying" : failed ? "failed" : "pending",
      statusLabel: pastRepair ? "Booted" : repairing ? "Repairing…" : "Pending",
      hypothesis: "Node version incompatibility — pin to LTS runtime",
      changedFiles: [".nvmrc", ".node-version"],
      footerStatus: pastRepair ? "Verified" : repairing ? "Verifying…" : "Waiting",
    },
    {
      id: "config",
      laneLetter: "B",
      title: "Legacy dependency resolution",
      accent: "amber",
      invasiveness: "dependency",
      status: pastRepair ? "passed" : repairing ? "repairing" : failed ? "failed" : "pending",
      statusLabel: pastRepair ? "Passed" : repairing ? "Repairing…" : "Pending",
      hypothesis: "Enable legacy peer dependency resolution mode",
      changedFiles: ["package.json", ".npmrc"],
      footerStatus: pastRepair ? "Checks passed" : repairing ? "Running checks…" : "Waiting",
    },
    {
      id: "deps",
      laneLetter: "C",
      title: "Minimal compatibility patch",
      accent: "red",
      invasiveness: "source",
      status: pastRepair ? "passed" : repairing ? "failed" : failed ? "failed" : "pending",
      statusLabel: pastRepair ? "Passed" : repairing ? "Repairing…" : "Pending",
      hypothesis: "Patch deprecated Sass API usage only",
      changedFiles: ["src/styles/main.scss"],
      footerStatus: pastRepair ? "Tests passed" : repairing ? "Tests failed" : "Waiting",
    },
  ];
}

const DEFAULT_PROFILE: ProjectDetail["profile"] = [
  { name: "Next.js", version: "v12.2.5" },
  { name: "Node.js", version: "v16.13.0" },
  { name: "npm", version: "v8.1.2" },
];

export function getProjectDetail(project: Project, run?: ResurrectionRun): ProjectDetail {
  if (run) return projectDetailFromRun(project, run);

  const elapsed =
    project.status === "ingesting"
      ? 45
      : project.status === "repairing"
        ? 141
        : project.status === "isolating"
          ? 198
          : 234;

  return {
    sessionId: sessionIdFromProject(project.id),
    snapshotHash: "a3f9c2e",
    inactiveYears: 2.1,
    visibility: "public",
    tags: ["dormant", project.language.toLowerCase()],
    timeline: timelineForStatus(project.status, project.owner, project.name),
    repairLanes: lanesForStatus(project.status),
    safetyChecks: [
      { label: "Network egress: Blocked", passed: true },
      { label: "Write access: Denied", passed: true },
      { label: "Secrets quarantined", passed: true },
      { label: "Read-only snapshot", passed: true },
    ],
    profile:
      project.language === "JavaScript" || project.language === "TypeScript"
        ? DEFAULT_PROFILE
        : [
            { name: project.language, version: "detected" },
            { name: "Node.js", version: "v18.20.0" },
          ],
    elapsedSeconds: elapsed,
    estimatedSeconds: 300,
  };
}

export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
