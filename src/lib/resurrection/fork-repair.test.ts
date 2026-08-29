import { describe, expect, it } from "vitest";

import type {
  CommandInput,
  CommandResult,
  ComputeProvider,
  ProcessLogs,
  ProcessRef,
  ProcessState,
  SandboxFile,
  SandboxRef,
} from "@/lib/compute/provider";
import type { RepairAction, RepairStrategy } from "@/lib/contracts/repair";
import type { ResurrectionAttempt } from "@/lib/contracts/run";
import { runParallelRepairs, type RepairRaceReporter } from "./fork-repair";

class ParallelProvider implements ComputeProvider {
  public readonly deletedIds: string[] = [];
  public readonly forkParents: string[] = [];
  private forkCount = 0;
  private releaseForks: (() => void) | undefined;
  private readonly forkGate = new Promise<void>((resolve: () => void) => { this.releaseForks = resolve; });

  public async fork(sandbox: SandboxRef, name: string): Promise<SandboxRef> {
    this.forkParents.push(sandbox.id);
    this.forkCount += 1;
    if (this.forkCount === 3) this.releaseForks?.();
    await this.forkGate;
    return { id: name.replace("seed-", "fork-"), name };
  }
  public async delete(sandbox: SandboxRef): Promise<void> { this.deletedIds.push(sandbox.id); }
  public async createSeed(): Promise<SandboxRef> { throw new Error("unused"); }
  public async clonePublicRepository(): Promise<{ commit: string }> { throw new Error("unused"); }
  public async createSnapshot(): Promise<{ name: string }> { throw new Error("unused"); }
  public async listFiles(): Promise<SandboxFile[]> { return []; }
  public async readTextFile(): Promise<string> { return ""; }
  public async writeTextFile(): Promise<void> {}
  public async runCommand(_sandbox: SandboxRef, _input: CommandInput): Promise<CommandResult> { throw new Error("unused"); }
  public async startProcess(): Promise<ProcessRef> { throw new Error("unused"); }
  public async getProcess(): Promise<ProcessState> { return { isAlive: true }; }
  public async getProcessLogs(): Promise<ProcessLogs> { return { stderr: "", stdout: "" }; }
  public async getSignedPreviewUrl(): Promise<string> { return "https://preview.test"; }
  public async stop(): Promise<void> {}
  public async deleteSnapshot(): Promise<void> {}
}

const strategies: [RepairStrategy, RepairStrategy, RepairStrategy] = [
  { actions: [{ command: "a", reason: "a", type: "run_command" }], hypothesis: "a", id: "repair-a", invasiveness: "source", title: "A" },
  { actions: [{ command: "nvm use 16", reason: "b", type: "run_command" }], hypothesis: "b", id: "repair-b", invasiveness: "environment", title: "B" },
  { actions: [{ command: "c", reason: "c", type: "run_command" }], hypothesis: "c", id: "repair-c", invasiveness: "config", title: "C" },
];

const reporter: RepairRaceReporter = {
  cleanup: async (): Promise<void> => {},
  finished: async (): Promise<void> => {},
  queued: async (): Promise<void> => {},
  running: async (): Promise<void> => {},
};

describe("runParallelRepairs", () => {
  it("forks exactly three repairs concurrently from the pristine seed", async () => {
    const provider = new ParallelProvider();
    await runParallelRepairs({
      deadline: 10_000,
      executor: async (input) => ({ actionSummaries: [], changedFiles: [], expectedPorts: [3000], process: { commandId: input.strategy.id, sessionId: input.strategy.id }, processStartedAtMs: 1 }),
      now: (): number => 1,
      profile: { evidence: [], framework: "Node.js", isGui: true, language: "javascript", likelyPorts: [3000], packageManager: "npm", startCommand: "npm start" },
      provider, reporter, repoRoot: "workspace/repo", seed: { id: "seed", name: "seed" }, strategies,
      verifier: { verify: async () => ({ httpStatus: 200, isVerified: true, port: 3000, previewUrl: "https://preview.test", processAlive: true }) },
    });

    expect(provider.forkParents).toEqual(["seed", "seed", "seed"]);
    expect(provider.deletedIds.sort()).toEqual(["fork-repair-a", "fork-repair-c"]);
  });

  it("returns explicit failure and deletes every fork when none verify", async () => {
    const provider = new ParallelProvider();
    const result = await runParallelRepairs({
      deadline: 10_000,
      executor: async (input) => ({ actionSummaries: [], changedFiles: [], expectedPorts: [3000], process: { commandId: input.strategy.id, sessionId: input.strategy.id }, processStartedAtMs: 1 }),
      now: (): number => 1,
      profile: { evidence: [], framework: "Node.js", isGui: true, language: "javascript", likelyPorts: [3000], packageManager: "npm", startCommand: "npm start" },
      provider, reporter, repoRoot: "workspace/repo", seed: { id: "seed", name: "seed" }, strategies,
      verifier: { verify: async () => ({ failureReason: "HTTP 503", isVerified: false, processAlive: true }) },
    });

    expect(result).toMatchObject({ status: "failed" });
    expect(provider.deletedIds.sort()).toEqual(["fork-repair-a", "fork-repair-b", "fork-repair-c"]);
  });

  it("measures boot time only from process start through verification", async () => {
    const provider = new ParallelProvider();
    const result = await runParallelRepairs({
      deadline: 10_000,
      executor: async (input) => ({ actionSummaries: [], changedFiles: [], expectedPorts: [3000], process: { commandId: input.strategy.id, sessionId: input.strategy.id }, processStartedAtMs: 80 }),
      now: (): number => 100,
      profile: { evidence: [], framework: "Node.js", isGui: true, language: "javascript", likelyPorts: [3000], packageManager: "npm", startCommand: "npm start" },
      provider, reporter, repoRoot: "workspace/repo", seed: { id: "seed", name: "seed" }, strategies,
      verifier: { verify: async () => ({ httpStatus: 200, isVerified: true, port: 3000, previewUrl: "https://preview.test", processAlive: true }) },
    });

    expect(result.attempts.every((attempt: ResurrectionAttempt): boolean => attempt.bootDurationMs === 20)).toBe(true);
  });

  it("rejects more than six actions before allocating a fork", async () => {
    const provider = new ParallelProvider();
    const action: RepairAction = { command: "node --version", reason: "probe", type: "run_command" };
    const oversizedStrategy = (strategy: RepairStrategy): RepairStrategy => ({
      ...strategy, actions: [action, action, action, action, action, action, action],
    });
    const oversized: [RepairStrategy, RepairStrategy, RepairStrategy] = [
      oversizedStrategy(strategies[0]), oversizedStrategy(strategies[1]), oversizedStrategy(strategies[2]),
    ];

    await expect(runParallelRepairs({
      deadline: 10_000,
      now: (): number => 1,
      profile: { evidence: [], framework: "Node.js", isGui: true, language: "javascript", likelyPorts: [3000], packageManager: "npm", startCommand: "npm start" },
      provider, reporter, repoRoot: "workspace/repo", seed: { id: "seed", name: "seed" }, strategies: oversized,
      verifier: { verify: async () => ({ httpStatus: 200, isVerified: true, port: 3000, previewUrl: "https://preview.test", processAlive: true }) },
    })).rejects.toThrow("one to six actions");
    expect(provider.forkParents).toEqual([]);
  });
});
