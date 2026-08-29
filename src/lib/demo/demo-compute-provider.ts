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

const DEMO_DELAY_MS = 20;
const DEMO_COMMIT = "demo-nextjs-commit";
const DEMO_PACKAGE_JSON = JSON.stringify({
  dependencies: { next: "16.3.3" },
  scripts: { dev: "next dev" },
});
const DEMO_PACKAGE_LOCK = JSON.stringify({ lockfileVersion: 3, name: "demo-nextjs-project" });
const REPO_ROOT = "workspace/repo";

export class DemoComputeProvider implements ComputeProvider {
  private sandboxSequence = 0;

  public async createSeed(_input: CreateSeedInput): Promise<SandboxRef> {
    void _input;
    await demoDelay();
    return this.createSandbox("seed");
  }

  public async clonePublicRepository(_sandbox: SandboxRef, _input: CloneInput): Promise<{ commit: string }> {
    void _sandbox;
    void _input;
    await demoDelay();
    return { commit: DEMO_COMMIT };
  }

  public async createSnapshot(_sandbox: SandboxRef, name: string): Promise<SnapshotRef> {
    void _sandbox;
    await demoDelay();
    return { name };
  }

  public async fork(_sandbox: SandboxRef, name: string): Promise<SandboxRef> {
    void _sandbox;
    await demoDelay();
    return this.createSandbox(name);
  }

  public async listFiles(_sandbox: SandboxRef, _path: string, _depth: number): Promise<SandboxFile[]> {
    void _sandbox;
    void _path;
    void _depth;
    await demoDelay();
    return [
      { isDirectory: false, path: `${REPO_ROOT}/package-lock.json`, sizeBytes: DEMO_PACKAGE_LOCK.length },
      { isDirectory: false, path: `${REPO_ROOT}/package.json`, sizeBytes: DEMO_PACKAGE_JSON.length },
    ];
  }

  public async readTextFile(_sandbox: SandboxRef, path: string): Promise<string> {
    void _sandbox;
    await demoDelay();
    return path.endsWith("package-lock.json") ? DEMO_PACKAGE_LOCK : DEMO_PACKAGE_JSON;
  }

  public async writeTextFile(_sandbox: SandboxRef, _path: string, _content: string): Promise<void> {
    void _sandbox;
    void _path;
    void _content;
    await demoDelay();
  }

  public async runCommand(_sandbox: SandboxRef, _input: CommandInput): Promise<CommandResult> {
    void _sandbox;
    void _input;
    await demoDelay();
    return { durationMs: DEMO_DELAY_MS, exitCode: 0, stderr: "", stdout: "Demo npm install completed." };
  }

  public async startProcess(_sandbox: SandboxRef, input: StartProcessInput): Promise<ProcessRef> {
    void _sandbox;
    await demoDelay();
    return { commandId: "demo-nextjs-process", sessionId: input.sessionId };
  }

  public async getProcess(_sandbox: SandboxRef, _process: ProcessRef): Promise<ProcessState> {
    void _sandbox;
    void _process;
    await demoDelay();
    return { isAlive: true };
  }

  public async getProcessLogs(_sandbox: SandboxRef, _process: ProcessRef): Promise<ProcessLogs> {
    void _sandbox;
    void _process;
    await demoDelay();
    return { stderr: "", stdout: "ready - started server on http://localhost:3000" };
  }

  public async getSignedPreviewUrl(sandbox: SandboxRef, port: number): Promise<string> {
    await demoDelay();
    return `https://demo.invalid/${sandbox.id}:${port}`;
  }

  public async stop(_sandbox: SandboxRef): Promise<void> {
    void _sandbox;
    await demoDelay();
  }

  public async delete(_sandbox: SandboxRef): Promise<void> {
    void _sandbox;
    await demoDelay();
  }

  public async deleteSnapshot(_snapshot: SnapshotRef): Promise<void> {
    void _snapshot;
    await demoDelay();
  }

  private createSandbox(name: string): SandboxRef {
    this.sandboxSequence += 1;
    return { id: `demo-sandbox-${this.sandboxSequence}`, name };
  }
}

const demoDelay = async (): Promise<void> => {
  await new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, DEMO_DELAY_MS);
  });
};
