import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");
loadEnvConfig("/Users/pufferfish/Desktop/daytona");

const { OpenAIRepairPlanner } = await import("../../../src/lib/openai/openai-repair-planner.ts");
const planner = new OpenAIRepairPlanner();
const plan = await planner.plan({
  evidence: {
    commit: "live-smoke",
    rootFiles: ["package.json", "package-lock.json"],
    textFiles: {
      "package.json": JSON.stringify({
        dependencies: { next: "12.3.4", react: "17.0.2" },
        scripts: { dev: "next dev" },
      }),
    },
  },
  failure: {
    command: "npm run dev",
    stage: "start",
    stderr: "Error: unsupported Node runtime",
    stdout: "",
    summary: "The detected start command failed under the current runtime.",
  },
  profile: {
    evidence: ["package.json scripts.dev=next dev"],
    framework: "Next.js",
    installCommand: "npm ci",
    isGui: true,
    language: "javascript",
    likelyPorts: [3000],
    packageManager: "npm",
    runtime: "Node 16.x",
    startCommand: "npm run dev",
  },
  verifiedCapabilities: ["node", "npm", "daytona-sandbox-execution"],
});

console.log(JSON.stringify({
  strategyCount: plan.strategies.length,
  strategyIds: plan.strategies.map((strategy) => strategy.id),
}));
