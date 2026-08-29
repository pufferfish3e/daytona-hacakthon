import { tmpdir } from "node:os";
import { join } from "node:path";

export type ResurrectionRuntimeMode = "demo" | "live" | "unconfigured";

export interface ResurrectionEnv {
  mode: ResurrectionRuntimeMode;
  runDirectory: string;
  demoModeForced: boolean;
  hasDaytonaKey: boolean;
  hasOpenAiKey: boolean;
  hasNosanaKey: boolean;
  missingLiveKeys: string[];
  openAiModel: string;
}

const DEMO_MODE_VALUE = "true";
const DEFAULT_OPENAI_MODEL = "gpt-5.6-sol";

const hasValue = (value: string | undefined): boolean => Boolean(value?.trim());

export type EnvSource = Record<string, string | undefined>;

export const resolveRunDirectory = (env: EnvSource = process.env): string =>
  env.PROJECT_RESURRECTION_RUN_DIR?.trim() || join(tmpdir(), "project-resurrection-runs");

export const resolveResurrectionMode = (env: EnvSource = process.env): ResurrectionRuntimeMode => {
  if (env.PROJECT_RESURRECTION_DEMO_MODE === DEMO_MODE_VALUE) return "demo";

  const hasDaytonaKey = hasValue(env.DAYTONA_API_KEY);
  const hasOpenAiKey = hasValue(env.OPENAI_API_KEY);

  if (hasDaytonaKey && hasOpenAiKey) return "live";
  if (!hasDaytonaKey && !hasOpenAiKey) return "demo";
  return "unconfigured";
};

export const parseResurrectionEnv = (env: EnvSource = process.env): ResurrectionEnv => {
  const hasDaytonaKey = hasValue(env.DAYTONA_API_KEY);
  const hasOpenAiKey = hasValue(env.OPENAI_API_KEY);
  const missingLiveKeys = [
    ...(hasDaytonaKey ? [] : ["DAYTONA_API_KEY"]),
    ...(hasOpenAiKey ? [] : ["OPENAI_API_KEY"]),
  ];

  return {
    mode: resolveResurrectionMode(env),
    runDirectory: resolveRunDirectory(env),
    demoModeForced: env.PROJECT_RESURRECTION_DEMO_MODE === DEMO_MODE_VALUE,
    hasDaytonaKey,
    hasOpenAiKey,
    hasNosanaKey: hasValue(env.NOSANA_API_KEY),
    missingLiveKeys,
    openAiModel: env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
  };
};

export const resurrectionUnavailableMessage = (config: ResurrectionEnv): string => {
  if (config.mode === "unconfigured") {
    return `Resurrection service is not configured. Set ${config.missingLiveKeys.join(" and ")} for live mode, or set PROJECT_RESURRECTION_DEMO_MODE=true.`;
  }

  if (config.mode === "live") {
    return "Live resurrection credentials are set, but Daytona/OpenAI adapters are not installed yet. Use demo mode or complete the live adapter integration.";
  }

  return "Resurrection service is not configured.";
};
