import { tmpdir } from "node:os";
import { join } from "node:path";

import { createDaytonaProvider } from "@/lib/daytona/daytona-provider";
import { composeRunService, type CreateRunDependencies } from "@/lib/jobs/start-run";
import { OpenAIRepairPlanner } from "@/lib/openai/openai-repair-planner";
import { ResurrectionOrchestrator } from "@/lib/resurrection/orchestrator";
import { DEFAULT_WEB_VERIFIER } from "@/lib/resurrection/verify";
import { FileRunStore } from "@/lib/store/file-run-store";

const RUN_DIRECTORY = process.env.PROJECT_RESURRECTION_RUN_DIR ?? join(tmpdir(), "project-resurrection-runs");
const REQUIRED_ENVIRONMENT_NAMES = ["DAYTONA_API_KEY", "OPENAI_API_KEY"] as const;
const VERIFIED_CAPABILITIES = [
  "daytona-sandbox-execution",
  "openai-repair-planning",
  "web-process-verification",
];

let productionRunService: CreateRunDependencies | undefined;

export const getProductionRunService = (): CreateRunDependencies | undefined => {
  if (!hasRequiredEnvironment()) return undefined;
  if (productionRunService === undefined) productionRunService = composeProductionRunService();
  return productionRunService;
};

const composeProductionRunService = (): CreateRunDependencies => {
  const store = new FileRunStore(RUN_DIRECTORY);
  const orchestrator = new ResurrectionOrchestrator({
    now: (): Date => new Date(),
    planner: new OpenAIRepairPlanner(),
    provider: createDaytonaProvider(),
    store,
    verifiedCapabilities: VERIFIED_CAPABILITIES,
    verifier: DEFAULT_WEB_VERIFIER,
  });
  return composeRunService({ orchestrator, store });
};

const hasRequiredEnvironment = (): boolean => REQUIRED_ENVIRONMENT_NAMES.every(
  (name: (typeof REQUIRED_ENVIRONMENT_NAMES)[number]): boolean => (process.env[name]?.trim().length ?? 0) > 0,
);
