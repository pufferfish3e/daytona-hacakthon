import type { CreateRunDependencies } from "@/lib/jobs/start-run";
import { getProductionRunService } from "@/lib/server/production-run-service";
import type { ResurrectionEnv } from "./env";

export const composeLiveRunService = (_config: ResurrectionEnv): CreateRunDependencies | undefined =>
  getProductionRunService();
