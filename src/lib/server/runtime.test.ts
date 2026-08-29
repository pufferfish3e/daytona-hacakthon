import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getResurrectionServiceState,
  resetResurrectionRuntimeCache,
} from "@/lib/server/runtime";

describe("resurrection runtime composition", () => {
  afterEach((): void => {
    vi.unstubAllEnvs();
    resetResurrectionRuntimeCache();
  });

  it("forces demo mode when the demo flag is set even with live credentials", () => {
    resetResurrectionRuntimeCache();
    const state = getResurrectionServiceState({
      DAYTONA_API_KEY: "daytona-key",
      OPENAI_API_KEY: "openai-key",
      PROJECT_RESURRECTION_DEMO_MODE: "true",
      PROJECT_RESURRECTION_RUN_DIR: "/tmp/resurrection-demo-runtime",
    });

    expect(state.config.mode).toBe("demo");
    expect(state.dependencies).toBeDefined();
    expect(state.unavailableMessage).toBe("");
  });

  it("selects live mode when both required keys are present and demo mode is off", () => {
    vi.stubEnv("DAYTONA_API_KEY", "daytona-key");
    vi.stubEnv("OPENAI_API_KEY", "openai-key");
    resetResurrectionRuntimeCache();
    const state = getResurrectionServiceState({
      DAYTONA_API_KEY: "daytona-key",
      OPENAI_API_KEY: "openai-key",
      PROJECT_RESURRECTION_RUN_DIR: "/tmp/resurrection-live-runtime",
    });

    expect(state.config.mode).toBe("live");
    expect(state.dependencies).toBeDefined();
    expect(state.unavailableMessage).toBe("");
  });

  it("auto-selects demo mode when no live keys are present", () => {
    resetResurrectionRuntimeCache();
    const state = getResurrectionServiceState({
      PROJECT_RESURRECTION_RUN_DIR: "/tmp/resurrection-auto-demo",
    });

    expect(state.config.mode).toBe("demo");
    expect(state.dependencies).toBeDefined();
  });

  it("returns unconfigured when only one live key is present", () => {
    resetResurrectionRuntimeCache();
    const state = getResurrectionServiceState({
      DAYTONA_API_KEY: "daytona-key",
      PROJECT_RESURRECTION_RUN_DIR: "/tmp/resurrection-unconfigured",
    });

    expect(state.config.mode).toBe("unconfigured");
    expect(state.dependencies).toBeUndefined();
    expect(state.unavailableMessage).toContain("OPENAI_API_KEY");
  });
});
