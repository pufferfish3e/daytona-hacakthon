import type {
  ProjectProfile,
  ResurrectionAttempt,
  ResurrectionManifest,
  ResurrectionRun,
  RunEvent,
  RunStatus,
} from "@/lib/contracts/run";
import type { RunStore } from "@/lib/store/run-store";
import type { SandboxRef } from "@/lib/compute/provider";
import type { RepairRaceReporter } from "./fork-repair";

export interface SuccessfulRunUpdate {
  attempts?: ResurrectionAttempt[];
  manifest: ResurrectionManifest;
  previewPort: number;
  previewUrl: string;
}

export class RunReporter implements RepairRaceReporter {
  public constructor(
    private readonly store: RunStore,
    private readonly runId: string,
    private readonly now: () => Date,
  ) {}

  public async transition(status: RunStatus, summary: string, technical?: string): Promise<void> {
    await this.updateWithEvent(status, summary, (run: ResurrectionRun): ResurrectionRun => ({ ...run, status }), undefined, technical);
  }

  public async setDetected(profile: ProjectProfile): Promise<void> {
    await this.store.update(this.runId, (run: ResurrectionRun): ResurrectionRun => ({ ...run, detected: profile }));
  }

  public async queued(attempts: ResurrectionAttempt[]): Promise<void> {
    await this.store.update(this.runId, (run: ResurrectionRun): ResurrectionRun => ({ ...run, attempts }));
  }

  public async running(strategyId: string, sandbox: SandboxRef): Promise<void> {
    await this.updateAttempt(strategyId, (attempt: ResurrectionAttempt): ResurrectionAttempt => ({
      ...attempt, sandboxId: sandbox.id, status: "running",
    }), `Repair ${strategyId} started on an isolated fork.`, sandbox.id);
  }

  public async finished(attempt: ResurrectionAttempt): Promise<void> {
    const summary = attempt.status === "success"
      ? `Repair ${attempt.id} passed objective verification.`
      : `Repair ${attempt.id} failed: ${attempt.failureReason ?? "unknown failure"}`;
    await this.updateAttempt(attempt.id, (): ResurrectionAttempt => attempt, summary, attempt.sandboxId);
  }

  public async cleanup(sandbox: SandboxRef, failureReason?: string): Promise<void> {
    const summary = failureReason === undefined
      ? `Deleted repair fork ${sandbox.id}.`
      : `Cleanup failed for repair fork ${sandbox.id}.`;
    if (failureReason !== undefined) {
      console.error("repair fork cleanup failed", { sandboxId: sandbox.id, reason: failureReason });
    }
    await this.record("cleanup", summary, sandbox.id, failureReason);
  }

  public async record(kind: RunEvent["kind"], summary: string, forkId?: string, technical?: string): Promise<void> {
    await this.updateWithEvent(kind, summary, (run: ResurrectionRun): ResurrectionRun => run, forkId, technical);
  }

  public async completeSuccess(input: SuccessfulRunUpdate): Promise<void> {
    await this.updateWithEvent("success", "Project startup and HTTP response were independently verified.", (run: ResurrectionRun): ResurrectionRun => ({
      ...run, attempts: input.attempts ?? run.attempts, completedAt: this.now().toISOString(), failureReason: undefined,
      manifest: input.manifest, previewPort: input.previewPort, previewUrl: input.previewUrl, status: "success",
    }));
  }

  public async completeFailure(failureReason: string): Promise<void> {
    await this.updateWithEvent("failed", failureReason, (run: ResurrectionRun): ResurrectionRun => ({
      ...run, completedAt: this.now().toISOString(), failureReason, previewPort: undefined,
      previewUrl: undefined, status: "failed",
    }));
  }

  private async updateAttempt(
    strategyId: string,
    updater: (attempt: ResurrectionAttempt) => ResurrectionAttempt,
    summary: string,
    forkId?: string,
  ): Promise<void> {
    await this.updateWithEvent("repairing", summary, (run: ResurrectionRun): ResurrectionRun => ({
      ...run, attempts: run.attempts.map((attempt: ResurrectionAttempt): ResurrectionAttempt =>
        attempt.id === strategyId ? updater(attempt) : attempt),
    }), forkId);
  }

  private async updateWithEvent(
    kind: RunEvent["kind"],
    summary: string,
    updater: (run: ResurrectionRun) => ResurrectionRun,
    forkId?: string,
    technical?: string,
  ): Promise<void> {
    await this.store.update(this.runId, (run: ResurrectionRun): ResurrectionRun => {
      const updated = updater(run);
      const event = this.createEvent(updated, kind, summary, forkId, technical);
      return { ...updated, events: [...updated.events, event] };
    });
  }

  private createEvent(
    run: ResurrectionRun,
    kind: RunEvent["kind"],
    summary: string,
    forkId?: string,
    technical?: string,
  ): RunEvent {
    return { at: this.now().toISOString(), forkId, id: `${this.runId}:event-${run.events.length + 1}`, kind, summary, technical };
  }
}
