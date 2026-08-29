import type { EnvSource } from "./env";
import { composeDemoRunService } from "@/lib/demo/demo-run-service";
import type { CreateRunDependencies } from "@/lib/jobs/start-run";
import { parseResurrectionEnv, resurrectionUnavailableMessage, type ResurrectionEnv } from "./env";
import { composeLiveRunService } from "./live-run-service";

export interface ResurrectionServiceState {
  config: ResurrectionEnv;
  dependencies?: CreateRunDependencies;
  unavailableMessage: string;
}

let cachedState: ResurrectionServiceState | undefined;

export const getResurrectionServiceState = (
  env: EnvSource = process.env,
): ResurrectionServiceState => {
  const config = parseResurrectionEnv(env);
  const dependencies = composeResurrectionRunService(config);
  return {
    config,
    dependencies,
    unavailableMessage: dependencies ? "" : resurrectionUnavailableMessage(config),
  };
};

export const getResurrectionRunService = (
  env: EnvSource = process.env,
): CreateRunDependencies | undefined => getResurrectionServiceState(env).dependencies;

export const resetResurrectionRuntimeCache = (): void => {
  cachedState = undefined;
};

export const getCachedResurrectionRunService = (): CreateRunDependencies | undefined => {
  if (cachedState === undefined) cachedState = getResurrectionServiceState();
  return cachedState.dependencies;
};

const composeResurrectionRunService = (config: ResurrectionEnv): CreateRunDependencies | undefined => {
  switch (config.mode) {
    case "demo":
      return composeDemoRunService(config.runDirectory);
    case "live":
      return composeLiveRunService(config);
    case "unconfigured":
      return undefined;
  }
};
