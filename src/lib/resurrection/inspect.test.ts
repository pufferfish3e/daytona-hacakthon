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
import { collectRepoEvidence } from "./inspect";

class EvidenceProvider implements ComputeProvider {
  public readonly reads: string[] = [];
  public async listFiles(): Promise<SandboxFile[]> { return [
    { isDirectory: true, path: "workspace/repo/package-lock.json", sizeBytes: 0 },
    { isDirectory: false, path: "workspace/repo/README.md" },
    { isDirectory: false, path: "workspace/repo/package.json", sizeBytes: 2 },
  ]; }
  public async readTextFile(_sandbox: SandboxRef, path: string): Promise<string> { this.reads.push(path); return "{}"; }
  public async createSeed(): Promise<SandboxRef> { throw new Error("unused"); }
  public async clonePublicRepository(): Promise<{ commit: string }> { throw new Error("unused"); }
  public async createSnapshot(): Promise<{ name: string }> { throw new Error("unused"); }
  public async fork(): Promise<SandboxRef> { throw new Error("unused"); }
  public async writeTextFile(): Promise<void> {}
  public async runCommand(_sandbox: SandboxRef, _input: CommandInput): Promise<CommandResult> { throw new Error("unused"); }
  public async startProcess(): Promise<ProcessRef> { throw new Error("unused"); }
  public async getProcess(): Promise<ProcessState> { return { isAlive: false }; }
  public async getProcessLogs(): Promise<ProcessLogs> { return { stderr: "", stdout: "" }; }
  public async getSignedPreviewUrl(): Promise<string> { throw new Error("unused"); }
  public async stop(): Promise<void> {}
  public async delete(): Promise<void> {}
  public async deleteSnapshot(): Promise<void> {}
}

describe("collectRepoEvidence", () => {
  it("skips directories and files without a known bounded size", async () => {
    const provider = new EvidenceProvider();
    const result = await collectRepoEvidence({
      commit: "abc", deadline: 10_000, now: (): number => 0, provider,
      repoRoot: "workspace/repo", sandbox: { id: "seed", name: "seed" },
    });

    expect(result.rootFiles).toEqual(["package.json", "README.md"]);
    expect(provider.reads).toEqual(["workspace/repo/package.json"]);
  });
});
