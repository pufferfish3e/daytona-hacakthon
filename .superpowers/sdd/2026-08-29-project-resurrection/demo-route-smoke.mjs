import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.PROJECT_RESURRECTION_DEMO_MODE = "true";
process.env.PROJECT_RESURRECTION_RUN_DIR = await mkdtemp(join(tmpdir(), "resurrection-demo-smoke-"));

const { POST, createPostRunHandler } = await import("../../../src/app/api/runs/route.ts");
const { GET } = await import("../../../src/app/api/runs/[id]/route.ts");

const unavailableResponse = await createPostRunHandler()(new Request("http://local/api/runs", { method: "POST" }));
if (unavailableResponse.status !== 503) throw new Error(`Non-demo handler returned ${unavailableResponse.status}`);

const invalidResponse = await POST(new Request("http://local/api/runs", {
  body: JSON.stringify({ repoUrl: "https://evil.example/acme/demo-app" }),
  headers: { "content-type": "application/json" },
  method: "POST",
}));
if (invalidResponse.status !== 400) throw new Error(`Unsafe URL returned ${invalidResponse.status}`);

const postResponse = await POST(new Request("http://local/api/runs", {
  body: JSON.stringify({ repoUrl: "https://github.com/acme/demo-app" }),
  headers: { "content-type": "application/json" },
  method: "POST",
}));
const created = await postResponse.json();
if (postResponse.status !== 202 || typeof created.id !== "string") {
  throw new Error(`POST failed: ${postResponse.status}`);
}

let status = "queued";
for (let attempt = 0; attempt < 80; attempt += 1) {
  const response = await GET(new Request(`http://local/api/runs/${created.id}`), {
    params: Promise.resolve({ id: created.id }),
  });
  const run = await response.json();
  status = run.status;
  if (status === "success" || status === "failed") break;
  await new Promise((resolve) => setTimeout(resolve, 25));
}

if (status !== "success") throw new Error(`Demo lifecycle ended as ${status}`);
console.log(JSON.stringify({
  invalidUrlStatus: invalidResponse.status,
  nonDemoStatus: unavailableResponse.status,
  postStatus: postResponse.status,
  runId: created.id,
  status,
}));
