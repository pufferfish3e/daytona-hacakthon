import { composeRunService, type CreateRunDependencies } from "@/lib/jobs/start-run";
import { createDaytonaProvider } from "@/lib/daytona/daytona-provider";
import { NosanaVisualProofAdapter } from "@/lib/nosana/nosana-visual-proof";
import { OpenAIRepairPlanner } from "@/lib/openai/openai-repair-planner";
import { ResurrectionOrchestrator } from "@/lib/resurrection/orchestrator";
import { DEFAULT_WEB_VERIFIER } from "@/lib/resurrection/verify";
import { FileRunStore } from "@/lib/store/file-run-store";

const VERIFIED_CAPABILITIES = [
  "daytona-sandbox-execution",
  "openai-repair-planning",
  "web-process-verification",
  "nosana-visual-proof",
];

export const composeProductionRunService = (runDirectory: string): CreateRunDependencies => {
  const store = new FileRunStore(runDirectory);
  const orchestrator = new ResurrectionOrchestrator({
    now: (): Date => new Date(),
    planner: new OpenAIRepairPlanner(),
    provider: createDaytonaProvider(),
    store,
    verifiedCapabilities: VERIFIED_CAPABILITIES,
    verifier: DEFAULT_WEB_VERIFIER,
    visualProof: new NosanaVisualProofAdapter(),
  });
  return composeRunService({ orchestrator, store });
};
