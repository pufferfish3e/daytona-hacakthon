import type { ComputeProvider, SandboxRef, SnapshotRef } from "@/lib/compute/provider";
import { RepairPlanSchema, type RepairStrategy } from "@/lib/contracts/repair";
import type { ProjectProfile, ResurrectionManifest, ResurrectionRun, RunStatus, VisualProofResult } from "@/lib/contracts/run";
import type { RunStore } from "@/lib/store/run-store";
import type { VisualProofAdapter } from "@/lib/nosana/nosana-visual-proof";
import { runBaseline, type BaselineFailure, type BaselineResult } from "./baseline";
import { withDeadline } from "./deadline";
import { detectProject } from "./detect";
import { assertBeforeDeadline, errorMessage, ResurrectionOrchestrationError, UnsupportedProjectError } from "./errors";
import { runParallelRepairs, type RepairRaceInput, type RepairRaceResult, type SuccessfulRepair } from "./fork-repair";
import { collectRepoEvidence, type RepoEvidence } from "./inspect";
import { TOTAL_RUN_TIMEOUT_MS, SEED_DISK_GIB } from "./limits";
import type { RepairPlanner } from "./repair-planner";
import { RunReporter, type SuccessfulRunUpdate } from "./run-reporter";
import { resolveScreenshotUrl } from "./screenshot-url";
import { isVerifiedWebProcess, type VerifiedWebProcess, type WebVerifier } from "./verify";

const REPO_ROOT = "workspace/repo";

export interface ResurrectionOrchestratorDependencies {
  store: RunStore;
  provider: ComputeProvider;
  planner: RepairPlanner;
  verifier: WebVerifier;
  visualProof?: VisualProofAdapter;
  now: () => Date;
  verifiedCapabilities: string[];
}

interface RunResources {
  seed?: SandboxRef;
  snapshot?: SnapshotRef;
  baseline?: SandboxRef;
  winner?: SandboxRef;
  deadline?: number;
  isCleaned: boolean;
}

interface PreparedRun {
  run: ResurrectionRun;
  reporter: RunReporter;
  resources: RunResources;
  deadline: number;
  evidence: RepoEvidence;
  profile: ProjectProfile;
}

export class ResurrectionOrchestrator {
  public constructor(private readonly dependencies: ResurrectionOrchestratorDependencies) {}

  public async run(runId: string): Promise<void> {
    const run = await this.dependencies.store.get(runId);
    if (run === undefined) throw new ResurrectionOrchestrationError(`Run ${runId} does not exist.`);
    const reporter = new RunReporter(this.dependencies.store, runId, this.dependencies.now);
    const resources: RunResources = { isCleaned: false };
    try {
      const prepared = await this.prepare(run, reporter, resources);
      await this.runBaselineAndRepairs(prepared);
    } catch (error: unknown) {
      await this.failRun(reporter, resources, errorMessage(error));
    }
  }

  private async prepare(run: ResurrectionRun, reporter: RunReporter, resources: RunResources): Promise<PreparedRun> {
    const startedAt = new Date(run.startedAt).getTime();
    if (!Number.isFinite(startedAt)) throw new ResurrectionOrchestrationError("Run start time is invalid.");
    const deadline = startedAt + TOTAL_RUN_TIMEOUT_MS;
    resources.deadline = deadline;
    assertBeforeDeadline(deadline, this.nowMs());
    await reporter.transition("creating_sandbox", "Creating a resource-limited pristine seed sandbox.");
    const seed = await this.createSeed(run, deadline);
    resources.seed = seed;
    const cloned = await this.cloneAndSnapshot(run, reporter, resources, seed);
    const evidence = await this.inspect(reporter, seed, cloned.commit, deadline);
    const profile = detectProject(evidence);
    await reporter.setDetected(profile);
    if (profile.installCommand === undefined || profile.startCommand === undefined) throw new UnsupportedProjectError();
    return { deadline, evidence, profile, reporter, resources, run };
  }

