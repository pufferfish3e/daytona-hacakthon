import { describe, expect, it } from "vitest";

import { resolveScreenshotUrl } from "./screenshot-url";

describe("resolveScreenshotUrl", () => {
  it("accepts safe HTTPS preview URLs", () => {
    expect(resolveScreenshotUrl("https://preview.daytona.test/app")).toBe("https://preview.daytona.test/app");
  });

  it("rejects non-HTTPS URLs", () => {
    expect(resolveScreenshotUrl("http://preview.daytona.test/app")).toBeUndefined();
  });

  it("rejects URLs with embedded credentials", () => {
    expect(resolveScreenshotUrl("https://user:pass@preview.daytona.test/app")).toBeUndefined();
  });
});
