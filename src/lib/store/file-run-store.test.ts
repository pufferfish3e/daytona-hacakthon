import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createQueuedRun, type RunEvent } from "@/lib/contracts/run";
import { FileRunStore } from "./file-run-store";

const event = (summary: string): RunEvent => ({
  id: `event-${summary}`,
  at: "2026-08-29T00:00:00.000Z",
  kind: "queued",
  summary,
});

describe("FileRunStore", () => {
  it("serializes concurrent updates for one run", async () => {
    const directory = await mkdtemp(join(tmpdir(), "resurrection-store-test-"));
    const store = new FileRunStore(directory);
    const run = createQueuedRun(
      "run_00000000-0000-4000-8000-000000000000",
      "https://github.com/acme/app.git",
      "acme",
      "app",
    );
    await store.create(run);

    await Promise.all([
      store.update(run.id, (current) => ({ ...current, events: [...current.events, event("one")] })),
      store.update(run.id, (current) => ({ ...current, events: [...current.events, event("two")] })),
    ]);

    expect((await store.get(run.id))?.events.map((item) => item.summary).sort()).toEqual(["Run queued.", "one", "two"]);
  });
});
