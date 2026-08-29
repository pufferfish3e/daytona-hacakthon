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
import { runBaseline } from "./baseline";
import type { WebVerifier } from "./verify";

class BaselineProvider implements ComputeProvider {
  public readonly calls: string[] = [];
  public readonly commandSandboxes: string[] = [];
  public installExitCode = 0;
  public async fork(sandbox: SandboxRef): Promise<SandboxRef> { this.calls.push(`fork:${sandbox.id}`); return { id: "baseline", name: "baseline" }; }
  public async runCommand(sandbox: SandboxRef, input: CommandInput): Promise<CommandResult> { this.calls.push(`run:${input.command}`); this.commandSandboxes.push(sandbox.id); return { durationMs: 1, exitCode: this.installExitCode, stderr: "install error", stdout: "install output" }; }
  public async startProcess(_sandbox: SandboxRef, input: StartProcessInput): Promise<ProcessRef> { this.calls.push(`start:${input.command}`); return { commandId: "command", sessionId: input.sessionId }; }
  public async createSeed(_input: CreateSeedInput): Promise<SandboxRef> { throw new Error("unused"); }
  public async clonePublicRepository(_sandbox: SandboxRef, _input: CloneInput): Promise<{ commit: string }> { throw new Error("unused"); }
  public async createSnapshot(): Promise<SnapshotRef> { throw new Error("unused"); }
  public async listFiles(): Promise<SandboxFile[]> { return []; }
  public async readTextFile(): Promise<string> { return ""; }
  public async writeTextFile(): Promise<void> {}
  public async getProcess(): Promise<ProcessState> { return { isAlive: true }; }
  public async getProcessLogs(): Promise<ProcessLogs> { return { stderr: "", stdout: "" }; }
  public async getSignedPreviewUrl(): Promise<string> { return ""; }
  public async stop(): Promise<void> {}
  public async delete(): Promise<void> {}
  public async deleteSnapshot(): Promise<void> {}
}

const profile = {
  evidence: [], framework: "Next.js", installCommand: "npm ci", isGui: true,
  language: "typescript" as const, likelyPorts: [3000], packageManager: "npm" as const,
  startCommand: "npm run dev",
};

describe("runBaseline", () => {
  it("installs and starts only on a child of the pristine seed", async () => {
    const provider = new BaselineProvider();
    const verifier: WebVerifier = { verify: async () => ({ httpStatus: 200, isVerified: true, port: 3000, previewUrl: "https://preview.test", processAlive: true }) };
    const result = await runBaseline({ deadline: 10_000, now: (): number => 0, profile, provider, repoRoot: "workspace/repo", runId: "run_1", seed: { id: "seed", name: "seed" }, verifier });

    expect(result.status).toBe("success");
    expect(provider.calls).toEqual(["fork:seed", "run:npm ci", "start:npm run dev"]);
    expect(provider.commandSandboxes).toEqual(["baseline"]);
  });

  it("does not start when installation fails", async () => {
    const provider = new BaselineProvider();
    provider.installExitCode = 1;
    const verifier: WebVerifier = { verify: async () => { throw new Error("should not verify"); } };
    const result = await runBaseline({ deadline: 10_000, now: (): number => 0, profile, provider, repoRoot: "workspace/repo", runId: "run_1", seed: { id: "seed", name: "seed" }, verifier });

    expect(result).toMatchObject({ failure: { stage: "install" }, status: "failed" });
    expect(provider.calls).toEqual(["fork:seed", "run:npm ci"]);
  });

  it("preserves verifier logs in a baseline verification failure", async () => {
    const provider = new BaselineProvider();
    const verifier: WebVerifier = { verify: async () => ({
      failureReason: "HTTP 503", isVerified: false, processAlive: true,
      stderr: "startup warning", stdout: "listening soon",
    }) };
    const result = await runBaseline({ deadline: 10_000, now: (): number => 0, profile, provider, repoRoot: "workspace/repo", runId: "run_1", seed: { id: "seed", name: "seed" }, verifier });

    expect(result).toMatchObject({
      failure: { stage: "verify", stderr: "startup warning", stdout: "listening soon" },
      status: "failed",
    });
  });
});
