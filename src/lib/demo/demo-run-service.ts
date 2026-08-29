import { tmpdir } from "node:os";
import { join } from "node:path";

import { composeRunService, type CreateRunDependencies } from "@/lib/jobs/start-run";
import { ResurrectionOrchestrator } from "@/lib/resurrection/orchestrator";
import { FileRunStore } from "@/lib/store/file-run-store";
import { DemoComputeProvider } from "./demo-compute-provider";
import { DemoRepairPlanner } from "./demo-repair-planner";
import { DemoWebVerifier } from "./demo-web-verifier";

const DEMO_MODE_VALUE = "true";
const RUN_DIRECTORY = process.env.PROJECT_RESURRECTION_RUN_DIR ?? join(tmpdir(), "project-resurrection-runs");

let demoRunService: CreateRunDependencies | undefined;

export const getDemoRunService = (): CreateRunDependencies | undefined => {
  if (process.env.PROJECT_RESURRECTION_DEMO_MODE !== DEMO_MODE_VALUE) return undefined;
  if (demoRunService === undefined) demoRunService = composeDemoRunService();
  return demoRunService;
};

const composeDemoRunService = (): CreateRunDependencies => {
  const store = new FileRunStore(RUN_DIRECTORY);
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
