import type { CreateRunDependencies } from "@/lib/jobs/start-run";
import { composeProductionRunService } from "@/lib/server/production-run-service";
import type { ResurrectionEnv } from "./env";

export const composeLiveRunService = (config: ResurrectionEnv): CreateRunDependencies | undefined => {
  if (config.mode !== "live") return undefined;
  return composeProductionRunService(config.runDirectory);
};
