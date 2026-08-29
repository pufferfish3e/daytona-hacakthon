import { describe, expect, it } from "vitest";

import type { RepairStrategy } from "@/lib/contracts/repair";
import type { Invasiveness } from "@/lib/contracts/run";
import type { SuccessfulRepair } from "./fork-repair";
import { selectWinner } from "./select-winner";

const success = (id: string, invasiveness: Invasiveness, changedFiles: string[], bootDurationMs: number): SuccessfulRepair => ({
  actionSummaries: [],
  bootDurationMs,
  changedFiles,
  process: { commandId: id, sessionId: id },
  sandbox: { id, name: id },
  strategy: { actions: [], hypothesis: id, id: id as RepairStrategy["id"], invasiveness, title: id },
  verification: { httpStatus: 200, isVerified: true, port: 3000, previewUrl: "https://preview.test", processAlive: true },
});

describe("selectWinner", () => {
  it("prefers environment repair over a faster source repair", () => {
    const winner = selectWinner([
      success("repair-a", "source", ["a.ts"], 100),
      success("repair-b", "environment", [], 500),
    ]);

    expect(winner.strategy.id).toBe("repair-b");
  });

  it("uses files, boot duration, then strategy id as tie breakers", () => {
    const winner = selectWinner([
      success("repair-c", "config", ["a"], 200),
      success("repair-b", "config", ["a"], 200),
      success("repair-a", "config", ["a", "b"], 100),
    ]);

    expect(winner.strategy.id).toBe("repair-b");
  });

  it("does not trust an environment label on a source-writing strategy", () => {
    const misleading = success("repair-a", "environment", ["src/app.ts"], 10);
    misleading.strategy.actions = [{ content: "source", path: "src/app.ts", reason: "patch", type: "write_file" }];
    const winner = selectWinner([misleading, success("repair-b", "config", ["vercel.json"], 20)]);

    expect(winner.strategy.id).toBe("repair-b");
  });
});
