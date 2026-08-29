import { Daytona, type Sandbox } from "@daytona/sdk";

export interface DaytonaSandboxClient {
  readonly id: string;
  readonly name: string;
  cloneRepository(url: string, destination: string): Promise<void>;
  createSnapshot(name: string): Promise<void>;
  fork(name: string): Promise<DaytonaSandboxClient>;
  listFiles(path: string, depth: number): Promise<DaytonaFileInfo[]>;
  downloadFile(path: string): Promise<Buffer>;
  uploadTextFile(path: string, content: string): Promise<void>;
  executeCommand(command: string, cwd: string, timeoutSeconds: number): Promise<DaytonaCommandResult>;
  createSession(sessionId: string): Promise<void>;
  executeSessionCommand(sessionId: string, command: string): Promise<DaytonaSessionCommand>;
  getSessionCommand(sessionId: string, commandId: string): Promise<DaytonaSessionCommandStatus>;
  getSessionCommandLogs(sessionId: string, commandId: string): Promise<DaytonaCommandLogs>;
  getSignedPreviewUrl(port: number): Promise<string>;
  stop(): Promise<void>;
  delete(): Promise<void>;
}

export interface DaytonaClient {
  createSandbox(input: DaytonaSandboxCreateInput): Promise<DaytonaSandboxClient>;
  deleteSnapshot(name: string): Promise<void>;
}

export interface DaytonaSandboxCreateInput {
  name: string;
  cpu: number;
  memoryGiB: number;
  diskGiB: number;
  ttlMinutes: number;
  labels: Record<string, string>;
}

export interface DaytonaFileInfo {
  path?: string;
  isDirectory: boolean;
  sizeBytes: number;
}

export interface DaytonaCommandResult {
  exitCode: number;
  stdout: string;
}

export interface DaytonaSessionCommand {
  commandId: string;
}

export interface DaytonaSessionCommandStatus {
  exitCode?: number;
}

export interface DaytonaCommandLogs {
  stdout?: string;
  stderr?: string;
}

const SANDBOX_LANGUAGE = "typescript";
const SANDBOX_IMAGE = "node:20-bookworm";
const CLONE_DEPTH = 1;
const SNAPSHOT_TIMEOUT_SECONDS = 60;
const FORK_TIMEOUT_SECONDS = 60;
const SESSION_COMMAND_TIMEOUT_SECONDS = 30;
const PREVIEW_URL_TTL_SECONDS = 3_600;
const STOP_TIMEOUT_SECONDS = 60;
const DELETE_TIMEOUT_SECONDS = 60;
const UTF8_ENCODING = "utf8";

export const createDaytonaClient = (): DaytonaClient => new DaytonaSdkClient(new Daytona());

class DaytonaSdkClient implements DaytonaClient {
  public constructor(private readonly daytona: Daytona) {}

  public async createSandbox(input: DaytonaSandboxCreateInput): Promise<DaytonaSandboxClient> {
    const sandbox = await this.daytona.create({
      image: SANDBOX_IMAGE,
      labels: input.labels,
      language: SANDBOX_LANGUAGE,
      name: input.name,
      resources: { cpu: input.cpu, disk: input.diskGiB, memory: input.memoryGiB },
      ttlMinutes: input.ttlMinutes,
    });
    return new DaytonaSdkSandboxClient(sandbox);
  }

  public async deleteSnapshot(name: string): Promise<void> {
    await this.daytona.snapshot.delete(name);
  }
}

class DaytonaSdkSandboxClient implements DaytonaSandboxClient {
  public constructor(private readonly sandbox: Sandbox) {}

  public get id(): string {
    return this.sandbox.id;
  }

  public get name(): string {
    return this.sandbox.name;
  }

  public async cloneRepository(url: string, destination: string): Promise<void> {
    await this.sandbox.git.clone(url, destination, undefined, undefined, undefined, undefined, false, CLONE_DEPTH);
  }

  public async createSnapshot(name: string): Promise<void> {
    await this.sandbox.createSnapshot(name, SNAPSHOT_TIMEOUT_SECONDS);
  }

  public async fork(name: string): Promise<DaytonaSandboxClient> {
    const forkedSandbox = await this.sandbox.fork({ name }, FORK_TIMEOUT_SECONDS);
    return new DaytonaSdkSandboxClient(forkedSandbox);
  }

  public async listFiles(path: string, depth: number): Promise<DaytonaFileInfo[]> {
    const files = await this.sandbox.fs.listFiles(path, { depth });
    return files.map((file: { isDir: boolean; path?: string; size: number }): DaytonaFileInfo => ({
      isDirectory: file.isDir,
      path: file.path,
      sizeBytes: file.size,
    }));
  }

  public async downloadFile(path: string): Promise<Buffer> {
    return this.sandbox.fs.downloadFile(path);
  }

  public async uploadTextFile(path: string, content: string): Promise<void> {
    await this.sandbox.fs.uploadFile(Buffer.from(content, UTF8_ENCODING), path);
  }

  public async executeCommand(command: string, cwd: string, timeoutSeconds: number): Promise<DaytonaCommandResult> {
    const result = await this.sandbox.process.executeCommand(command, cwd, {}, timeoutSeconds);
    return { exitCode: result.exitCode, stdout: result.artifacts?.stdout ?? result.result };
  }

  public async createSession(sessionId: string): Promise<void> {
    await this.sandbox.process.createSession(sessionId);
  }

  public async executeSessionCommand(sessionId: string, command: string): Promise<DaytonaSessionCommand> {
    const result = await this.sandbox.process.executeSessionCommand(
      sessionId,
      { command, runAsync: true },
      SESSION_COMMAND_TIMEOUT_SECONDS,
    );
    return { commandId: result.cmdId };
  }

  public async getSessionCommand(sessionId: string, commandId: string): Promise<DaytonaSessionCommandStatus> {
    const command = await this.sandbox.process.getSessionCommand(sessionId, commandId);
    return { exitCode: command.exitCode };
  }

  public async getSessionCommandLogs(sessionId: string, commandId: string): Promise<DaytonaCommandLogs> {
    const logs = await this.sandbox.process.getSessionCommandLogs(sessionId, commandId);
    return { stderr: logs.stderr, stdout: logs.stdout };
  }

  public async getSignedPreviewUrl(port: number): Promise<string> {
    const preview = await this.sandbox.getSignedPreviewUrl(port, PREVIEW_URL_TTL_SECONDS);
    return preview.url;
  }

  public async stop(): Promise<void> {
    await this.sandbox.stop(STOP_TIMEOUT_SECONDS, false);
  }

  public async delete(): Promise<void> {
    await this.sandbox.delete(DELETE_TIMEOUT_SECONDS, true);
  }
}
