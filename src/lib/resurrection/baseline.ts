import type { ComputeProvider, ProcessRef, SandboxRef } from "@/lib/compute/provider";
import type { ProjectProfile } from "@/lib/contracts/run";
import { withDeadline } from "./deadline";
import { assertBeforeDeadline, errorMessage, ResurrectionDeadlineError } from "./errors";
import { remainingCommandSeconds } from "./limits";
import type { VerificationResult, WebVerifier } from "./verify";

export interface BaselineFailure {
  stage: "install" | "start" | "verify";
  command: string;
  exitCode?: number;
  stdout: string;
  stderr: string;
  summary: string;
}

export type BaselineResult =
  | { status: "success"; sandbox: SandboxRef; process: ProcessRef; verification: VerificationResult }
  | { status: "failed"; sandbox: SandboxRef; failure: BaselineFailure };

export interface BaselineInput {
  provider: ComputeProvider;
  seed: SandboxRef;
  repoRoot: string;
  runId: string;
  profile: ProjectProfile;
  verifier: WebVerifier;
  deadline: number;
  now: () => number;
  onStage?: (stage: BaselineFailure["stage"]) => Promise<void>;
}

export async function runBaseline(input: BaselineInput): Promise<BaselineResult> {
  assertBeforeDeadline(input.deadline, input.now());
  const sandbox = await withDeadline(input.deadline, input.now, "baseline fork allocation", () =>
    input.provider.fork(input.seed, `${input.runId}-baseline`));
  const installFailure = await installBaseline(input, sandbox);
  if (installFailure !== undefined) return { failure: installFailure, sandbox, status: "failed" };
  return startAndVerify(input, sandbox);
}

const installBaseline = async (input: BaselineInput, sandbox: SandboxRef): Promise<BaselineFailure | undefined> => {
  const command = input.profile.installCommand;
  if (command === undefined) return failure("install", "", "No deterministic install command is available.");
  try {
    await input.onStage?.("install");
    assertBeforeDeadline(input.deadline, input.now());
    const timeoutSeconds = remainingCommandSeconds(input.deadline, input.now());
    if (timeoutSeconds === 0) throw new ResurrectionDeadlineError();
    const result = await withDeadline(input.deadline, input.now, "baseline installation", () =>
      input.provider.runCommand(sandbox, { command, cwd: input.repoRoot, timeoutSeconds }));
    if (result.exitCode === 0) return undefined;
    return { command, exitCode: result.exitCode, stage: "install", stderr: result.stderr, stdout: result.stdout, summary: `Install command exited with code ${result.exitCode}.` };
  } catch (error: unknown) {
    return failure("install", command, `Baseline installation failed: ${errorMessage(error)}`);
  }
};

const startAndVerify = async (input: BaselineInput, sandbox: SandboxRef): Promise<BaselineResult> => {
  const command = input.profile.startCommand;
  if (command === undefined) return { failure: failure("start", "", "No deterministic start command is available."), sandbox, status: "failed" };
  try {
    await input.onStage?.("start");
    assertBeforeDeadline(input.deadline, input.now());
    const process = await withDeadline(input.deadline, input.now, "baseline process start", () =>
      input.provider.startProcess(sandbox, { command, cwd: input.repoRoot, sessionId: `${input.runId}-baseline` }));
    return verifyBaseline(input, sandbox, process, command);
  } catch (error: unknown) {
    return { failure: failure("start", command, `Baseline start failed: ${errorMessage(error)}`), sandbox, status: "failed" };
  }
};

const verifyBaseline = async (input: BaselineInput, sandbox: SandboxRef, process: ProcessRef, command: string): Promise<BaselineResult> => {
  try {
    await input.onStage?.("verify");
    const verification = await withDeadline(input.deadline, input.now, "baseline verification", () =>
      input.verifier.verify({
        likelyPorts: input.profile.likelyPorts, now: input.now, process,
        provider: input.provider, sandbox, timeoutAt: input.deadline,
      }));
    return verification.isVerified
      ? { process, sandbox, status: "success", verification }
      : { failure: verificationFailure(command, verification), sandbox, status: "failed" };
  } catch (error: unknown) {
    return { failure: failure("verify", command, `Objective verification failed: ${errorMessage(error)}`), sandbox, status: "failed" };
  }
};

const failure = (stage: BaselineFailure["stage"], command: string, summary: string): BaselineFailure => ({
  command, stage, stderr: "", stdout: "", summary,
});

const verificationFailure = (command: string, verification: VerificationResult): BaselineFailure => ({
  command,
  stage: "verify",
  stderr: verification.stderr ?? "",
  stdout: verification.stdout ?? "",
  summary: verification.failureReason ?? "Objective verification failed.",
});
