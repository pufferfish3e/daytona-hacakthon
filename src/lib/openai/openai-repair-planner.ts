import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { RepairPlanSchema } from "@/lib/contracts/repair";
import type { RepairPlan } from "@/lib/contracts/repair";
import type { RepairPlanner, RepairPlannerInput } from "@/lib/resurrection/repair-planner";

const DEFAULT_MODEL = "gpt-5.6-sol";
const MAX_EVIDENCE_FILES = 12;
const MAX_TEXT_FILE_CHARS = 4_000;
const MAX_FAILURE_CHARS = 3_500;
const MAX_PROFILE_EVIDENCE = 20;
const MAX_PROFILE_EVIDENCE_CHARS = 600;
const MAX_ROOT_FILES = 80;
const MAX_ROOT_FILE_CHARS = 160;

const RepairActionOutputSchema = z.discriminatedUnion("type", [
  z.object({ command: z.string().min(1).max(2_000), reason: z.string().min(1).max(500), type: z.literal("run_command") }).strict(),
  z.object({ content: z.string().max(12_000), path: z.string().min(1).max(500), reason: z.string().min(1).max(500), type: z.literal("write_file") }).strict(),
  z.object({ path: z.string().min(1).max(500), reason: z.string().min(1).max(500), replacement: z.string().max(12_000), search: z.string().min(1).max(12_000), type: z.literal("replace_text") }).strict(),
  z.object({ command: z.string().min(1).max(2_000), expectedPorts: z.array(z.number().int().min(1).max(65_535)).min(1).max(8), reason: z.string().min(1).max(500), type: z.literal("try_start") }).strict(),
]);

const RepairStrategyOutputSchema = z.union([
  repairStrategySchema("repair-a"),
  repairStrategySchema("repair-b"),
  repairStrategySchema("repair-c"),
]);

const RepairPlanOutputSchema = z.object({
  diagnosis: z.string().min(1).max(1_000),
  strategies: z.array(RepairStrategyOutputSchema).length(3),
}).strict();

function repairStrategySchema(id: "repair-a" | "repair-b" | "repair-c"): z.ZodType {
  return z.object({
    actions: z.array(RepairActionOutputSchema).min(1).max(8),
    hypothesis: z.string().min(1).max(400),
    id: z.literal(id),
    invasiveness: z.enum(["environment", "config", "dependency", "source"]),
    title: z.string().min(1).max(80),
  }).strict();
}

export class OpenAIRepairPlanner implements RepairPlanner {
  private readonly client: OpenAI;
  private readonly model: string;

  public constructor() {
    assertServerOnly();
    this.client = new OpenAI({ apiKey: requiredEnvironment("OPENAI_API_KEY") });
    this.model = process.env.OPENAI_REPAIR_MODEL?.trim() || DEFAULT_MODEL;
  }

  public async plan(input: RepairPlannerInput): Promise<RepairPlan> {
    const response = await this.client.responses.parse({
      input: repairPrompt(input),
      model: this.model,
      reasoning: { effort: "medium" },
      text: { format: zodTextFormat(RepairPlanOutputSchema, "repair_plan") },
    });
    if (response.output_parsed === null) throw new Error("OpenAI returned no parsed repair plan.");
    return RepairPlanSchema.parse(response.output_parsed);
  }
}

const repairPrompt = (input: RepairPlannerInput): string => JSON.stringify({
  instructions: [
    "Produce exactly three distinct repair strategies in the requested schema.",
    "Use only the provided repository evidence and baseline failure; do not invent files, package versions, APIs, or command flags.",
    "Prefer the least invasive strategy first and keep every action concrete, bounded, and reversible where possible.",
    "Do not include secrets, credentials, network exfiltration, destructive operations, or commands outside the repository.",
  ],
  baselineFailure: {
    command: bounded(input.failure.command, 1_000),
    exitCode: input.failure.exitCode,
    stage: input.failure.stage,
    stderr: redactAndBound(input.failure.stderr, MAX_FAILURE_CHARS),
    stdout: redactAndBound(input.failure.stdout, MAX_FAILURE_CHARS),
    summary: bounded(input.failure.summary, 1_000),
  },
  repository: {
    commit: bounded(input.evidence.commit, 160),
    rootFiles: input.evidence.rootFiles.slice(0, MAX_ROOT_FILES).map((file: string): string => bounded(file, MAX_ROOT_FILE_CHARS)),
    textFiles: Object.fromEntries(Object.entries(input.evidence.textFiles).slice(0, MAX_EVIDENCE_FILES)
      .map(([path, content]: [string, string]): [string, string] => [bounded(path, MAX_ROOT_FILE_CHARS), redactAndBound(content, MAX_TEXT_FILE_CHARS)])),
  },
  profile: {
    buildCommand: input.profile.buildCommand,
    evidence: input.profile.evidence.slice(0, MAX_PROFILE_EVIDENCE).map((item: string): string => redactAndBound(item, MAX_PROFILE_EVIDENCE_CHARS)),
    framework: bounded(input.profile.framework, 160),
    installCommand: input.profile.installCommand,
    isGui: input.profile.isGui,
    language: input.profile.language,
    likelyPorts: input.profile.likelyPorts.slice(0, 8),
    packageManager: input.profile.packageManager,
    runtime: input.profile.runtime,
    startCommand: input.profile.startCommand,
  },
  verifiedCapabilities: input.verifiedCapabilities.slice(0, 30).map((capability: string): string => bounded(capability, 240)),
});

const redactAndBound = (value: string, limit: number): string => bounded(
  value
    .replace(/(api[_-]?key|authorization|token|password|secret)\s*[:=]\s*[^\s"']+/gi, "$1=[REDACTED]")
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "[REDACTED_OPENAI_KEY]"),
  limit,
);

const bounded = (value: string, limit: number): string => value.length <= limit ? value : `${value.slice(0, limit)}\n[TRUNCATED]`;

const assertServerOnly = (): void => {
  if (typeof window !== "undefined") throw new Error("OpenAIRepairPlanner must run on the server.");
};

const requiredEnvironment = (name: string): string => {
  const value = process.env[name]?.trim();
  if (value === undefined || value.length === 0) throw new Error(`${name} must be configured on the server.`);
  return value;
};
