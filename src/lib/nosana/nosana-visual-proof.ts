import { createNosanaClient, NosanaNetwork } from "@nosana/kit";
import type { NosanaClient } from "@nosana/kit";
import type { NosanaApiGetJobByAddressResponse } from "@nosana/api";
import { z } from "zod";

import type { VisualProofResult } from "@/lib/contracts/run";

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_SUMMARY_CHARS = 1_000;

const VisualProofResponseSchema = z.object({
  durationMs: z.number().finite().min(0).optional(),
  evidenceUrl: z.string().url().max(2_048).optional(),
  jobId: z.string().min(1).max(200).optional(),
  label: z.enum(["meaningful_ui", "blank", "error_overlay"]).optional(),
  status: z.enum(["passed", "failed", "unavailable"]),
  summary: z.string().min(1).max(MAX_SUMMARY_CHARS),
}).strict();

export interface VisualProofInput {
  screenshotUrl: string;
}

export interface VisualProofAdapter {
  assess(input: VisualProofInput): Promise<VisualProofResult>;
}

export class NosanaVisualProofAdapter implements VisualProofAdapter {
  public async assess(input: VisualProofInput): Promise<VisualProofResult> {
    assertServerOnly();
    const startedAt = Date.now();
    const endpoint = environmentUrl("NOSANA_VISUAL_ENDPOINT_URL");
    const apiKey = optionalEnvironment("NOSANA_API_KEY");
    if (endpoint === undefined || apiKey === undefined) return unavailable("Nosana visual proof is not configured.", startedAt);
    if (!isSafeUrl(input.screenshotUrl)) return unavailable("The screenshot URL is not a safe HTTPS URL.", startedAt);
    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify({ screenshotUrl: input.screenshotUrl }),
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        method: "POST",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) return unavailable(`Nosana visual proof endpoint returned HTTP ${response.status}.`, startedAt);
      const body: unknown = await response.json();
      const parsed = VisualProofResponseSchema.safeParse(body);
      if (!parsed.success) return unavailable("Nosana visual proof endpoint returned an invalid response.", startedAt);
      return {
        durationMs: parsed.data.durationMs ?? Date.now() - startedAt,
        evidenceUrl: safeEvidenceUrl(parsed.data.evidenceUrl),
        jobId: parsed.data.jobId,
        label: parsed.data.label,
        provider: "nosana",
        status: parsed.data.status,
        summary: parsed.data.summary,
      };
    } catch (error: unknown) {
      const reason = error instanceof Error && error.name === "TimeoutError" ? "timed out" : "could not be reached";
      return unavailable(`Nosana visual proof ${reason}.`, startedAt);
    }
  }
}

export class NosanaJobStatusClient {
  private readonly client: NosanaClient;

  public constructor() {
    assertServerOnly();
    this.client = createNosanaClient(NosanaNetwork.MAINNET, {
      api: { apiKey: requiredEnvironment("NOSANA_API_KEY") },
    });
  }

  public async getJob(jobId: string): Promise<NosanaApiGetJobByAddressResponse> {
    assertServerOnly();
    if (jobId.trim().length === 0) throw new Error("Nosana job ID must not be empty.");
    return this.client.api.jobs.get(jobId);
  }
}

const unavailable = (summary: string, startedAt: number): VisualProofResult => ({
  durationMs: Date.now() - startedAt,
  provider: "nosana",
  status: "unavailable",
  summary,
});

const safeEvidenceUrl = (value: string | undefined): string | undefined => value !== undefined && isSafeUrl(value) ? value : undefined;

const environmentUrl = (name: string): string | undefined => {
  const value = optionalEnvironment(name);
  return value !== undefined && isSafeUrl(value) ? value : undefined;
};

const isSafeUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username.length === 0 && url.password.length === 0;
  } catch {
    return false;
  }
};

const optionalEnvironment = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value === undefined || value.length === 0 ? undefined : value;
};

const requiredEnvironment = (name: string): string => {
  const value = optionalEnvironment(name);
  if (value === undefined) throw new Error(`${name} must be configured on the server.`);
  return value;
};

const assertServerOnly = (): void => {
  if (typeof window !== "undefined") throw new Error("Nosana adapters must run on the server.");
};
