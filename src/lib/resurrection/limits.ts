export const COMMAND_TIMEOUT_SECONDS = 120;
export const TOTAL_RUN_TIMEOUT_MS = 8 * 60 * 1_000;
export const EVIDENCE_FILE_LIMIT_BYTES = 32 * 1_024;
export const EVIDENCE_TOTAL_LIMIT_BYTES = 128 * 1_024;
export const FILE_WRITE_LIMIT_BYTES = 64 * 1_024;
export const COMMAND_LENGTH_LIMIT = 2_000;
export const REPAIR_ACTION_LIMIT = 6;
export const MAX_PORT_CANDIDATES = 10;
export const HTTP_PROBE_TIMEOUT_MS = 5_000;
export const READINESS_RETRY_ATTEMPTS = 4;
export const READINESS_RETRY_INTERVAL_MS = 250;

export const remainingCommandSeconds = (deadline: number, now: number): number => {
  const remaining = Math.floor((deadline - now) / 1_000);
  return Math.min(COMMAND_TIMEOUT_SECONDS, Math.max(0, remaining));
};
