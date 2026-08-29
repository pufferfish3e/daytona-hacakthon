"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Cpu, Link2, Shield } from "lucide-react";
import type { ResurrectionRun } from "@/lib/contracts/run";
import {
  nosanaStatusFromRun,
  orchestrationStepFromRun,
  sandboxIdFromRun,
} from "../../lib/run-orchestration";
import { OrchestrationFlowDiagram } from "./OrchestrationFlowDiagram";

type InfraStep = {
  id: string;
  label: string;
  detail: string;
  delayMs: number;
};

const FALLBACK_STEPS: InfraStep[] = [
  {
    id: "daytona",
    label: "Daytona sandbox provisioned",
    detail: "Isolated VM · network egress blocked",
    delayMs: 0,
  },
  {
    id: "clone",
    label: "Repository cloned into sandbox",
    detail: "Read-only snapshot S0 captured",
    delayMs: 1400,
  },
  {
    id: "nosana",
    label: "Nosana visual proof channel linked",
    detail: "GPU verification job queued",
    delayMs: 2800,
  },
  {
    id: "scan",
    label: "Dependency scan started",
    detail: "Mapping lockfiles and runtime requirements",
    delayMs: 4200,
  },
];

type SandboxProvisioningPanelProps = {
  owner: string;
  name: string;
  /** When false, provisioning animation is paused (awaiting approval). */
  active?: boolean;
  /** Live resurrection run — drives real Daytona/Nosana orchestration UI. */
  run?: ResurrectionRun;
};

function fallbackStepForVisibleCount(visibleCount: number, active: boolean): number {
  if (!active) return 0;
  if (visibleCount === 0) return 1;
  if (visibleCount === 1) return 2;
  if (visibleCount === 2) return 3;
  if (visibleCount === 3) return 4;
  return 5;
}

const nosanaLabel = (status: ReturnType<typeof nosanaStatusFromRun>): string => {
  switch (status) {
    case "connected":
      return "Verified";
    case "running":
      return "Running";
    case "unavailable":
      return "Skipped";
    default:
      return "Pending";
  }
};

export function SandboxProvisioningPanel({
  owner,
  name,
  active = true,
  run,
}: SandboxProvisioningPanelProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [fallbackSandboxId] = useState(
    () => `daytona-sbx-${name.slice(0, 4)}${Math.floor(Math.random() * 900 + 100)}`,
  );

  const isLive = Boolean(run);

  useEffect(() => {
    if (isLive || !active) return;
    const timers = FALLBACK_STEPS.map((step, index) =>
      window.setTimeout(() => setVisibleCount(index + 1), step.delayMs),
    );
    return () => timers.forEach(clearTimeout);
  }, [active, isLive]);

  const activeStep = useMemo(() => {
    if (run) return orchestrationStepFromRun(run);
    return fallbackStepForVisibleCount(visibleCount, active);
  }, [run, visibleCount, active]);

  const sandboxId = run ? sandboxIdFromRun(run) ?? fallbackSandboxId : fallbackSandboxId;
  const nosanaStatus = run ? nosanaStatusFromRun(run) : visibleCount >= 3 ? "connected" : "pending";

  const logLines = useMemo(() => {
    if (run) {
      return run.events.map((event) => ({
        id: event.id,
        label: event.summary,
        detail: event.technical,
      }));
    }
    return FALLBACK_STEPS.slice(0, visibleCount).map((step) => ({
      id: step.id,
      label: step.label,
      detail: step.detail,
    }));
  }, [run, visibleCount]);

  const daytonaRunning =
    active &&
    (isLive
      ? ["creating_sandbox", "cloning", "inspecting", "planning", "installing", "starting", "diagnosing", "repairing", "verifying"].includes(
          run?.status ?? "",
        )
      : visibleCount > 0);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-archive-bg">
      <div className="border-b border-archive-border px-5 py-4 sm:px-6">
        <p className="text-xs font-medium text-amber-300/90">
          {isLive ? "Live infrastructure" : "Infrastructure"}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-archive-ink">
          {run?.status === "verifying"
            ? "Verifying resurrected preview"
            : "Spawning isolated environment"}
        </h2>
        <p className="mt-1 text-sm text-archive-muted">
          {owner}/{name} — Daytona sandbox{run?.detected?.isGui !== false ? " + Nosana visual proof" : ""}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-auto p-5 sm:p-6">
        <OrchestrationFlowDiagram activeStep={activeStep} />

        <div className="flex flex-1 flex-col gap-6 lg:flex-row">
          <div className="flex flex-1 flex-col gap-4">
            <div className="specimen-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-archive-ink">Daytona</p>
                  <p className="font-mono text-xs text-archive-muted">{sandboxId}</p>
                </div>
                <span
                  className={`ml-auto flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${
                    daytonaRunning
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-archive-border bg-white/[0.04] text-archive-faint"
                  }`}
                >
                  {daytonaRunning && (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  )}
                  {daytonaRunning ? "Running" : active ? "Starting" : "Standby"}
                </span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  { icon: Shield, label: "Egress blocked" },
                  { icon: Cpu, label: "Ephemeral disk" },
                  { icon: Link2, label: "Signed preview URL" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-lg border border-archive-border bg-black/20 px-3 py-2 text-xs text-archive-muted"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-archive-faint" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-sm p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-archive-border bg-white/[0.04] text-archive-muted">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-archive-ink">Nosana</p>
                  <p className="text-xs text-archive-muted">
                    {run?.visualProof?.summary ?? "Visual proof · GPU verification"}
                  </p>
                </div>
                <span
                  className={`ml-auto text-[10px] font-medium uppercase tracking-wide ${
                    nosanaStatus === "connected"
                      ? "text-emerald-300"
                      : nosanaStatus === "running"
                        ? "text-violet-300"
                        : "text-archive-faint"
                  }`}
                >
                  {nosanaLabel(nosanaStatus)}
                </span>
              </div>
              {run?.visualProof?.jobId && (
                <p className="mt-3 font-mono text-[10px] text-archive-faint">
                  job {run.visualProof.jobId}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col rounded-sm border border-archive-border bg-[#050505] font-mono text-xs">
            <div className="border-b border-archive-border px-4 py-2.5 text-archive-faint">
              infrastructure log
            </div>
            <div className="flex-1 space-y-2 overflow-auto p-4">
              {logLines.map((line) => (
                <div key={line.id} className="animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-emerald-400/90">→ {line.label}</p>
                  {line.detail && (
                    <p className="mt-0.5 pl-3 text-archive-faint">{line.detail}</p>
                  )}
                </div>
              ))}
              {active && logLines.length === 0 && (
                <p className="animate-pulse text-archive-faint">Connecting to resurrection API…</p>
              )}
              {active && isLive && !["success", "failed", "verifying"].includes(run?.status ?? "") && (
                <p className="animate-pulse text-archive-faint">Provisioning…</p>
              )}
              {active && run?.status === "verifying" && (
                <p className="animate-pulse text-violet-300/80">Nosana visual proof in progress…</p>
              )}
              {!active && (
                <p className="text-archive-faint">Awaiting approval to start provisioning…</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
