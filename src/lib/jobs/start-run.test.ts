import { describe, expect, it } from "vitest";

import type { ResurrectionRun } from "@/lib/contracts/run";
import { createRun, type CreateRunDependencies } from "./start-run";

const createRunServiceFixture = (calls: string[]): CreateRunDependencies => ({
  store: {
    create: async (_run: ResurrectionRun): Promise<void> => { calls.push("store.create"); },
    get: async (_id: string): Promise<ResurrectionRun | undefined> => undefined,
    update: async (_id, updater): Promise<ResurrectionRun> => updater({} as ResurrectionRun),
  },
  jobs: { start: (_runId: string): void => { calls.push("jobs.start"); } },
  now: (): Date => new Date("2026-08-29T00:00:00.000Z"),
  randomUuid: (): string => "00000000-0000-4000-8000-000000000000",
});

describe("createRun", () => {
  it("writes a queued run before starting background work", async () => {
    const calls: string[] = [];
    const result = await createRun("https://github.com/acme/app", createRunServiceFixture(calls));

    expect(result.id).toMatch(/^run_/);
    expect(calls).toEqual(["store.create", "jobs.start"]);
  });

  it("rejects invalid URLs before writing a run", async () => {
    const calls: string[] = [];

    await expect(createRun("https://evil.example/app", createRunServiceFixture(calls))).rejects.toThrow(
      "public HTTPS GitHub URL",
    );
    expect(calls).toEqual([]);
  });
});
