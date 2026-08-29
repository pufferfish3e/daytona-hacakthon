import type { ComputeProvider, ProcessRef, SandboxRef } from "@/lib/compute/provider";
import type { RepairAction, RepairStrategy } from "@/lib/contracts/repair";
import type { ProjectProfile } from "@/lib/contracts/run";
import { resolveRepositoryPath } from "@/lib/daytona/path-policy";
import { withDeadline } from "./deadline";
import { assertBeforeDeadline, errorMessage, RepairExecutorError, ResurrectionDeadlineError } from "./errors";
import { COMMAND_LENGTH_LIMIT, FILE_WRITE_LIMIT_BYTES, REPAIR_ACTION_LIMIT, remainingCommandSeconds } from "./limits";

export interface RepairExecutionInput {
  provider: ComputeProvider;
  sandbox: SandboxRef;
  repoRoot: string;
  strategy: RepairStrategy;
  profile: ProjectProfile;
  deadline: number;
  now: () => number;
}

export interface RepairExecutionResult {
  process: ProcessRef;
  changedFiles: string[];
  actionSummaries: string[];
  expectedPorts: number[];
  processStartedAtMs: number;
}

const GIT_STATUS_COMMAND = "git rev-parse --is-inside-work-tree >/dev/null && git status --porcelain=v1 -z --untracked-files=normal | head -c 65537";
const GIT_STATUS_LIMIT_BYTES = 64 * 1_024;
const GIT_STATUS_TIMEOUT_SECONDS = 30;

export async function executeRepairStrategy(input: RepairExecutionInput): Promise<RepairExecutionResult> {
  validateRepairActions(input.strategy.actions);
  try {
    const actions = input.strategy.actions.filter((action: RepairAction): boolean => action.type !== "try_start");
    for (const action of actions) await executeAction(input, action);
    const changedFiles = await measureChangedFiles(input);
    const started = await startRepair(input);
    return {
      actionSummaries: input.strategy.actions.map((action: RepairAction): string => action.reason),
      changedFiles, expectedPorts: started.expectedPorts, process: started.process,
      processStartedAtMs: input.now(),
    };
  } catch (error: unknown) {
    if (error instanceof RepairExecutorError) throw error;
    throw new RepairExecutorError(`Repair execution failed: ${errorMessage(error)}`, { cause: error });
  }
}

const executeAction = async (input: RepairExecutionInput, action: RepairAction): Promise<void> => {
  assertBeforeDeadline(input.deadline, input.now());
  if (action.type === "run_command") await runCommand(input, action.command);
  if (action.type === "write_file") await writeFile(input, action.path, action.content);
  if (action.type === "replace_text") await replaceText(input, action);
};

const runCommand = async (input: RepairExecutionInput, command: string): Promise<void> => {
  validateCommand(command);
  const timeoutSeconds = remainingCommandSeconds(input.deadline, input.now());
  if (timeoutSeconds === 0) throw new ResurrectionDeadlineError();
  const result = await withDeadline(input.deadline, input.now, "repair command", () =>
    input.provider.runCommand(input.sandbox, { command, cwd: input.repoRoot, timeoutSeconds }));
  if (result.exitCode !== 0) throw new RepairExecutorError(`Repair command exited with code ${result.exitCode}.`);
};

const writeFile = async (input: RepairExecutionInput, path: string, content: string): Promise<void> => {
  if (new TextEncoder().encode(content).byteLength > FILE_WRITE_LIMIT_BYTES) {
    throw new RepairExecutorError("Repair file content exceeds 64 KiB.");
  }
  await withDeadline(input.deadline, input.now, `repair write ${path}`, () =>
    input.provider.writeTextFile(input.sandbox, resolveRepositoryPath(input.repoRoot, path), content));
};

const replaceText = async (input: RepairExecutionInput, action: Extract<RepairAction, { type: "replace_text" }>): Promise<void> => {
  const resolved = resolveRepositoryPath(input.repoRoot, action.path);
  const content = await withDeadline(input.deadline, input.now, `repair read ${action.path}`, () =>
    input.provider.readTextFile(input.sandbox, resolved));
  const first = content.indexOf(action.search);
  if (first < 0 || content.indexOf(action.search, first + action.search.length) >= 0) {
    throw new RepairExecutorError("Replacement search text must occur exactly once.");
  }
  const updated = `${content.slice(0, first)}${action.replacement}${content.slice(first + action.search.length)}`;
  await writeFile(input, action.path, updated);
};

const startRepair = async (input: RepairExecutionInput): Promise<{ process: ProcessRef; expectedPorts: number[] }> => {
  const explicit = input.strategy.actions.find((action: RepairAction) => action.type === "try_start");
  const command = explicit?.type === "try_start" ? explicit.command : input.profile.startCommand;
  if (command === undefined) throw new RepairExecutorError("No deterministic start command is available.");
  validateCommand(command);
  const process = await withDeadline(input.deadline, input.now, "repair process start", () =>
    input.provider.startProcess(input.sandbox, {
      command, cwd: input.repoRoot, sessionId: `${input.strategy.id}-start`,
    }));
  const expectedPorts = explicit?.type === "try_start" ? explicit.expectedPorts : input.profile.likelyPorts;
  return { expectedPorts: [...expectedPorts], process };
};

const measureChangedFiles = async (input: RepairExecutionInput): Promise<string[]> => {
  const timeoutSeconds = Math.min(GIT_STATUS_TIMEOUT_SECONDS, remainingCommandSeconds(input.deadline, input.now()));
  if (timeoutSeconds === 0) throw new ResurrectionDeadlineError("changed-file measurement");
  const result = await withDeadline(input.deadline, input.now, "changed-file measurement", () =>
    input.provider.runCommand(input.sandbox, { command: GIT_STATUS_COMMAND, cwd: input.repoRoot, timeoutSeconds }));
  if (result.exitCode !== 0) throw new RepairExecutorError(`Changed-file measurement exited with code ${result.exitCode}.`);
  if (new TextEncoder().encode(result.stdout).byteLength > GIT_STATUS_LIMIT_BYTES) {
    throw new RepairExecutorError("Changed-file measurement exceeded 64 KiB.");
  }
  return parseGitStatus(result.stdout);
};

const parseGitStatus = (stdout: string): string[] => {
  const entries = stdout.split("\u0000").filter((entry: string): boolean => entry.length > 0);
  const paths: string[] = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!/^[ MADRCU?!]{2} /.test(entry)) throw new RepairExecutorError("Changed-file measurement returned malformed output.");
    paths.push(entry.slice(3));
    if (entry[0] === "R" || entry[1] === "R" || entry[0] === "C" || entry[1] === "C") index += 1;
  }
  return [...new Set(paths)].sort((left: string, right: string): number => left.localeCompare(right));
};

export const validateRepairActions = (actions: RepairAction[]): void => {
  if (actions.length === 0 || actions.length > REPAIR_ACTION_LIMIT) throw new RepairExecutorError("A repair strategy must contain one to six actions.");
  const starts = actions.flatMap((action: RepairAction, index: number): number[] => action.type === "try_start" ? [index] : []);
  if (starts.length > 1 || (starts.length === 1 && starts[0] !== actions.length - 1)) {
    throw new RepairExecutorError("try_start may appear once and must be the final action.");
  }
};

const validateCommand = (command: string): void => {
  if (command.length === 0 || command.length > COMMAND_LENGTH_LIMIT) throw new RepairExecutorError("Repair command length is invalid.");
};
