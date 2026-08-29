import { describe, expect, it } from "vitest";

import { detectProject } from "./detect";
import type { RepoEvidence } from "./inspect";

const evidence = (textFiles: Record<string, string>, rootFiles = Object.keys(textFiles)): RepoEvidence => ({
  commit: "abc123",
  rootFiles,
  textFiles,
});

describe("detectProject", () => {
  it("detects a locked Next.js npm project without AI", () => {
    const profile = detectProject(evidence({
      "package-lock.json": "{}",
      "package.json": JSON.stringify({
        dependencies: { next: "12.3.4", react: "17.0.2" },
        engines: { node: "16.x" },
        scripts: { build: "next build", dev: "next dev" },
      }),
    }));

    expect(profile).toMatchObject({
      framework: "Next.js",
      installCommand: "npm ci",
      isGui: true,
      language: "javascript",
      likelyPorts: [3000],
      packageManager: "npm",
      runtime: "Node 16.x",
      startCommand: "npm run dev",
    });
  });

  it("detects FastAPI but does not invent a module entrypoint", () => {
    const profile = detectProject(evidence({
      "requirements.txt": "fastapi==0.95.0\nuvicorn==0.21.0\n",
    }));

    expect(profile).toMatchObject({
      framework: "FastAPI",
      installCommand: "pip3 install -r requirements.txt",
      isGui: false,
      language: "python",
      likelyPorts: [8000],
      packageManager: "pip",
    });
    expect(profile.startCommand).toBeUndefined();
  });

  it("prefers an explicit package manager when no lockfile exists", () => {
    const profile = detectProject(evidence({
      "package.json": JSON.stringify({
        packageManager: "pnpm@9.1.0",
        scripts: { start: "node server.js" },
      }),
    }));

    expect(profile.packageManager).toBe("pnpm");
    expect(profile.installCommand).toBe("pnpm install --frozen-lockfile");
  });
});