  private async createSeed(run: ResurrectionRun, deadline: number): Promise<SandboxRef> {
    return withDeadline(deadline, (): number => this.nowMs(), "seed allocation", () =>
      this.dependencies.provider.createSeed({
        cpu: 2, diskGiB: SEED_DISK_GIB, memoryGiB: 4, name: `resurrection-${run.id}-seed`, ttlMinutes: 15,
      }));
  }

  private async cloneAndSnapshot(
    run: ResurrectionRun,
    reporter: RunReporter,
    resources: RunResources,
    seed: SandboxRef,
  ): Promise<{ commit: string }> {
    await reporter.transition("cloning", "Cloning the public repository inside the pristine seed.");
    const deadline = requiredDeadline(resources);
    const cloned = await withDeadline(deadline, (): number => this.nowMs(), "repository clone", () =>
      this.dependencies.provider.clonePublicRepository(seed, { destination: REPO_ROOT, url: run.repoUrl }));
    const snapshot = await withDeadline(deadline, (): number => this.nowMs(), "pristine snapshot creation", () =>
      this.dependencies.provider.createSnapshot(seed, `resurrection-${run.id}-s0`));
    resources.snapshot = snapshot;
    await reporter.record("snapshot", "Created pristine snapshot S0 before dependency installation.", seed.id);
    return cloned;
  }

  private async inspect(reporter: RunReporter, seed: SandboxRef, commit: string, deadline: number): Promise<RepoEvidence> {
    await reporter.transition("inspecting", "Collecting bounded project evidence for deterministic detection.");
    return collectRepoEvidence({ commit, deadline, now: (): number => this.nowMs(), provider: this.dependencies.provider, repoRoot: REPO_ROOT, sandbox: seed });
  }

  private async runBaselineAndRepairs(context: PreparedRun): Promise<void> {
    const seed = requiredSeed(context.resources);
    const baseline = await runBaseline({
      deadline: context.deadline, now: (): number => this.nowMs(), onStage: this.baselineStageReporter(context.reporter),
      profile: context.profile, provider: this.dependencies.provider, repoRoot: REPO_ROOT,
      runId: context.run.id, seed, verifier: this.dependencies.verifier,
    });
    context.resources.baseline = baseline.sandbox;
    if (baseline.status === "success") {
      await this.completeBaseline(context, baseline);
      return;
    }
    await this.runRepairs(context, baseline.failure);
  }

  private baselineStageReporter(reporter: RunReporter): (stage: "install" | "start" | "verify") => Promise<void> {
    return async (stage: "install" | "start" | "verify"): Promise<void> => {
      const statuses: Record<typeof stage, RunStatus> = { install: "installing", start: "starting", verify: "verifying" };
      const summaries: Record<typeof stage, string> = {
        install: "Installing dependencies on the baseline child fork.",
        start: "Starting the detected project command on the baseline child fork.",
        verify: "Checking that the process remains alive and returns HTTP 200-399.",
      };
      await reporter.transition(statuses[stage], summaries[stage]);
    };
  }

  private async completeBaseline(context: PreparedRun, baseline: Extract<BaselineResult, { status: "success" }>): Promise<void> {
    if (!isVerifiedWebProcess(baseline.verification)) throw new ResurrectionOrchestrationError("Baseline success lacked objective verification evidence.");
    context.resources.winner = baseline.sandbox;
    const visualProof = await this.assessVisualProof(context, baseline.verification);
    await this.cleanupSuccess(context.reporter, context.resources, baseline.sandbox.id);
    await context.reporter.completeSuccess(successUpdate(context, baseline.verification, [], undefined, visualProof));
    context.resources.isCleaned = true;
  }

