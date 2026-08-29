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
import { verifyWebProcess } from "./verify";

class VerificationProvider implements ComputeProvider {
  public constructor(private readonly isAlive: boolean, private readonly logs: ProcessLogs) {}
  public async getProcess(): Promise<ProcessState> { return { isAlive: this.isAlive }; }
  public async getProcessLogs(): Promise<ProcessLogs> { return this.logs; }
  public async getSignedPreviewUrl(_sandbox: SandboxRef, port: number): Promise<string> { return `https://preview.test/${port}`; }
  public async createSeed(): Promise<SandboxRef> { throw new Error("unused"); }
  public async clonePublicRepository(): Promise<{ commit: string }> { throw new Error("unused"); }
  public async createSnapshot(): Promise<{ name: string }> { throw new Error("unused"); }
  public async fork(): Promise<SandboxRef> { throw new Error("unused"); }
  public async listFiles(): Promise<SandboxFile[]> { return []; }
  public async readTextFile(): Promise<string> { return ""; }
  public async writeTextFile(): Promise<void> {}
  public async runCommand(_sandbox: SandboxRef, _input: CommandInput): Promise<CommandResult> { throw new Error("unused"); }
  public async startProcess(): Promise<ProcessRef> { throw new Error("unused"); }
  public async stop(): Promise<void> {}
  public async delete(): Promise<void> {}
  public async deleteSnapshot(): Promise<void> {}
}

const processRef: ProcessRef = { commandId: "command", sessionId: "session" };
const sandbox: SandboxRef = { id: "sandbox", name: "sandbox" };

describe("verifyWebProcess", () => {
  it("accepts only a live process and HTTP 200-399", async () => {
    const provider = new VerificationProvider(true, { stderr: "", stdout: "ready at http://localhost:5173" });
    const result = await verifyWebProcess({
      likelyPorts: [3000], now: (): number => 0, process: processRef, provider,
      request: async (url: string): Promise<number> => url.endsWith("5173") ? 302 : 503,
      sandbox, timeoutAt: 10_000,
    });

    expect(result).toMatchObject({ httpStatus: 302, isVerified: true, port: 5173, processAlive: true });
  });

  it("rejects an HTTP success after the process exits", async () => {
    const provider = new VerificationProvider(false, { stderr: "", stdout: "" });
    const result = await verifyWebProcess({
      likelyPorts: [3000], now: (): number => 0, process: processRef, provider,
      request: async (): Promise<number> => 200, sandbox, timeoutAt: 10_000,
    });

    expect(result).toMatchObject({ isVerified: false, processAlive: false });
  });

  it("fails without probing after its deadline", async () => {
    let probes = 0;
    const provider = new VerificationProvider(true, { stderr: "", stdout: "" });
    const result = await verifyWebProcess({
      likelyPorts: [3000], now: (): number => 10_000, process: processRef, provider,
      request: async (): Promise<number> => { probes += 1; return 200; }, sandbox, timeoutAt: 10_000,
    });

    expect(result.isVerified).toBe(false);
    expect(probes).toBe(0);
  });

  it("retries readiness failures within the deadline", async () => {
    let probes = 0;
    const provider = new VerificationProvider(true, { stderr: "", stdout: "" });
    const result = await verifyWebProcess({
      likelyPorts: [3000], now: (): number => 0, process: processRef, provider,
      request: async (): Promise<number> => { probes += 1; return probes === 1 ? 503 : 200; },
      sandbox, timeoutAt: 10_000, wait: async (): Promise<void> => {},
    });

    expect(result).toMatchObject({ httpStatus: 200, isVerified: true, processAlive: true });
    expect(probes).toBe(2);
  });
});
