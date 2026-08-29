import { describe, expect, it } from "vitest";

import type { ResurrectionRun } from "@/lib/contracts/run";
import type { CreateRunDependencies } from "@/lib/jobs/start-run";
import { createPostRunHandler } from "./route";

const dependencies: CreateRunDependencies = {
  jobs: { start: (_runId: string): void => undefined },
  now: (): Date => new Date("2026-08-29T00:00:00.000Z"),
  randomUuid: (): string => "00000000-0000-4000-8000-000000000000",
  store: {
    create: async (_run: ResurrectionRun): Promise<void> => undefined,
    get: async (_id: string): Promise<ResurrectionRun | undefined> => undefined,
    update: async (_id: string, updater: (run: ResurrectionRun) => ResurrectionRun): Promise<ResurrectionRun> => updater({} as ResurrectionRun),
  },
};

describe("POST /api/runs", () => {
  it("stays unavailable when a run service is not composed", async () => {
    const response = await createPostRunHandler()(new Request("http://localhost/api/runs", { method: "POST" }));

    expect(response.status).toBe(503);
  });

  it("returns 202 for a safely parsed GitHub URL when a service is composed", async () => {
    const response = await createPostRunHandler(dependencies)(new Request("http://localhost/api/runs", {
      body: JSON.stringify({ repoUrl: "https://github.com/acme/app" }), method: "POST",
    }));

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ id: "run_00000000-0000-4000-8000-000000000000" });
  });
});
