export type TimelineEventStatus = "done" | "failed" | "active" | "pending";

export type TimelineEvent = {
  id: string;
  label: string;
  detail?: string;
  duration?: string;
  timestamp?: string;
  status: TimelineEventStatus;
};

export type RepairLaneStatus = "repairing" | "verifying" | "passed" | "failed" | "pending";

export type Invasiveness = "environment" | "dependency" | "source" | "config";

export type RepairLane = {
  id: string;
  laneLetter: "A" | "B" | "C";
  title: string;
  accent: "emerald" | "amber" | "red";
  invasiveness: Invasiveness;
  status: RepairLaneStatus;
  statusLabel: string;
  hypothesis: string;
  changedFiles: string[];
  footerStatus: string;
};

export type ResurrectionManifest = {
  framework: string;
  runtime: string;
  packageManager: string;
  installCommand: string;
  startCommand: string;
  port: number;
  repairAttempts: number;
  environmentAdjustments: number;
  sourceFilesModified: number;
  changedFiles: string[];
  winnerLane: "A" | "B" | "C";
  winnerTitle: string;
};

export type ProjectProfileItem = {
  name: string;
  version: string;
  icon?: string;
};

export type SafetyCheck = {
  label: string;
  passed: boolean;
};

export type ProjectDetail = {
  sessionId: string;
  snapshotHash: string;
  inactiveYears?: number;
  visibility: "public" | "private";
  tags: string[];
  timeline: TimelineEvent[];
  repairLanes: RepairLane[];
  safetyChecks: SafetyCheck[];
  profile: ProjectProfileItem[];
  elapsedSeconds: number;
  estimatedSeconds: number;
};
