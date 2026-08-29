import { composeRunService, type CreateRunDependencies } from "@/lib/jobs/start-run";
import { resolveRunDirectory } from "@/lib/server/env";
import { ResurrectionOrchestrator } from "@/lib/resurrection/orchestrator";
import { FileRunStore } from "@/lib/store/file-run-store";
import { DemoComputeProvider } from "./demo-compute-provider";
import { DemoRepairPlanner } from "./demo-repair-planner";
import { DemoWebVerifier } from "./demo-web-verifier";

let demoRunService: CreateRunDependencies | undefined;

export const composeDemoRunService = (runDirectory: string): CreateRunDependencies => {
  const store = new FileRunStore(runDirectory);
  const orchestrator = new ResurrectionOrchestrator({
    now: (): Date => new Date(),
    planner: new DemoRepairPlanner(),
    provider: new DemoComputeProvider(),
    store,
    verifiedCapabilities: ["demo-local-only"],
    verifier: new DemoWebVerifier(),
  });
  return composeRunService({ orchestrator, store });
};

/** @deprecated Use `getResurrectionRunService()` from `@/lib/server/runtime`. */
export const getDemoRunService = (): CreateRunDependencies | undefined => {
  if (process.env.PROJECT_RESURRECTION_DEMO_MODE !== "true") return undefined;
  if (demoRunService === undefined) demoRunService = composeDemoRunService(resolveRunDirectory());
  return demoRunService;
};
