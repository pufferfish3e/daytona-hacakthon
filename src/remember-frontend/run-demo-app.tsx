"use client";

import { ChevronLeft, RefreshCw } from "lucide-react";
import { type ReactElement, useCallback, useEffect, useMemo, useState } from "react";

import { EventTimeline } from "./components/project/EventTimeline";
import { LivePreviewPanel } from "./components/project/LivePreviewPanel";
import { ProjectProfilePanel } from "./components/project/ProjectProfilePanel";
import { ProjectSessionHeader } from "./components/project/ProjectSessionHeader";
import { RepairRacePanel } from "./components/project/RepairRacePanel";
import { RepoSubmittedPanel } from "./components/project/RepoSubmittedPanel";
import { SafetyContextPanel } from "./components/project/SafetyContextPanel";
import { Navigation } from "./components/Navigation";
import { getProjectDetail } from "./data/projectDetail";
import { HeroSection } from "./sections/HeroSection";
import type { Project, ProjectStatus } from "./types/dashboard";
import type { ProjectDetail, RepairLane, TimelineEvent } from "./types/projectDetail";

type RunStatus = "queued" | "creating_sandbox" | "cloning" | "inspecting" | "planning" | "installing" | "starting" | "diagnosing" | "repairing" | "verifying" | "success" | "failed";
type AttemptStatus = "queued" | "running" | "success" | "failed";

interface RunAttempt {
  changedFiles: string[];
  failureReason?: string;
  hypothesis: string;
  id: string;
  status: AttemptStatus;
  title: string;
}

interface RunEvent {
  id: string;
  summary: string;
}

interface ResurrectionRun {
  attempts: RunAttempt[];
  events: RunEvent[];
  failureReason?: string;
  id: string;
  previewUrl?: string;
  repoName: string;
  repoOwner: string;
  repoUrl: string;
  status: RunStatus;
  visualProof?: VisualProofResult;
}

interface VisualProofResult {
  evidenceUrl?: string;
  label?: "blank" | "error_overlay" | "meaningful_ui";
  provider: "nosana";
  status: "failed" | "passed" | "unavailable";
  summary: string;
}

interface CreateRunResponse {
  id: string;
}

const TERMINAL_STATUSES = new Set<RunStatus>(["success", "failed"]);
const PROJECT_STATUSES: Record<RunStatus, ProjectStatus> = {
  queued: "ingesting",
  creating_sandbox: "ingesting",
  cloning: "ingesting",
  inspecting: "ingesting",
  planning: "repairing",
  installing: "repairing",
  starting: "isolating",
  diagnosing: "repairing",
  repairing: "repairing",
  verifying: "isolating",
  success: "live",
  failed: "failed",
};
const ACCENTS: RepairLane["accent"][] = ["emerald", "amber", "red"];

const isCreateResponse = (input: unknown): input is CreateRunResponse =>
  typeof input === "object" && input !== null && "id" in input && typeof input.id === "string";

const isRunResponse = (input: unknown): input is ResurrectionRun =>
  typeof input === "object" && input !== null && "status" in input && "attempts" in input && "events" in input && typeof input.status === "string" && Array.isArray(input.attempts) && Array.isArray(input.events);

const VISUAL_PROOF_LABELS: Record<NonNullable<VisualProofResult["label"]>, string> = {
  blank: "Blank screen",
  error_overlay: "Error overlay",
  meaningful_ui: "Meaningful UI",
};

const getErrorMessage = async (response: Response): Promise<string> => {
  const payload: unknown = await response.json().catch((): null => null);
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : `Request failed (${response.status}).`;
};

