import { createSchema, isRecord, requireString, requireStringArray, ValidationError } from "./validation";

export type RunStatus =
  | "queued" | "creating_sandbox" | "cloning" | "inspecting" | "planning"
  | "installing" | "starting" | "diagnosing" | "repairing" | "verifying" | "success" | "failed";
export type AttemptStatus = "queued" | "running" | "success" | "failed";
export type Invasiveness = "environment" | "config" | "dependency" | "source";

export interface ProjectProfile {
  language: "javascript" | "typescript" | "python" | "unknown";
  framework: string;
  packageManager: "npm" | "pnpm" | "yarn" | "bun" | "pip" | "poetry" | "unknown";
  runtime?: string;
  installCommand?: string;
  buildCommand?: string;
  startCommand?: string;
  likelyPorts: number[];
  evidence: string[];
  isGui: boolean;
}

export interface ResurrectionManifest {
  repository: string;
  commit: string;
  detectedFramework: string;
  runtime?: string;
  packageManager: string;
  installCommand?: string;
  startCommand: string;
  port: number;
  repairs: Array<{ file?: string; summary: string }>;
}

export interface RunEvent {
  id: string;
  at: string;
  kind: RunStatus | "snapshot" | "cleanup" | "winner";
  summary: string;
  forkId?: string;
  technical?: string;
}

export interface ResurrectionAttempt {
  id: string;
  title: string;
  hypothesis: string;
  invasiveness: Invasiveness;
  status: AttemptStatus;
  sandboxId?: string;
  changedFiles: string[];
  bootDurationMs?: number;
  failureReason?: string;
}

export interface VisualProofResult {
  provider: "nosana";
  status: "passed" | "failed" | "unavailable";
  label?: "meaningful_ui" | "blank" | "error_overlay";
  summary: string;
  jobId?: string;
  evidenceUrl?: string;
  durationMs?: number;
}

export interface ResurrectionRun {
  id: string;
  repoUrl: string;
  repoOwner: string;
  repoName: string;
  status: RunStatus;
  detected?: ProjectProfile;
  attempts: ResurrectionAttempt[];
  events: RunEvent[];
  previewUrl?: string;
  previewPort?: number;
  manifest?: ResurrectionManifest;
  visualProof?: VisualProofResult;
  startedAt: string;
  completedAt?: string;
  failureReason?: string;
}

const RUN_ID_PATTERN = /^run_[0-9a-f-]{36}$/;
const RUN_STATUSES = new Set<RunStatus>(["queued", "creating_sandbox", "cloning", "inspecting", "planning", "installing", "starting", "diagnosing", "repairing", "verifying", "success", "failed"]);
const ATTEMPT_STATUSES = new Set<AttemptStatus>(["queued", "running", "success", "failed"]);
const INVASIVENESS = new Set<Invasiveness>(["environment", "config", "dependency", "source"]);

const optionalString = (input: unknown, field: string): string | undefined =>
  input === undefined ? undefined : requireString(input, field);

const validateRun = (input: unknown): ResurrectionRun => {
  if (!isRecord(input)) throw new ValidationError("Run must be an object.");
  const id = requireString(input.id, "id");
  const status = requireString(input.status, "status");
  if (!RUN_ID_PATTERN.test(id) || !RUN_STATUSES.has(status as RunStatus)) throw new ValidationError("Run has invalid identity or status.");
  const attempts = validateAttempts(input.attempts);
  const events = validateEvents(input.events);
  return {
    id, repoUrl: requireString(input.repoUrl, "repoUrl"), repoOwner: requireString(input.repoOwner, "repoOwner"),
    repoName: requireString(input.repoName, "repoName"), status: status as RunStatus, attempts, events,
    startedAt: requireString(input.startedAt, "startedAt"), previewUrl: optionalString(input.previewUrl, "previewUrl"),
    previewPort: optionalPort(input.previewPort), completedAt: optionalString(input.completedAt, "completedAt"), detected: optionalProfile(input.detected),
    manifest: optionalManifest(input.manifest), visualProof: optionalVisualProof(input.visualProof), failureReason: optionalString(input.failureReason, "failureReason"),
  };
};

const validateAttempts = (input: unknown): ResurrectionAttempt[] => {
  if (!Array.isArray(input)) throw new ValidationError("attempts must be an array.");
  return input.map((item: unknown): ResurrectionAttempt => {
    if (!isRecord(item)) throw new ValidationError("Attempt must be an object.");
    const status = requireString(item.status, "attempt.status");
    const invasiveness = requireString(item.invasiveness, "attempt.invasiveness");
    if (!ATTEMPT_STATUSES.has(status as AttemptStatus) || !INVASIVENESS.has(invasiveness as Invasiveness)) throw new ValidationError("Attempt status is invalid.");
    return { id: requireString(item.id, "attempt.id"), title: requireString(item.title, "attempt.title"), hypothesis: requireString(item.hypothesis, "attempt.hypothesis"), invasiveness: invasiveness as Invasiveness, status: status as AttemptStatus, changedFiles: requireStringArray(item.changedFiles, "attempt.changedFiles"), sandboxId: optionalString(item.sandboxId, "attempt.sandboxId"), bootDurationMs: optionalDuration(item.bootDurationMs), failureReason: optionalString(item.failureReason, "attempt.failureReason") };
  });
};

