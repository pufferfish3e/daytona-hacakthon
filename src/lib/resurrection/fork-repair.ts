import type { ComputeProvider, ProcessRef, SandboxRef } from "@/lib/compute/provider";
import type { RepairStrategy } from "@/lib/contracts/repair";
import type { ProjectProfile, ResurrectionAttempt } from "@/lib/contracts/run";
import { withDeadline } from "./deadline";
import { assertBeforeDeadline, errorMessage } from "./errors";
import { executeRepairStrategy, type RepairExecutionInput, type RepairExecutionResult, validateRepairActions } from "./execute-actions";
import { normalizeStrategyInvasiveness } from "./invasiveness";
import { selectWinner } from "./select-winner";
import { isVerifiedWebProcess, type VerifiedWebProcess, type WebVerifier } from "./verify";

export interface SuccessfulRepair {
  strategy: RepairStrategy;
  sandbox: SandboxRef;
  process: ProcessRef;
  verification: VerifiedWebProcess;
  changedFiles: string[];
  actionSummaries: string[];
  bootDurationMs: number;
}

export type RepairRaceResult =
  | { status: "success"; winner: SuccessfulRepair; attempts: ResurrectionAttempt[] }
  | { status: "failed"; attempts: ResurrectionAttempt[]; failureReason: string };

export interface RepairRaceReporter {
  queued(attempts: ResurrectionAttempt[]): Promise<void>;
  running(strategyId: string, sandbox: SandboxRef): Promise<void>;
  finished(attempt: ResurrectionAttempt): Promise<void>;
  cleanup(sandbox: SandboxRef, failureReason?: string): Promise<void>;
}

export type RepairExecutor = (input: RepairExecutionInput) => Promise<RepairExecutionResult>;

export interface RepairRaceInput {
  provider: ComputeProvider;
  seed: SandboxRef;
  repoRoot: string;
  strategies: [RepairStrategy, RepairStrategy, RepairStrategy];
  profile: ProjectProfile;
  verifier: WebVerifier;
  reporter: RepairRaceReporter;
  deadline: number;
  now: () => number;
  executor?: RepairExecutor;
}

interface AllocatedRepair { sandbox: SandboxRef; strategy: RepairStrategy; }
interface AttemptOutcome { attempt: ResurrectionAttempt; success?: SuccessfulRepair; }

export async function runParallelRepairs(input: RepairRaceInput): Promise<RepairRaceResult> {
  assertBeforeDeadline(input.deadline, input.now());
  const boundedInput = normalizedRaceInput(input);
  boundedInput.strategies.forEach((strategy: RepairStrategy): void => validateRepairActions(strategy.actions));
  const attempts = boundedInput.strategies.map(toQueuedAttempt);
  await boundedInput.reporter.queued(attempts);
  assertBeforeDeadline(boundedInput.deadline, boundedInput.now());
  const allocations = await allocateForks(boundedInput);
  const allocated = fulfilledAllocations(boundedInput.strategies, allocations);
  try {
    const forkFailures = await reportForkFailures(boundedInput, allocations, attempts);
    const outcomes = await executeAllocated(boundedInput, allocated);
    const finalAttempts = mergeAttempts(attempts, [...forkFailures, ...outcomes.map((outcome: AttemptOutcome) => outcome.attempt)]);
    const successes = outcomes.flatMap((outcome: AttemptOutcome): SuccessfulRepair[] => outcome.success === undefined ? [] : [outcome.success]);
    const winner = successes.length === 0 ? undefined : selectWinner(successes);
    await cleanupRepairs(boundedInput, allocated, winner?.sandbox.id);
    return winner === undefined
      ? { attempts: finalAttempts, failureReason: "Project could not be started after 3 repair attempts.", status: "failed" }
      : { attempts: finalAttempts, status: "success", winner };
  } catch (error: unknown) {
    await cleanupRepairs(boundedInput, allocated);
    throw error;
  }
}

const allocateForks = async (input: RepairRaceInput): Promise<PromiseSettledResult<SandboxRef>[]> =>
  Promise.allSettled(input.strategies.map((strategy: RepairStrategy): Promise<SandboxRef> =>
    withDeadline(input.deadline, input.now, `fork allocation ${strategy.id}`, () =>
      input.provider.fork(input.seed, `${input.seed.name}-${strategy.id}`))));

const reportForkFailures = async (
  input: RepairRaceInput,
  allocations: PromiseSettledResult<SandboxRef>[],
  attempts: ResurrectionAttempt[],
): Promise<ResurrectionAttempt[]> => {
  const failures: ResurrectionAttempt[] = [];
  for (const [index, allocation] of allocations.entries()) {
    if (allocation.status === "fulfilled") continue;
    const attempt: ResurrectionAttempt = {
      ...attempts[index],
      failureReason: `Fork allocation failed: ${errorMessage(allocation.reason)}`,
      status: "failed",
    };
    failures.push(attempt);
    await input.reporter.finished(attempt);
  }
  return failures;
};

const fulfilledAllocations = (
  strategies: [RepairStrategy, RepairStrategy, RepairStrategy],
  results: PromiseSettledResult<SandboxRef>[],
): AllocatedRepair[] => results.flatMap((result: PromiseSettledResult<SandboxRef>, index: number): AllocatedRepair[] =>
  result.status === "fulfilled" ? [{ sandbox: result.value, strategy: strategies[index] }] : []);