export default function RunDemoApp(): ReactElement {
  const [run, setRun] = useState<ResurrectionRun | null>(null);
  const [error, setError] = useState("");
  const pollRun = usePollRun(setError, setRun);

  usePolling(pollRun, run?.id, run?.status);

  const startRun = useCallback(async (repoUrl: string): Promise<void> => {
    setError("");
    try {
      const response = await fetch("/api/runs", {
        body: JSON.stringify({ repoUrl }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const payload: unknown = await response.json();
      if (!isCreateResponse(payload)) throw new Error("The create-run response was invalid.");
      await pollRun(payload.id);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Unable to start resurrection.");
    }
  }, [pollRun]);

  if (!run) return <LandingScreen error={error} onSubmit={startRun} />;
  return <RunWorkspace onReset={(): void => setRun(null)} run={run} />;
}

const usePollRun = (
  setError: (message: string) => void,
  setRun: (run: ResurrectionRun) => void,
): ((runId: string) => Promise<void>) => useCallback(async (runId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/runs/${runId}`, { cache: "no-store" });
    if (!response.ok) throw new Error(await getErrorMessage(response));
    const payload: unknown = await response.json();
    if (!isRunResponse(payload)) throw new Error("The run response was invalid.");
    setRun(payload);
  } catch (caught: unknown) {
    setError(caught instanceof Error ? caught.message : "Unable to refresh resurrection status.");
  }
}, [setError, setRun]);

const usePolling = (
  pollRun: (runId: string) => Promise<void>,
  runId: string | undefined,
  status: RunStatus | undefined,
): void => {
  useEffect(() => {
    if (!runId || !status || TERMINAL_STATUSES.has(status)) return;
    const timer = window.setInterval(() => void pollRun(runId), 1000);
    return () => window.clearInterval(timer);
  }, [pollRun, runId, status]);
};

function LandingScreen({ error, onSubmit }: { error: string; onSubmit: (url: string) => Promise<void> }): ReactElement {
  return (
    <div className="bg-[#0a0a0a] text-white">
      <Navigation overHero />
      <HeroSection error={error} onSubmit={(url: string): void => void onSubmit(url)} />
    </div>
  );
}

function RunWorkspace({ onReset, run }: { onReset: () => void; run: ResurrectionRun }): ReactElement {
  const project = useMemo((): Project => toProject(run), [run]);
  const detail = useMemo((): ProjectDetail => toProjectDetail(run, project), [project, run]);

  if (run.status === "success") return <SuccessWorkspace onReset={onReset} project={project} run={run} />;
  if (run.status === "failed") return <FailureWorkspace onReset={onReset} run={run} />;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white">
      <ProjectSessionHeader statusLabel="Resurrecting" statusTone="progress" projectLabel={`${project.owner}/${project.name}`} sessionId={detail.sessionId} />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-[#0a0a0a] lg:w-72 lg:border-b-0 lg:border-r xl:w-80">
          <ResetControl onReset={onReset} />
          <RepoSubmittedPanel detail={detail} project={project} />
          <EventTimeline events={detail.timeline} />
        </aside>
        <section className="min-h-0 min-w-0 flex-1 border-b border-white/10 bg-[#0a0a0a] lg:border-b-0">
          <RepairRacePanel elapsedSeconds={detail.elapsedSeconds} estimatedSeconds={detail.estimatedSeconds} isEvaluating={run.status === "repairing"} lanes={detail.repairLanes} snapshotHash={detail.snapshotHash} />
        </section>
        <aside className="flex w-full shrink-0 flex-col bg-[#0a0a0a] lg:w-64 lg:border-l lg:border-white/10 xl:w-72">
          <SafetyContextPanel checks={detail.safetyChecks} />
          <ProjectProfilePanel profile={detail.profile} />
        </aside>
      </div>
    </div>
  );
}

function SuccessWorkspace({ onReset, project, run }: { onReset: () => void; project: Project; run: ResurrectionRun }): ReactElement {
  if (!project.previewUrl) return <UnavailableWorkspace onReset={onReset} project={project} />;
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white">
      <ProjectSessionHeader statusLabel="Project resurrected" statusTone="success" showPause={false} projectLabel={`${project.owner}/${project.name}`} sessionId={project.id.slice(-8)} />
      {run.visualProof ? <VisualProofBanner proof={run.visualProof} /> : null}
      <div className="min-h-0 flex-1"><LivePreviewPanel name={project.name} owner={project.owner} previewUrl={project.previewUrl} /></div>
    </div>
  );
}

function VisualProofBanner({ proof }: { proof: VisualProofResult }): ReactElement {
  const tone = proof.status === "passed" ? "text-emerald-400/90" : proof.status === "failed" ? "text-amber-400/90" : "text-white/50";
  const label = proof.label ? VISUAL_PROOF_LABELS[proof.label] : undefined;
  return (
    <div className="border-b border-white/10 px-5 py-3 text-sm">
      <p className={tone}>
        GPU visual proof: {proof.status}
        {label ? ` · ${label}` : ""}
      </p>
      <p className="mt-1 text-xs text-white/45">{proof.summary}</p>
    </div>
  );
}

function UnavailableWorkspace({ onReset, project }: { onReset: () => void; project: Project }): ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <ProjectSessionHeader statusLabel="Project resurrected" statusTone="success" showPause={false} projectLabel={`${project.owner}/${project.name}`} sessionId={project.id.slice(-8)} />
      <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
        <p className="text-xs text-emerald-400/80">Resurrection complete</p>
        <h1 className="mt-3 text-2xl font-semibold">{project.owner}/{project.name}</h1>
        <p className="mt-2 max-w-md text-sm text-white/50">The run succeeded, but its preview is unavailable in this environment.</p>
        <ResetButton className="mt-8" onReset={onReset} />
      </div>
    </div>
  );
}

function FailureWorkspace({ onReset, run }: { onReset: () => void; run: ResurrectionRun }): ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <ProjectSessionHeader statusLabel="Resurrection failed" statusTone="idle" showPause={false} projectLabel={`${run.repoOwner}/${run.repoName}`} sessionId={run.id.slice(-8)} />
      <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
        <p className="text-xs text-red-400/80">Resurrection failed</p>
        <h1 className="mt-3 text-2xl font-semibold">We could not verify a live preview.</h1>
        <p className="mt-2 max-w-md text-sm text-white/50">{run.failureReason ?? "No candidate passed the independent verification check."}</p>
        <ResetButton className="mt-8" onReset={onReset} />
      </div>
    </div>
  );
}

function ResetControl({ onReset }: { onReset: () => void }): ReactElement {
  return <button className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5 text-xs text-white/40 transition-colors hover:text-white/70" onClick={onReset} type="button"><ChevronLeft className="h-3.5 w-3.5" />Back to discover</button>;
}

function ResetButton({ className, onReset }: { className?: string; onReset: () => void }): ReactElement {
  return <button className={`name-cta-gradient inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-white ${className ?? ""}`} onClick={onReset} type="button"><RefreshCw className="h-4 w-4" />Try another repository</button>;
}

const toProject = (run: ResurrectionRun): Project => ({
  createdAt: new Date().toISOString(),
  id: run.id,
  language: "TypeScript",
  logs: [],
  name: run.repoName,
  owner: run.repoOwner,
  previewUrl: run.previewUrl,
  repoUrl: run.repoUrl,
  status: PROJECT_STATUSES[run.status],
});

const toProjectDetail = (run: ResurrectionRun, project: Project): ProjectDetail => {
  const detail = getProjectDetail(project);
  return {
    ...detail,
    repairLanes: run.attempts.length ? run.attempts.map(toRepairLane) : detail.repairLanes,
    snapshotHash: run.id.replace("run_", "").slice(0, 7),
    timeline: run.events.map((event, index) => toTimelineEvent(event, index, run)),
  };
};

const LANE_LETTERS = ["A", "B", "C"] as const;
const INVASIVENESS: RepairLane["invasiveness"][] = ["environment", "config", "dependency"];

const toRepairLane = (attempt: RunAttempt, index: number): RepairLane => ({
  accent: ACCENTS[index % ACCENTS.length],
  changedFiles: attempt.changedFiles,
  footerStatus: attempt.failureReason ?? attempt.status,
  hypothesis: attempt.hypothesis,
  id: attempt.id,
  invasiveness: INVASIVENESS[index % INVASIVENESS.length],
  laneLetter: LANE_LETTERS[index % LANE_LETTERS.length],
  status: attempt.status === "success" ? "passed" : attempt.status === "running" ? "repairing" : attempt.status === "queued" ? "pending" : "failed",
  statusLabel: attempt.status,
  title: attempt.title,
});

const toTimelineEvent = (event: RunEvent, index: number, run: ResurrectionRun): TimelineEvent => ({
  detail: event.summary,
  id: event.id,
  label: event.summary,
  status: run.status === "failed" && index === run.events.length - 1 ? "failed" : index === run.events.length - 1 && !TERMINAL_STATUSES.has(run.status) ? "active" : "done",
});