const validateEvents = (input: unknown): RunEvent[] => {
  if (!Array.isArray(input)) throw new ValidationError("events must be an array.");
  return input.map((item: unknown): RunEvent => {
    if (!isRecord(item)) throw new ValidationError("Event must be an object.");
    const kind = requireString(item.kind, "event.kind");
    if (!RUN_STATUSES.has(kind as RunStatus) && kind !== "snapshot" && kind !== "cleanup" && kind !== "winner") throw new ValidationError("Event kind is invalid.");
    return { id: requireString(item.id, "event.id"), at: requireString(item.at, "event.at"), kind: kind as RunEvent["kind"], summary: requireString(item.summary, "event.summary"), forkId: optionalString(item.forkId, "event.forkId"), technical: optionalString(item.technical, "event.technical") };
  });
};

const optionalPort = (input: unknown): number | undefined => {
  if (input === undefined) return undefined;
  if (typeof input !== "number" || !Number.isInteger(input) || input < 1 || input > 65535) throw new ValidationError("previewPort is invalid.");
  return input;
};

const optionalDuration = (input: unknown): number | undefined => {
  if (input === undefined) return undefined;
  if (typeof input !== "number" || !Number.isFinite(input) || input < 0) throw new ValidationError("Duration is invalid.");
  return input;
};

const optionalProfile = (input: unknown): ProjectProfile | undefined => {
  if (input === undefined) return undefined;
  if (!isRecord(input)) throw new ValidationError("detected must be an object.");
  const language = requireString(input.language, "detected.language");
  const packageManager = requireString(input.packageManager, "detected.packageManager");
  const languages = new Set(["javascript", "typescript", "python", "unknown"]);
  const packageManagers = new Set(["npm", "pnpm", "yarn", "bun", "pip", "poetry", "unknown"]);
  if (!languages.has(language) || !packageManagers.has(packageManager) || typeof input.isGui !== "boolean") throw new ValidationError("Detected profile is invalid.");
  const likelyPorts = validatePorts(input.likelyPorts, "detected.likelyPorts");
  return { language: language as ProjectProfile["language"], framework: requireString(input.framework, "detected.framework"), packageManager: packageManager as ProjectProfile["packageManager"], runtime: optionalString(input.runtime, "detected.runtime"), installCommand: optionalString(input.installCommand, "detected.installCommand"), buildCommand: optionalString(input.buildCommand, "detected.buildCommand"), startCommand: optionalString(input.startCommand, "detected.startCommand"), likelyPorts, evidence: requireStringArray(input.evidence, "detected.evidence"), isGui: input.isGui };
};

const optionalManifest = (input: unknown): ResurrectionManifest | undefined => {
  if (input === undefined) return undefined;
  if (!isRecord(input) || !Array.isArray(input.repairs)) throw new ValidationError("Manifest is invalid.");
  return { repository: requireString(input.repository, "manifest.repository"), commit: requireString(input.commit, "manifest.commit"), detectedFramework: requireString(input.detectedFramework, "manifest.detectedFramework"), runtime: optionalString(input.runtime, "manifest.runtime"), packageManager: requireString(input.packageManager, "manifest.packageManager"), installCommand: optionalString(input.installCommand, "manifest.installCommand"), startCommand: requireString(input.startCommand, "manifest.startCommand"), port: requiredPort(input.port), repairs: input.repairs.map(validateRepair) };
};

const optionalVisualProof = (input: unknown): VisualProofResult | undefined => {
  if (input === undefined) return undefined;
  if (!isRecord(input) || input.provider !== "nosana") throw new ValidationError("Visual proof is invalid.");
  const status = requireString(input.status, "visualProof.status");
  const label = optionalString(input.label, "visualProof.label");
  if (!(new Set(["passed", "failed", "unavailable"])).has(status) || (label !== undefined && !(new Set(["meaningful_ui", "blank", "error_overlay"])).has(label))) throw new ValidationError("Visual proof status is invalid.");
  return { provider: "nosana", status: status as VisualProofResult["status"], label: label as VisualProofResult["label"], summary: requireString(input.summary, "visualProof.summary"), jobId: optionalString(input.jobId, "visualProof.jobId"), evidenceUrl: optionalString(input.evidenceUrl, "visualProof.evidenceUrl"), durationMs: optionalDuration(input.durationMs) };
};

const validatePorts = (input: unknown, field: string): number[] => {
  if (!Array.isArray(input) || input.some((port: unknown) => typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535)) throw new ValidationError(`${field} is invalid.`);
  return input;
};

const requiredPort = (input: unknown): number => {
  const port = optionalPort(input);
  if (port === undefined) throw new ValidationError("Manifest port is required.");
  return port;
};

const validateRepair = (input: unknown): { file?: string; summary: string } => {
  if (!isRecord(input)) throw new ValidationError("Manifest repair is invalid.");
  return { file: optionalString(input.file, "repair.file"), summary: requireString(input.summary, "repair.summary") };
};

export const ResurrectionRunSchema = createSchema<ResurrectionRun>(validateRun);

export const createQueuedRun = (id: string, repoUrl: string, repoOwner: string, repoName: string, startedAt = new Date().toISOString()): ResurrectionRun => ({
  id, repoUrl, repoOwner, repoName, status: "queued", attempts: [], events: [{ id: `${id}:queued`, at: startedAt, kind: "queued", summary: "Run queued." }], startedAt,
});