const executeAllocated = async (input: RepairRaceInput, repairs: AllocatedRepair[]): Promise<AttemptOutcome[]> => {
  const settlements = await Promise.allSettled(repairs.map((repair: AllocatedRepair): Promise<AttemptOutcome> => executeOne(input, repair)));
  return settlements.map((settlement: PromiseSettledResult<AttemptOutcome>, index: number): AttemptOutcome => {
    if (settlement.status === "fulfilled") return settlement.value;
    return failedOutcome(repairs[index], `Repair attempt failed: ${errorMessage(settlement.reason)}`);
  });
};

const executeOne = async (input: RepairRaceInput, repair: AllocatedRepair): Promise<AttemptOutcome> => {
  await input.reporter.running(repair.strategy.id, repair.sandbox);
  try {
    const execution = await withDeadline(input.deadline, input.now, `repair execution ${repair.strategy.id}`, () =>
      (input.executor ?? executeRepairStrategy)(executionInput(input, repair)));
    const verification = await withDeadline(input.deadline, input.now, `repair verification ${repair.strategy.id}`, () =>
      input.verifier.verify({ likelyPorts: execution.expectedPorts, now: input.now, process: execution.process, provider: input.provider, sandbox: repair.sandbox, timeoutAt: input.deadline }));
    if (!isVerifiedWebProcess(verification)) return finishFailure(input, repair, execution.changedFiles, verification.failureReason ?? "Objective verification failed.");
    return finishSuccess(input, repair, execution, verification);
  } catch (error: unknown) {
    return finishFailure(input, repair, [], errorMessage(error));
  }
};

const finishSuccess = async (
  input: RepairRaceInput,
  repair: AllocatedRepair,
  execution: RepairExecutionResult,
  verification: VerifiedWebProcess,
): Promise<AttemptOutcome> => {
  const bootDurationMs = Math.max(0, input.now() - execution.processStartedAtMs);
  const attempt = attemptResult(repair, "success", execution.changedFiles, bootDurationMs);
  await input.reporter.finished(attempt);
  return { attempt, success: { actionSummaries: execution.actionSummaries, bootDurationMs, changedFiles: execution.changedFiles, process: execution.process, sandbox: repair.sandbox, strategy: repair.strategy, verification } };
};

const finishFailure = async (input: RepairRaceInput, repair: AllocatedRepair, changedFiles: string[], reason: string): Promise<AttemptOutcome> => {
  const attempt = attemptResult(repair, "failed", changedFiles, undefined, reason);
  await input.reporter.finished(attempt);
  return { attempt };
};

const executionInput = (input: RepairRaceInput, repair: AllocatedRepair): RepairExecutionInput => ({
  deadline: input.deadline, now: input.now, profile: input.profile, provider: input.provider,
  repoRoot: input.repoRoot, sandbox: repair.sandbox, strategy: repair.strategy,
});

const cleanupRepairs = async (input: RepairRaceInput, repairs: AllocatedRepair[], winnerId?: string): Promise<void> => {
  const targets = repairs.filter((repair: AllocatedRepair): boolean => repair.sandbox.id !== winnerId);
  const results = await Promise.allSettled(targets.map((repair: AllocatedRepair): Promise<void> =>
    withDeadline(input.deadline, input.now, `repair cleanup ${repair.sandbox.id}`, () =>
      input.provider.delete(repair.sandbox))));
  await Promise.all(results.map((result: PromiseSettledResult<void>, index: number): Promise<void> =>
    reportRepairCleanup(input, targets[index].sandbox, result)));
};

const reportRepairCleanup = async (input: RepairRaceInput, sandbox: SandboxRef, result: PromiseSettledResult<void>): Promise<void> => {
  const reason = result.status === "rejected" ? errorMessage(result.reason) : undefined;
  try {
    await input.reporter.cleanup(sandbox, reason);
  } catch (error: unknown) {
    console.error("repair cleanup event failed", { sandboxId: sandbox.id, reason: errorMessage(error) });
  }
};

const toQueuedAttempt = (strategy: RepairStrategy): ResurrectionAttempt => ({
  changedFiles: [], hypothesis: strategy.hypothesis, id: strategy.id, invasiveness: strategy.invasiveness,
  status: "queued", title: strategy.title,
});

const attemptResult = (
  repair: AllocatedRepair,
  status: "success" | "failed",
  changedFiles: string[],
  bootDurationMs?: number,
  failureReason?: string,
): ResurrectionAttempt => ({
  bootDurationMs, changedFiles, failureReason, hypothesis: repair.strategy.hypothesis, id: repair.strategy.id,
  invasiveness: repair.strategy.invasiveness, sandboxId: repair.sandbox.id, status, title: repair.strategy.title,
});

const failedOutcome = (repair: AllocatedRepair, reason: string): AttemptOutcome => ({
  attempt: attemptResult(repair, "failed", [], undefined, reason),
});

const mergeAttempts = (initial: ResurrectionAttempt[], updates: ResurrectionAttempt[]): ResurrectionAttempt[] => {
  const byId = new Map(updates.map((attempt: ResurrectionAttempt): [string, ResurrectionAttempt] => [attempt.id, attempt]));
  return initial.map((attempt: ResurrectionAttempt): ResurrectionAttempt => byId.get(attempt.id) ?? attempt);
};

const normalizedRaceInput = (input: RepairRaceInput): RepairRaceInput => ({
  ...input,
  strategies: [
    normalizeStrategyInvasiveness(input.strategies[0]),
    normalizeStrategyInvasiveness(input.strategies[1]),
    normalizeStrategyInvasiveness(input.strategies[2]),
  ],
});
