import { describe, expect, it } from "vitest";

import { InvalidRepositoryUrlError, parsePublicGitHubUrl } from "./parse-url";

describe("parsePublicGitHubUrl", () => {
  it("canonicalizes a public GitHub repository URL", () => {
    expect(parsePublicGitHubUrl("https://github.com/acme/old-app.git")).toEqual({
      owner: "acme",
      repo: "old-app",
      canonicalUrl: "https://github.com/acme/old-app.git",
    });
  });

  it.each([
    "http://github.com/acme/old-app",
    "https://evil.example/acme/old-app",
    "https://github.com/acme/old-app/issues",
    "https://user:pass@github.com/acme/old-app",
    "https://github.com/acme/old-app?x=1",
    "https://github.com/acme/old-app#readme",
    "https://github.com/acme/old-app;touch-pwned",
  ])("rejects unsafe input %s", (repoUrl: string) => {
    expect(() => parsePublicGitHubUrl(repoUrl)).toThrow(InvalidRepositoryUrlError);
  });
});
