"use client";

import { ArrowRight, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { type FormEvent, type ReactElement, useCallback, useEffect, useState } from "react";

type RunStatus = "queued" | "creating_sandbox" | "cloning" | "inspecting" | "planning" | "installing" | "starting" | "diagnosing" | "repairing" | "verifying" | "success" | "failed";
type AttemptStatus = "queued" | "running" | "success" | "failed";

interface RunAttempt { id: string; title: string; hypothesis: string; status: AttemptStatus; changedFiles: string[]; failureReason?: string; }
interface RunEvent { id: string; summary: string; }
interface ResurrectionRun { id: string; repoUrl: string; repoOwner: string; repoName: string; status: RunStatus; attempts: RunAttempt[]; events: RunEvent[]; previewUrl?: string; failureReason?: string; }
interface CreateRunResponse { id: string; }

const TERMINAL_STATUSES = new Set<RunStatus>(["success", "failed"]);

const STATUS_LABELS: Record<RunStatus, string> = { queued: "Queued", creating_sandbox: "Creating sandbox", cloning: "Cloning repository", inspecting: "Inspecting project", planning: "Planning repairs", installing: "Installing dependencies", starting: "Starting application", diagnosing: "Diagnosing baseline", repairing: "Racing repairs", verifying: "Verifying preview", success: "Resurrection complete", failed: "Resurrection failed" };

const isCreateResponse = (input: unknown): input is CreateRunResponse => typeof input === "object" && input !== null && "id" in input && typeof input.id === "string";

const isRunResponse = (input: unknown): input is ResurrectionRun => typeof input === "object" && input !== null && "status" in input && "attempts" in input && "events" in input && typeof input.status === "string" && Array.isArray(input.attempts) && Array.isArray(input.events);

const getErrorMessage = async (response: Response): Promise<string> => {
  const payload: unknown = await response.json().catch((): null => null);
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : `Request failed (${response.status}).`;
};

export default function RunDemoApp(): ReactElement {
  const [repoUrl, setRepoUrl] = useState("");
  const [run, setRun] = useState<ResurrectionRun | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pollRun = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/runs/${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const payload: unknown = await response.json();
      if (!isRunResponse(payload)) throw new Error("The run response was invalid.");
      setRun(payload);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Unable to refresh resurrection status.");
    }
  }, []);

  const runId = run?.id;
  const runStatus = run?.status;

  useEffect(() => {
    if (!runId || !runStatus || TERMINAL_STATUSES.has(runStatus)) return;
    const timer = window.setInterval(() => void pollRun(runId), 1000);
    return () => window.clearInterval(timer);
  }, [pollRun, runId, runStatus]);

  const submitRun = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!repoUrl.trim()) { setError("Paste a public GitHub repository URL to continue."); return; }
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/runs", { body: JSON.stringify({ repoUrl: repoUrl.trim() }), headers: { "Content-Type": "application/json" }, method: "POST" });
      if (!response.ok) throw new Error(await getErrorMessage(response));
      const payload: unknown = await response.json();
      if (!isCreateResponse(payload)) throw new Error("The create-run response was invalid.");
      await pollRun(payload.id);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Unable to start resurrection.");
    } finally { setIsSubmitting(false); }
  };

  const reset = (): void => { setError(""); setRepoUrl(""); setRun(null); };

  return <main className="min-h-screen bg-[#0a0a0a] px-5 py-8 text-white sm:px-8 lg:px-12"><header className="mx-auto flex max-w-6xl items-center justify-between border-b border-white/10 pb-6"><p className="font-semibold tracking-tight">Project Resurrection</p><p className="text-sm text-white/45">Public repositories · isolated execution</p></header><div className="mx-auto max-w-6xl py-16">{!run ? <LandingForm error={error} isSubmitting={isSubmitting} onSubmit={submitRun} repoUrl={repoUrl} setRepoUrl={setRepoUrl} /> : <RunDashboard error={error} onReset={reset} run={run} />}</div></main>;
}

