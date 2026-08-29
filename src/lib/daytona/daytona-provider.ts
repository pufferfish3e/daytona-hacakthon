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
import { createDaytonaClient, type DaytonaClient, type DaytonaSandboxClient } from "./client";
import { resolveRepositoryPath } from "./path-policy";

const PRODUCT_LABEL = "project-resurrection";
const SEED_ROLE = "seed";
const REPOSITORY_ROOT = "workspace/repo";
const REPOSITORY_ROOT_PREFIX = `${REPOSITORY_ROOT}/`;
const UTF8_ENCODING = "utf8";

export const createDaytonaProvider = (): DaytonaProvider => new DaytonaProvider(createDaytonaClient());

export class DaytonaProvider implements ComputeProvider {
  private readonly sandboxes = new Map<string, DaytonaSandboxClient>();

  public constructor(private readonly client: DaytonaClient) {}

  public async createSeed(input: CreateSeedInput): Promise<SandboxRef> {
    const sandbox = await this.client.createSandbox({
      cpu: input.cpu,
      diskGiB: input.diskGiB,
      labels: { product: PRODUCT_LABEL, role: SEED_ROLE },
      memoryGiB: input.memoryGiB,
      name: input.name,
      ttlMinutes: input.ttlMinutes,
    });
    return this.remember(sandbox);
  }

  public async clonePublicRepository(sandbox: SandboxRef, input: CloneInput): Promise<{ commit: string }> {
    await this.requireSandbox(sandbox).cloneRepository(input.url, input.destination);
    const result = await this.requireSandbox(sandbox).executeCommand("git rev-parse HEAD", input.destination, 30);
    return { commit: result.stdout.trim() };
  }

  public async createSnapshot(sandbox: SandboxRef, name: string): Promise<SnapshotRef> {
    await this.requireSandbox(sandbox).createSnapshot(name);
    return { name };
  }

  public async fork(sandbox: SandboxRef, name: string): Promise<SandboxRef> {
    const forkedSandbox = await this.requireSandbox(sandbox).fork(name);
    return this.remember(forkedSandbox);
  }

  public async listFiles(sandbox: SandboxRef, path: string, depth: number): Promise<SandboxFile[]> {
    const files = await this.requireSandbox(sandbox).listFiles(path, depth);
    return files.map((file): SandboxFile => ({
      isDirectory: file.isDirectory,
      path: file.path ?? path,
      sizeBytes: file.sizeBytes,
    }));
  }

  public async readTextFile(sandbox: SandboxRef, path: string): Promise<string> {
    const content = await this.requireSandbox(sandbox).downloadFile(path);
    return content.toString(UTF8_ENCODING);
  }

  public async writeTextFile(sandbox: SandboxRef, path: string, content: string): Promise<void> {
    const destination = resolveRepositoryPath(REPOSITORY_ROOT, relativeRepositoryPath(path));
    await this.requireSandbox(sandbox).uploadTextFile(destination, content);
  }

  public async runCommand(sandbox: SandboxRef, input: CommandInput): Promise<CommandResult> {
    const startedAt = Date.now();
    const result = await this.requireSandbox(sandbox).executeCommand(input.command, input.cwd, input.timeoutSeconds);
    return { durationMs: Date.now() - startedAt, exitCode: result.exitCode, stderr: "", stdout: result.stdout };
  }

  public async startProcess(sandbox: SandboxRef, input: StartProcessInput): Promise<ProcessRef> {
    const daytonaSandbox = this.requireSandbox(sandbox);
    await daytonaSandbox.createSession(input.sessionId);
    const process = await daytonaSandbox.executeSessionCommand(input.sessionId, input.command);
    return { commandId: process.commandId, sessionId: input.sessionId };
  }

  public async getProcess(sandbox: SandboxRef, process: ProcessRef): Promise<ProcessState> {
    const command = await this.requireSandbox(sandbox).getSessionCommand(process.sessionId, process.commandId);
    return command.exitCode === undefined ? { isAlive: true } : { exitCode: command.exitCode, isAlive: false };
  }

  public async getProcessLogs(sandbox: SandboxRef, process: ProcessRef): Promise<ProcessLogs> {
    const logs = await this.requireSandbox(sandbox).getSessionCommandLogs(process.sessionId, process.commandId);
    return { stderr: logs.stderr ?? "", stdout: logs.stdout ?? "" };
  }

  public async getSignedPreviewUrl(sandbox: SandboxRef, port: number): Promise<string> {
    return this.requireSandbox(sandbox).getSignedPreviewUrl(port);
  }

  public async stop(sandbox: SandboxRef): Promise<void> {
    await this.requireSandbox(sandbox).stop();
  }

  public async delete(sandbox: SandboxRef): Promise<void> {
    await this.requireSandbox(sandbox).delete();
    this.sandboxes.delete(sandbox.id);
  }

  public async deleteSnapshot(snapshot: SnapshotRef): Promise<void> {
    await this.client.deleteSnapshot(snapshot.name);
  }

  private remember(sandbox: DaytonaSandboxClient): SandboxRef {
    this.sandboxes.set(sandbox.id, sandbox);
    return { id: sandbox.id, name: sandbox.name };
  }

  private requireSandbox(sandbox: SandboxRef): DaytonaSandboxClient {
    const daytonaSandbox = this.sandboxes.get(sandbox.id);
    if (daytonaSandbox === undefined) throw new Error(`Daytona sandbox ${sandbox.id} is not managed by this provider.`);
    return daytonaSandbox;
  }
}

const relativeRepositoryPath = (path: string): string => {
  if (!path.startsWith(REPOSITORY_ROOT_PREFIX)) throw new Error(`Sandbox path is outside ${REPOSITORY_ROOT}.`);
  return path.slice(REPOSITORY_ROOT_PREFIX.length);
};
