import { createRequire } from "node:module";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

process.env.PROJECT_RESURRECTION_DEMO_MODE = "false";
process.env.PROJECT_RESURRECTION_RUN_DIR = await mkdtemp(join(tmpdir(), "resurrection-live-smoke-"));

const { POST } = await import("../../../src/app/api/runs/route.ts");
const { GET } = await import("../../../src/app/api/runs/[id]/route.ts");

const repoUrl = process.argv[2] ?? "https://github.com/vercel/nextjs-portfolio-starter";
const postResponse = await POST(new Request("http://local/api/runs", {
  body: JSON.stringify({ repoUrl }),
  headers: { "content-type": "application/json" },
  method: "POST",
}));

if (postResponse.status === 503) {
  const body = await postResponse.json();
  throw new Error(`Live service unavailable: ${body.error ?? postResponse.status}`);
}
if (postResponse.status !== 202) {
  const body = await postResponse.text();
  throw new Error(`POST failed (${postResponse.status}): ${body}`);
}

const created = await postResponse.json();
let run;
for (let attempt = 0; attempt < 600; attempt += 1) {
  const response = await GET(new Request(`http://local/api/runs/${created.id}`), {
    params: Promise.resolve({ id: created.id }),
  });
  run = await response.json();
  if (run.status === "success" || run.status === "failed") break;
  await new Promise((resolve) => setTimeout(resolve, 1_000));
}

if (!run || (run.status !== "success" && run.status !== "failed")) {
  throw new Error(`Run ${created.id} did not finish within the polling window (last status: ${run?.status ?? "unknown"}).`);
}

console.log(JSON.stringify({
  failureReason: run.failureReason,
  previewUrl: run.previewUrl,
  repoUrl,
  runId: created.id,
  status: run.status,
  visualProof: run.visualProof,
}, null, 2));

if (run.status !== "success") process.exit(1);
