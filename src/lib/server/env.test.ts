import { describe, expect, it } from "vitest";

import { parseResurrectionEnv, resolveResurrectionMode } from "./env";

describe("resolveResurrectionMode", () => {
  it("forces demo mode when the demo flag is set", () => {
    expect(resolveResurrectionMode({
      DAYTONA_API_KEY: "daytona-key",
      OPENAI_API_KEY: "openai-key",
      PROJECT_RESURRECTION_DEMO_MODE: "true",
    })).toBe("demo");
  });

  it("selects live mode when both required keys are present", () => {
    expect(resolveResurrectionMode({
      DAYTONA_API_KEY: "daytona-key",
      OPENAI_API_KEY: "openai-key",
    })).toBe("live");
  });

  it("auto-selects demo mode when no live keys are present", () => {
    expect(resolveResurrectionMode({})).toBe("demo");
  });

  it("stays unconfigured when only one live key is present", () => {
    expect(resolveResurrectionMode({ DAYTONA_API_KEY: "daytona-key" })).toBe("unconfigured");
    expect(resolveResurrectionMode({ OPENAI_API_KEY: "openai-key" })).toBe("unconfigured");
  });
});

describe("parseResurrectionEnv", () => {
  it("reports missing live keys for partial configuration", () => {
    const config = parseResurrectionEnv({ DAYTONA_API_KEY: "daytona-key" });
    expect(config.mode).toBe("unconfigured");
    expect(config.missingLiveKeys).toEqual(["OPENAI_API_KEY"]);
  });
});