  private async runRepairs(context: PreparedRun, failure: BaselineFailure): Promise<void> {
    await context.reporter.transition("diagnosing", "Baseline startup failed; preparing three bounded repair hypotheses.", failure.summary);
    const rawPlan = await withDeadline(context.deadline, (): number => this.nowMs(), "repair planning", () =>
      this.dependencies.planner.plan({
        evidence: context.evidence, failure, profile: context.profile,
        verifiedCapabilities: [...this.dependencies.verifiedCapabilities],
      }));
    const plan = RepairPlanSchema.parse(rawPlan);
    await context.reporter.transition("repairing", "Racing exactly three isolated repair strategies from pristine snapshot S0.");
    const race = await runParallelRepairs(this.raceInput(context, plan.strategies));
    await this.completeRace(context, race);
  }

  private raceInput(context: PreparedRun, strategies: [RepairStrategy, RepairStrategy, RepairStrategy]): RepairRaceInput {
    return {
      deadline: context.deadline, now: (): number => this.nowMs(), profile: context.profile,
      provider: this.dependencies.provider, reporter: context.reporter, repoRoot: REPO_ROOT,
      seed: requiredSeed(context.resources), strategies, verifier: this.dependencies.verifier,
    };
  }

  private async completeRace(context: PreparedRun, race: RepairRaceResult): Promise<void> {
    if (race.status === "failed") {
      await this.cleanupFailure(context.reporter, context.resources);
      await context.reporter.completeFailure(race.failureReason);
      return;
    }
    context.resources.winner = race.winner.sandbox;
    await context.reporter.record("winner", `Selected ${race.winner.strategy.id} by deterministic preservation ranking.`, race.winner.sandbox.id);
    const visualProof = await this.assessVisualProof(context, race.winner.verification);
    await this.cleanupSuccess(context.reporter, context.resources, race.winner.sandbox.id);
    await context.reporter.completeSuccess(successUpdate(context, race.winner.verification, race.attempts, race.winner, visualProof));
    context.resources.isCleaned = true;
  }

  private async cleanupSuccess(reporter: RunReporter, resources: RunResources, winnerId: string): Promise<void> {
    const baseline = resources.baseline;
    const seed = resources.seed;
    const snapshot = resources.snapshot;
    if (baseline !== undefined && baseline.id !== winnerId) {
      await this.safeCleanup(reporter, resources, `Deleted baseline fork ${baseline.id}.`, baseline.id, () => this.dependencies.provider.delete(baseline));
    }
    if (seed !== undefined) {
      await this.safeCleanup(reporter, resources, `Stopped pristine seed ${seed.id}.`, seed.id, () => this.dependencies.provider.stop(seed));
      await this.safeCleanup(reporter, resources, `Deleted pristine seed ${seed.id}.`, seed.id, () => this.dependencies.provider.delete(seed));
    }
    if (snapshot !== undefined) await this.safeCleanup(reporter, resources, `Deleted pristine snapshot ${snapshot.name}.`, undefined, () => this.dependencies.provider.deleteSnapshot(snapshot));
  }

  private async cleanupFailure(reporter: RunReporter, resources: RunResources): Promise<void> {
    const snapshot = resources.snapshot;
    const seed = resources.seed;
    const sandboxes = uniqueSandboxes([resources.winner, resources.baseline]);
    for (const sandbox of sandboxes) await this.safeCleanup(reporter, resources, `Deleted child sandbox ${sandbox.id}.`, sandbox.id, () => this.dependencies.provider.delete(sandbox));
    if (snapshot !== undefined) await this.safeCleanup(reporter, resources, `Deleted pristine snapshot ${snapshot.name}.`, undefined, () => this.dependencies.provider.deleteSnapshot(snapshot));
    if (seed !== undefined) await this.safeCleanup(reporter, resources, `Deleted pristine seed ${seed.id}.`, seed.id, () => this.dependencies.provider.delete(seed));
    resources.isCleaned = true;
  }

