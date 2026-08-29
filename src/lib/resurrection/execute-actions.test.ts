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
import type { RepairStrategy } from "@/lib/contracts/repair";
import { executeRepairStrategy } from "./execute-actions";

class ActionProvider implements ComputeProvider {
  public readonly writes: Array<{ content: string; path: string }> = [];
  public constructor(private readonly files: Record<string, string>) {}
  public async readTextFile(_sandbox: SandboxRef, path: string): Promise<string> { return this.files[path] ?? ""; }
  public async writeTextFile(_sandbox: SandboxRef, path: string, content: string): Promise<void> { this.writes.push({ content, path }); }
  public async runCommand(_sandbox: SandboxRef, input: CommandInput): Promise<CommandResult> {
    const stdout = input.command.includes("git status") ? " M package.json\u0000" : "";
    return { durationMs: 1, exitCode: 0, stderr: "", stdout };
  }
  public async startProcess(_sandbox: SandboxRef, input: { command: string; cwd: string; sessionId: string }): Promise<ProcessRef> { return { commandId: input.command, sessionId: input.sessionId }; }
  public async createSeed(): Promise<SandboxRef> { throw new Error("unused"); }
  public async clonePublicRepository(): Promise<{ commit: string }> { throw new Error("unused"); }
  public async createSnapshot(): Promise<{ name: string }> { throw new Error("unused"); }
  public async fork(): Promise<SandboxRef> { throw new Error("unused"); }
  public async listFiles(): Promise<SandboxFile[]> { return []; }
  public async getProcess(): Promise<ProcessState> { return { isAlive: false }; }
  public async getProcessLogs(): Promise<ProcessLogs> { return { stderr: "", stdout: "" }; }
  public async getSignedPreviewUrl(): Promise<string> { throw new Error("unused"); }
  public async stop(): Promise<void> {}
  public async delete(): Promise<void> {}
  public async deleteSnapshot(): Promise<void> {}
}

const strategy = (search: string): RepairStrategy => ({
  actions: [{ path: "package.json", reason: "compatibility", replacement: "new", search, type: "replace_text" }],
  hypothesis: "compatibility",
  id: "repair-a",
  invasiveness: "config",
  title: "Compatibility",
});

const input = (provider: ComputeProvider, repair: RepairStrategy) => ({
  deadline: 10_000,
  now: (): number => 0,
  profile: { evidence: [], framework: "Node.js", isGui: true, language: "javascript" as const, likelyPorts: [3000], packageManager: "npm" as const, startCommand: "npm start" },
  provider,
  repoRoot: "workspace/repo",
  sandbox: { id: "fork-a", name: "fork-a" },
  strategy: repair,
});

describe("executeRepairStrategy", () => {
  it("applies one exact replacement inside the repository", async () => {
    const provider = new ActionProvider({ "workspace/repo/package.json": "old" });
    const result = await executeRepairStrategy(input(provider, strategy("old")));

    expect(provider.writes).toEqual([{ content: "new", path: "workspace/repo/package.json" }]);
    expect(result.changedFiles).toEqual(["package.json"]);
  });

  it("rejects a replacement that matches more than once", async () => {
    const provider = new ActionProvider({ "workspace/repo/package.json": "old old" });

    await expect(executeRepairStrategy(input(provider, strategy("old")))).rejects.toThrow("exactly once");
  });
});