function LandingForm({ error, isSubmitting, onSubmit, repoUrl, setRepoUrl }: { error: string; isSubmitting: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>; repoUrl: string; setRepoUrl: (value: string) => void; }): ReactElement {
  return <section className="grid gap-12 lg:grid-cols-[1.1fr_.9fr]"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">Make old software usable again</p><h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-7xl">Bring dormant software back to life.</h1><p className="mt-6 max-w-xl text-lg leading-relaxed text-white/60">Submit a public GitHub project. We inspect it, run a verified repair race when needed, and return a live preview when one is available.</p><form className="mt-10 max-w-2xl" onSubmit={(event) => void onSubmit(event)}><label className="sr-only" htmlFor="repo-url">Public GitHub repository URL</label><div className="flex flex-col gap-3 border border-white/15 bg-white p-2 sm:flex-row"><input className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-black outline-none" id="repo-url" onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://github.com/owner/repository" value={repoUrl} /><button className="inline-flex items-center justify-center gap-2 bg-[#1d4ed8] px-5 py-3 text-sm font-semibold" disabled={isSubmitting} type="submit">{isSubmitting ? "Starting…" : "Resurrect project"}<ArrowRight className="h-4 w-4" /></button></div>{error && <p className="mt-3 text-sm text-red-300">{error}</p>}</form></div><div className="border border-white/10 bg-white/[0.03] p-7"><ShieldCheck className="h-6 w-6 text-emerald-300" /><h2 className="mt-12 text-2xl font-medium">What the demo shows</h2><ol className="mt-6 space-y-5 text-sm leading-relaxed text-white/60"><li>01 · Baseline startup in an isolated sandbox.</li><li>02 · Exactly three repair candidates if the baseline fails.</li><li>03 · Independent process and HTTP verification before a preview is shown.</li></ol></div></section>;
}

function RunDashboard({ error, onReset, run }: { error: string; onReset: () => void; run: ResurrectionRun; }): ReactElement {
  const isSuccess = run.status === "success";
  const isFailed = run.status === "failed";
  return <section><div className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">{STATUS_LABELS[run.status]}</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">{run.repoOwner}/{run.repoName}</h1><p className="mt-3 text-sm text-white/50">{run.repoUrl}</p></div><button className="inline-flex items-center justify-center gap-2 border border-white/15 px-4 py-2 text-sm" onClick={onReset} type="button"><RefreshCw className="h-4 w-4" />Try another repository</button></div>{error && <p className="mt-5 text-sm text-red-300">{error}</p>}<div className="mt-10 grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><div><h2 className="text-sm font-medium text-white/50">Progress</h2><ol className="mt-5 space-y-4 border-l border-white/15 pl-5">{run.events.map((event) => <li key={event.id} className="text-sm text-white/70">{event.summary}</li>)}</ol></div><div><h2 className="text-sm font-medium text-white/50">Repair attempts</h2><div className="mt-5 grid gap-3">{run.attempts.length ? run.attempts.map((attempt) => <article className="border border-white/10 bg-white/[0.03] p-4" key={attempt.id}><div className="flex items-center justify-between gap-4"><h3 className="font-medium">{attempt.title}</h3><span className="text-xs uppercase tracking-[0.14em] text-white/45">{attempt.status}</span></div><p className="mt-2 text-sm text-white/55">{attempt.hypothesis}</p>{attempt.failureReason && <p className="mt-2 text-sm text-red-300">{attempt.failureReason}</p>}</article>) : <p className="text-sm text-white/45">No repair attempts are needed yet.</p>}</div></div></div>{isSuccess && <ResultPanel previewUrl={run.previewUrl} />}{isFailed && <div className="mt-10 border border-red-300/30 bg-red-300/10 p-6"><h2 className="text-xl font-medium">We could not verify a live preview.</h2><p className="mt-2 text-sm text-white/65">{run.failureReason || "No candidate passed the independent verification check."}</p></div>}</section>;
}

function ResultPanel({ previewUrl }: { previewUrl?: string }): ReactElement {
  return <div className="mt-10 border border-emerald-300/30 bg-emerald-300/10 p-6"><h2 className="text-xl font-medium">This project is running again.</h2>{previewUrl ? <a className="mt-5 inline-flex items-center gap-2 bg-white px-4 py-3 text-sm font-semibold text-black" href={previewUrl} rel="noopener noreferrer" target="_blank">Open live preview <ExternalLink className="h-4 w-4" /></a> : <p className="mt-2 text-sm text-white/65">The run succeeded, but its preview is unavailable in this environment. You can safely retry with another repository.</p>}</div>;
}
