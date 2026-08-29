export interface SandboxRef { id: string; name: string; }
export interface CreateSeedInput { name: string; cpu: number; memoryGiB: number; diskGiB: number; ttlMinutes: number; }
export interface SandboxFile { path: string; isDirectory: boolean; sizeBytes?: number; }
export interface SnapshotRef { name: string; }
export interface CloneInput { url: string; destination: string; }
export interface CloneResult { commit: string; }
export interface CommandInput { command: string; cwd: string; timeoutSeconds: number; }
export interface CommandResult { exitCode: number; stdout: string; stderr: string; durationMs: number; }
export interface StartProcessInput { command: string; cwd: string; sessionId: string; }
export interface ProcessRef { sessionId: string; commandId: string; }
export interface ProcessState { isAlive: boolean; exitCode?: number; }
export interface ProcessLogs { stdout: string; stderr: string; }

export interface ComputeProvider {
  createSeed(input: CreateSeedInput): Promise<SandboxRef>;
  clonePublicRepository(sandbox: SandboxRef, input: CloneInput): Promise<CloneResult>;
  createSnapshot(sandbox: SandboxRef, name: string): Promise<SnapshotRef>;
  fork(sandbox: SandboxRef, name: string): Promise<SandboxRef>;
  listFiles(sandbox: SandboxRef, path: string, depth: number): Promise<SandboxFile[]>;
  readTextFile(sandbox: SandboxRef, path: string): Promise<string>;
  writeTextFile(sandbox: SandboxRef, path: string, content: string): Promise<void>;
  runCommand(sandbox: SandboxRef, input: CommandInput): Promise<CommandResult>;
  startProcess(sandbox: SandboxRef, input: StartProcessInput): Promise<ProcessRef>;
  getProcess(sandbox: SandboxRef, process: ProcessRef): Promise<ProcessState>;
  getProcessLogs(sandbox: SandboxRef, process: ProcessRef): Promise<ProcessLogs>;
  getSignedPreviewUrl(sandbox: SandboxRef, port: number): Promise<string>;
  stop(sandbox: SandboxRef): Promise<void>;
  delete(sandbox: SandboxRef): Promise<void>;
  deleteSnapshot(snapshot: SnapshotRef): Promise<void>;
}
