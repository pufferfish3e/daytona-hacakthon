import { describe, expect, it } from "vitest";

import { detectProject } from "@/lib/resurrection/detect";
import { collectRepoEvidence } from "@/lib/resurrection/inspect";
import { DemoComputeProvider } from "./demo-compute-provider";
import { DemoWebVerifier } from "./demo-web-verifier";

describe("demo adapters", () => {
  it("supplies bounded Next.js npm evidence without cloning a repository", async () => {
    const provider = new DemoComputeProvider();
    const sandbox = await provider.createSeed({ cpu: 2, diskGiB: 20, memoryGiB: 4, name: "seed", ttlMinutes: 15 });
    const evidence = await collectRepoEvidence({
      commit: "demo-nextjs-commit", deadline: Date.now() + 1_000, now: (): number => Date.now(),
      provider, repoRoot: "workspace/repo", sandbox,
    });

    expect(detectProject(evidence)).toMatchObject({
      framework: "Next.js", installCommand: "npm ci", packageManager: "npm", startCommand: "npm run dev",
    });
  });

  it("returns objective baseline verification without issuing an HTTP request", async () => {
    const result = await new DemoWebVerifier().verify({
      likelyPorts: [3000], now: (): number => Date.now(), process: { commandId: "command", sessionId: "session" },
      provider: new DemoComputeProvider(), sandbox: { id: "demo-seed", name: "demo-seed" }, timeoutAt: Date.now() + 1_000,
    });

    expect(result).toMatchObject({ httpStatus: 200, isVerified: true, port: 3000, processAlive: true });
  });
});