  private async safeCleanup(reporter: RunReporter, resources: RunResources, summary: string, forkId: string | undefined, action: () => Promise<void>): Promise<void> {
    try {
      await withDeadline(requiredDeadline(resources), (): number => this.nowMs(), `cleanup ${forkId ?? "snapshot"}`, action);
      await reporter.record("cleanup", summary, forkId);
    } catch (error: unknown) {
      const reason = errorMessage(error);
      console.error("resurrection cleanup failed", { forkId, reason });
      try { await reporter.record("cleanup", `${summary} Cleanup failed.`, forkId, reason); }
      catch (reportError: unknown) { console.error("resurrection cleanup event failed", { forkId, reason: errorMessage(reportError) }); }
    }
  }

  private async failRun(reporter: RunReporter, resources: RunResources, reason: string): Promise<void> {
    if (!resources.isCleaned) await this.cleanupFailure(reporter, resources);
    await reporter.completeFailure(reason);
  }

  private async assessVisualProof(context: PreparedRun, verification: VerifiedWebProcess): Promise<VisualProofResult | undefined> {
    if (!context.profile.isGui || this.dependencies.visualProof === undefined) return undefined;
    const screenshotUrl = resolveScreenshotUrl(verification.previewUrl);
    if (screenshotUrl === undefined) {
      await context.reporter.record("verifying", "Skipped GPU visual proof because the preview URL is not a safe HTTPS URL.");
      return undefined;
    }
    await context.reporter.record("verifying", "Requesting optional GPU visual proof for the resurrected GUI.");
    try {
      return await this.dependencies.visualProof.assess({ screenshotUrl });
    } catch (error: unknown) {
      const reason = errorMessage(error);
      console.error("visual proof assessment failed", { runId: context.run.id, reason });
      await context.reporter.record("verifying", `GPU visual proof could not be completed: ${reason}`);
      return undefined;
    }
  }

  private nowMs(): number { return this.dependencies.now().getTime(); }
}

const successUpdate = (
  context: PreparedRun,
  verification: VerifiedWebProcess,
  attempts: ResurrectionRun["attempts"],
  winner?: SuccessfulRepair,
  visualProof?: VisualProofResult,
): SuccessfulRunUpdate => ({
  attempts, manifest: buildManifest(context, verification, winner), previewPort: verification.port,
  previewUrl: verification.previewUrl, visualProof,
});

const buildManifest = (context: PreparedRun, verification: VerifiedWebProcess, winner?: SuccessfulRepair): ResurrectionManifest => ({
  commit: context.evidence.commit, detectedFramework: context.profile.framework,
  installCommand: context.profile.installCommand, packageManager: context.profile.packageManager,
  port: verification.port, repairs: winnerRepairs(winner), repository: context.run.repoUrl,
  runtime: context.profile.runtime, startCommand: winningStartCommand(context.profile, winner),
});

const winnerRepairs = (winner?: SuccessfulRepair): Array<{ file?: string; summary: string }> => {
  if (winner === undefined) return [];
  const fileRepairs = winner.changedFiles.map((file: string): { file: string; summary: string } => ({ file, summary: `Changed by ${winner.strategy.id}.` }));
  return fileRepairs.length > 0 ? fileRepairs : winner.actionSummaries.map((summary: string) => ({ summary }));
};

const winningStartCommand = (profile: ProjectProfile, winner?: SuccessfulRepair): string => {
  const explicit = winner?.strategy.actions.findLast((action) => action.type === "try_start");
  if (explicit?.type === "try_start") return explicit.command;
  if (profile.startCommand === undefined) throw new UnsupportedProjectError();
  return profile.startCommand;
};

const uniqueSandboxes = (items: Array<SandboxRef | undefined>): SandboxRef[] => {
  const byId = new Map<string, SandboxRef>();
  for (const item of items) if (item !== undefined) byId.set(item.id, item);
  return [...byId.values()];
};

const requiredSeed = (resources: RunResources): SandboxRef => {
  if (resources.seed === undefined) throw new ResurrectionOrchestrationError("Pristine seed was not allocated.");
  return resources.seed;
};

const requiredDeadline = (resources: RunResources): number => {
  if (resources.deadline === undefined) throw new ResurrectionOrchestrationError("Run deadline was not initialized.");
  return resources.deadline;
};
