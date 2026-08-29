import { describe, expect, it } from "vitest";

import type {
  CloneInput,
  CommandInput,
  CommandResult,
  ComputeProvider,
  CreateSeedInput,
  ProcessLogs,
  ProcessRef,
  ProcessState,
  SandboxFile,
  SandboxRef,
  SnapshotRef,
  StartProcessInput,
} from "@/lib/compute/provider";
import { createQueuedRun, type ResurrectionRun } from "@/lib/contracts/run";
import type { RunStore } from "@/lib/store/run-store";
import { ResurrectionOrchestrator } from "./orchestrator";
import type { RepairPlanner } from "./repair-planner";

class MemoryRunStore implements RunStore {
  public constructor(private run: ResurrectionRun) {}
  public async create(run: ResurrectionRun): Promise<void> { this.run = run; }
  public async get(id: string): Promise<ResurrectionRun | undefined> { return this.run.id === id ? this.run : undefined; }
  public async update(_id: string, updater: (run: ResurrectionRun) => ResurrectionRun): Promise<ResurrectionRun> { this.run = updater(this.run); return this.run; }
}

class OrchestratorProvider implements ComputeProvider {
  public readonly calls: string[] = [];
  public async createSeed(_input: CreateSeedInput): Promise<SandboxRef> { this.calls.push("createSeed"); return { id: "seed", name: "seed" }; }
  public async clonePublicRepository(_sandbox: SandboxRef, _input: CloneInput): Promise<{ commit: string }> { this.calls.push("clone"); return { commit: "abc123" }; }
  public async createSnapshot(): Promise<SnapshotRef> { this.calls.push("snapshot"); return { name: "s0" }; }
  public async listFiles(): Promise<SandboxFile[]> { this.calls.push("inspect"); return [{ isDirectory: false, path: "workspace/repo/package-lock.json", sizeBytes: 2 }, { isDirectory: false, path: "workspace/repo/package.json", sizeBytes: 100 }]; }
  public async readTextFile(_sandbox: SandboxRef, path: string): Promise<string> { return path.endsWith("package-lock.json") ? "{}" : JSON.stringify({ dependencies: { next: "12" }, scripts: { dev: "next dev" } }); }
  public async fork(sandbox: SandboxRef): Promise<SandboxRef> { this.calls.push(`fork:${sandbox.id}`); return { id: "baseline", name: "baseline" }; }
  public async runCommand(sandbox: SandboxRef, input: CommandInput): Promise<CommandResult> { this.calls.push(`run:${sandbox.id}:${input.command}`); return { durationMs: 1, exitCode: 0, stderr: "", stdout: "" }; }
  public async startProcess(sandbox: SandboxRef, input: StartProcessInput): Promise<ProcessRef> { this.calls.push(`start:${sandbox.id}:${input.command}`); return { commandId: "command", sessionId: input.sessionId }; }
  public async stop(sandbox: SandboxRef): Promise<void> { this.calls.push(`stop:${sandbox.id}`); }
  public async delete(sandbox: SandboxRef): Promise<void> { this.calls.push(`delete:${sandbox.id}`); }
  public async deleteSnapshot(snapshot: SnapshotRef): Promise<void> { this.calls.push(`deleteSnapshot:${snapshot.name}`); }
  public async writeTextFile(): Promise<void> {}
  public async getProcess(): Promise<ProcessState> { return { isAlive: true }; }
  public async getProcessLogs(): Promise<ProcessLogs> { return { stderr: "", stdout: "" }; }
  public async getSignedPreviewUrl(): Promise<string> { return "https://preview.test"; }
}

describe("ResurrectionOrchestrator", () => {
  it("completes a deterministic baseline without planning repairs", async () => {
    const runId = "run_00000000-0000-4000-8000-000000000000";
    const store = new MemoryRunStore(createQueuedRun(runId, "https://github.com/acme/app.git", "acme", "app", "2026-08-29T00:00:00.000Z"));
    const provider = new OrchestratorProvider();
    const planner: RepairPlanner = { plan: async () => { throw new Error("planner should not run"); } };
    const orchestrator = new ResurrectionOrchestrator({
      now: () => new Date("2026-08-29T00:00:01.000Z"), planner, provider, store,
      verifier: { verify: async () => ({ httpStatus: 200, isVerified: true, port: 3000, previewUrl: "https://preview.test", processAlive: true }) },
      verifiedCapabilities: [],
    });

    await orchestrator.run(runId);

    expect(await store.get(runId)).toMatchObject({ previewPort: 3000, previewUrl: "https://preview.test", status: "success" });
    expect(provider.calls).toEqual([
      "createSeed", "clone", "snapshot", "inspect", "fork:seed", "run:baseline:npm ci",
      "start:baseline:npm run dev", "stop:seed", "delete:seed", "deleteSnapshot:s0",
    ]);
  });

  it("persists optional visual proof for GUI projects", async () => {
    const runId = "run_11111111-1111-4111-8111-111111111111";
    const store = new MemoryRunStore(createQueuedRun(runId, "https://github.com/acme/gui.git", "acme", "gui", "2026-08-29T00:00:00.000Z"));
    const provider = new OrchestratorProvider();
    const planner: RepairPlanner = { plan: async () => { throw new Error("planner should not run"); } };
    const orchestrator = new ResurrectionOrchestrator({
      now: () => new Date("2026-08-29T00:00:01.000Z"),
      planner,
      provider,
      store,
      verifier: { verify: async () => ({ httpStatus: 200, isVerified: true, port: 3000, previewUrl: "https://preview.test", processAlive: true }) },
      verifiedCapabilities: [],
      visualProof: {
        assess: async () => ({
          durationMs: 12,
          label: "meaningful_ui",
          provider: "nosana",
          status: "passed",
          summary: "Detected a meaningful UI.",
        }),
      },
    });

    await orchestrator.run(runId);

    expect(await store.get(runId)).toMatchObject({
      status: "success",
      visualProof: {
        label: "meaningful_ui",
        provider: "nosana",
        status: "passed",
        summary: "Detected a meaningful UI.",
      },
    });
  });
});
