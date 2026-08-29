import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

import { ResurrectionRunSchema, type ResurrectionRun } from "@/lib/contracts/run";
import { errorMessage } from "@/lib/contracts/validation";
import { RunStoreError, type RunStore } from "./run-store";

const RUN_ID_PATTERN = /^run_[0-9a-f-]{36}$/;

export class FileRunStore implements RunStore {
  private readonly pendingWrites = new Map<string, Promise<void>>();

  public constructor(private readonly directory: string) {}

  public async create(run: ResurrectionRun): Promise<void> {
    await this.enqueue(run.id, async (): Promise<void> => this.write(run));
  }

  public async get(id: string): Promise<ResurrectionRun | undefined> {
    this.assertRunId(id);
    try {
      const content = await readFile(this.filePath(id), "utf8");
      return ResurrectionRunSchema.parse(JSON.parse(content));
    } catch (error: unknown) {
      if (isNotFound(error)) return undefined;
      throw this.wrap(id, error);
    }
  }

  public async update(id: string, updater: (run: ResurrectionRun) => ResurrectionRun): Promise<ResurrectionRun> {
    let updated: ResurrectionRun | undefined;
    await this.enqueue(id, async (): Promise<void> => {
      const current = await this.get(id);
      if (!current) throw new RunStoreError(id, "Run does not exist.");
      updated = ResurrectionRunSchema.parse(updater(current));
      await this.write(updated);
    });
    if (!updated) throw new RunStoreError(id, "Run update did not complete.");
    return updated;
  }

  private async enqueue(id: string, operation: () => Promise<void>): Promise<void> {
    this.assertRunId(id);
    const previous = this.pendingWrites.get(id) ?? Promise.resolve();
    const current = previous.catch((): void => undefined).then(operation);
    this.pendingWrites.set(id, current);
    try { await current; } finally { if (this.pendingWrites.get(id) === current) this.pendingWrites.delete(id); }
  }

  private async write(run: ResurrectionRun): Promise<void> {
    this.assertRunId(run.id);
    try {
      await mkdir(this.directory, { recursive: true });
      const temporaryPath = `${this.filePath(run.id)}.${randomUUID()}.tmp`;
      await writeFile(temporaryPath, JSON.stringify(ResurrectionRunSchema.parse(run)), "utf8");
      await rename(temporaryPath, this.filePath(run.id));
    } catch (error: unknown) { throw this.wrap(run.id, error); }
  }

  private filePath(id: string): string { return join(this.directory, `${id}.json`); }
  private assertRunId(id: string): void { if (!RUN_ID_PATTERN.test(id)) throw new RunStoreError(id, "Run id is invalid."); }
  private wrap(id: string, error: unknown): RunStoreError { return error instanceof RunStoreError ? error : new RunStoreError(id, `Run store operation failed: ${errorMessage(error)}`, { cause: error }); }
}

const isNotFound = (error: unknown): boolean => isRecordWithCode(error) && error.code === "ENOENT";
const isRecordWithCode = (error: unknown): error is { code: unknown } => typeof error === "object" && error !== null && "code" in error;
