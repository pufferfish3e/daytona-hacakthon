import type { ResurrectionRun } from "@/lib/contracts/run";

export interface RunStore {
  create(run: ResurrectionRun): Promise<void>;
  get(id: string): Promise<ResurrectionRun | undefined>;
  update(id: string, updater: (run: ResurrectionRun) => ResurrectionRun): Promise<ResurrectionRun>;
}

export class RunStoreError extends Error {
  public readonly runId: string;

  public constructor(runId: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RunStoreError";
    this.runId = runId;
  }
}
