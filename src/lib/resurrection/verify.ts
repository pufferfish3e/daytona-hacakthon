import type { ComputeProvider, ProcessRef, SandboxRef } from "@/lib/compute/provider";
import { withDeadline } from "./deadline";
import { errorMessage } from "./errors";
import {
  HTTP_PROBE_TIMEOUT_MS,
  MAX_PORT_CANDIDATES,
  READINESS_RETRY_ATTEMPTS,
  READINESS_RETRY_INTERVAL_MS,
} from "./limits";

export interface VerificationInput {
  provider: ComputeProvider;
  sandbox: SandboxRef;
  process: ProcessRef;
  likelyPorts: number[];
  timeoutAt: number;
  now: () => number;
  request?: HttpProbe;
  wait?: ReadinessWait;
}

export interface VerificationResult {
  isVerified: boolean;
  processAlive: boolean;
  port?: number;
  previewUrl?: string;
  httpStatus?: number;
  failureReason?: string;
  stdout?: string;
  stderr?: string;
}

export type VerifiedWebProcess = VerificationResult & {
  isVerified: true;
  processAlive: true;
  port: number;
  previewUrl: string;
  httpStatus: number;
};

export type HttpProbe = (url: string, timeoutMs: number) => Promise<number>;
export type ReadinessWait = (delayMs: number) => Promise<void>;

export interface WebVerifier {
  verify(input: VerificationInput): Promise<VerificationResult>;
}

export const DEFAULT_WEB_VERIFIER: WebVerifier = { verify: verifyWebProcess };

const PORT_PATTERN = /(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{1,5})/g;

export async function verifyWebProcess(input: VerificationInput): Promise<VerificationResult> {
  if (input.now() >= input.timeoutAt) return failure(false, "Verification deadline was reached.");
  const initial = await withDeadline(input.timeoutAt, input.now, "initial process liveness check", () =>
    input.provider.getProcess(input.sandbox, input.process));
  const logs = await withDeadline(input.timeoutAt, input.now, "process log collection", () =>
    input.provider.getProcessLogs(input.sandbox, input.process));
  if (!initial.isAlive) return failure(false, "The started process exited before HTTP verification.", logs);
  const ports = candidatePorts(`${logs.stdout}\n${logs.stderr}`, input.likelyPorts);
  return probePorts(input, ports, logs);
}

export const isVerifiedWebProcess = (result: VerificationResult): result is VerifiedWebProcess =>
  result.isVerified && result.processAlive && result.port !== undefined && result.previewUrl !== undefined && result.httpStatus !== undefined;

const probePorts = async (input: VerificationInput, ports: number[], logs: { stdout: string; stderr: string }): Promise<VerificationResult> => {
  let lastFailure = "No candidate port returned HTTP 200-399.";
  for (const port of ports) {
    if (input.now() >= input.timeoutAt) return failure(true, "Verification deadline was reached.", logs);
    const outcome = await probePortUntilReady(input, port, logs);
    if (outcome.isVerified) return outcome;
    lastFailure = outcome.failureReason ?? lastFailure;
    if (!outcome.processAlive) return outcome;
  }
  return failure(true, lastFailure, logs);
};

const probePortUntilReady = async (input: VerificationInput, port: number, logs: { stdout: string; stderr: string }): Promise<VerificationResult> => {
  let outcome: VerificationResult = failure(true, `Port ${port} was not ready.`, logs);
  for (let attempt = 0; attempt < READINESS_RETRY_ATTEMPTS; attempt += 1) {
    outcome = await probePort(input, port, logs);
    if (outcome.isVerified || !outcome.processAlive || attempt === READINESS_RETRY_ATTEMPTS - 1) return outcome;
    await withDeadline(input.timeoutAt, input.now, `readiness retry for port ${port}`, () =>
      (input.wait ?? defaultWait)(READINESS_RETRY_INTERVAL_MS));
  }
  return outcome;
};

const probePort = async (input: VerificationInput, port: number, logs: { stdout: string; stderr: string }): Promise<VerificationResult> => {
  try {
    const before = await withDeadline(input.timeoutAt, input.now, `pre-probe liveness for port ${port}`, () =>
      input.provider.getProcess(input.sandbox, input.process));
    if (!before.isAlive) return failure(false, "The process exited before an HTTP readiness probe.", logs);
    const previewUrl = await withDeadline(input.timeoutAt, input.now, `preview URL for port ${port}`, () =>
      input.provider.getSignedPreviewUrl(input.sandbox, port));
    const timeoutMs = Math.min(HTTP_PROBE_TIMEOUT_MS, Math.max(1, input.timeoutAt - input.now()));
    const http = await captureHttpProbe(input, port, previewUrl, timeoutMs);
    const after = await withDeadline(input.timeoutAt, input.now, `post-probe liveness for port ${port}`, () =>
      input.provider.getProcess(input.sandbox, input.process));
    if (!after.isAlive) return failure(false, "The process exited during HTTP verification.", logs);
    if (http.failureReason !== undefined) return failure(true, http.failureReason, logs);
    const status = http.status;
    if (status === undefined) return failure(true, `Port ${port} returned no HTTP status.`, logs);
    if (status < 200 || status > 399) return failure(true, `Port ${port} returned HTTP ${status}.`, logs);
    return { httpStatus: status, isVerified: true, port, previewUrl, processAlive: true, stderr: logs.stderr, stdout: logs.stdout };
  } catch (error: unknown) {
    return failure(true, `Port ${port} probe failed: ${errorMessage(error)}`, logs);
  }
};

const captureHttpProbe = async (
  input: VerificationInput,
  port: number,
  previewUrl: string,
  timeoutMs: number,
): Promise<{ status?: number; failureReason?: string }> => {
  try {
    const status = await withDeadline(input.timeoutAt, input.now, `HTTP probe for port ${port}`, () =>
      (input.request ?? defaultHttpProbe)(previewUrl, timeoutMs));
    return { status };
  } catch (error: unknown) {
    return { failureReason: `Port ${port} probe failed: ${errorMessage(error)}` };
  }
};

const defaultHttpProbe: HttpProbe = async (url: string, timeoutMs: number): Promise<number> => {
  const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
  return response.status;
};

const defaultWait: ReadinessWait = async (delayMs: number): Promise<void> => {
  await new Promise<void>((resolve: () => void): void => {
    setTimeout(resolve, delayMs);
  });
};

const candidatePorts = (logs: string, likelyPorts: number[]): number[] => {
  const detected = [...logs.matchAll(PORT_PATTERN)].map((match: RegExpMatchArray): number => Number(match[1]));
  const combined = [...detected, ...likelyPorts];
  return [...new Set(combined.filter(isPort))].slice(0, MAX_PORT_CANDIDATES);
};

const isPort = (port: number): boolean => Number.isInteger(port) && port >= 1 && port <= 65_535;

const failure = (processAlive: boolean, failureReason: string, logs?: { stdout: string; stderr: string }): VerificationResult => ({
  failureReason, isVerified: false, processAlive, stderr: logs?.stderr, stdout: logs?.stdout,
});
