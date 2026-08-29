import { randomUUID } from "node:crypto";

import type { ResurrectionRun } from "@/lib/contracts/run";
import { errorMessage } from "@/lib/contracts/validation";
import { parsePublicGitHubUrl } from "@/lib/github/parse-url";
import type { RunStore } from "@/lib/store/run-store";
import { createQueuedRun } from "@/lib/contracts/run";

export interface RunJob { start(runId: string): void; }
export interface CreateRunDependencies { store: RunStore; jobs: RunJob; now: () => Date; randomUuid: () => string; }
export interface RunOrchestrator { run(runId: string): Promise<void>; }
export interface RunServiceCompositionInput {
  store: RunStore;
  orchestrator: RunOrchestrator;
  now?: () => Date;
  randomUuid?: () => string;
}

export const createRun = async (repoUrl: string, dependencies: CreateRunDependencies): Promise<{ id: string }> => {
  const repository = parsePublicGitHubUrl(repoUrl);
  const id = `run_${dependencies.randomUuid()}`;
  const run = createQueuedRun(id, repository.canonicalUrl, repository.owner, repository.repo, dependencies.now().toISOString());
  await dependencies.store.create(run);
  dependencies.jobs.start(id);
  return { id };
};

export class StartRunJob implements RunJob {
  public constructor(private readonly orchestrator: RunOrchestrator, private readonly store: RunStore) {}

  public start(runId: string): void {
    void this.orchestrator.run(runId).catch((error: unknown): Promise<void> => this.handleFailure(runId, error));
  }

  private async handleFailure(runId: string, error: unknown): Promise<void> {
    const reason = errorMessage(error);
    console.error("resurrection job failed", { runId, error: reason });
    try { await this.markFailed(runId, reason); } catch (storeError: unknown) { console.error("resurrection failure persistence failed", { runId, error: errorMessage(storeError) }); }
  }

  private async markFailed(runId: string, failureReason: string): Promise<ResurrectionRun> {
    return this.store.update(runId, (run: ResurrectionRun): ResurrectionRun => ({ ...run, status: "failed", failureReason, completedAt: new Date().toISOString() }));
  }
}

export const composeRunService = (input: RunServiceCompositionInput): CreateRunDependencies => {
  return {
    store: input.store,
    jobs: new StartRunJob(input.orchestrator, input.store),
    now: input.now ?? (() => new Date()),
    randomUuid: input.randomUuid ?? randomUUID,
  };
};
