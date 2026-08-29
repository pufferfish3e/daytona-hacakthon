import { describe, expect, it } from "vitest";

import { UnsafeSandboxPathError, resolveRepositoryPath } from "./path-policy";

describe("resolveRepositoryPath", () => {
  it("resolves a repository-relative path", () => {
    expect(resolveRepositoryPath("workspace/repo", "src/app.ts")).toBe(
      "workspace/repo/src/app.ts",
    );
  });

  it.each(["../secret", "/etc/passwd", "src/../../secret", "src/\u0000bad", "C:\\secret"])(
    "rejects path escape %s",
    (path: string) => {
      expect(() => resolveRepositoryPath("workspace/repo", path)).toThrow(
        UnsafeSandboxPathError,
      );
    },
  );
});
