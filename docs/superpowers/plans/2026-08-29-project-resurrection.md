# Project Resurrection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the hackathon MVP that accepts a public GitHub web-project URL, runs it only in Daytona, verifies a baseline boot, races exactly three isolated repair forks when baseline fails, and returns a verified live preview with a concise reconstruction summary.

**Architecture:** A Next.js 16 App Router application exposes short-lived run creation and polling APIs backed by an atomic process-local file store. A deterministic TypeScript orchestrator owns the state machine and calls a small injected `ComputeProvider`; Daytona is the execution and repair environment, OpenAI is called once for a structured three-strategy repair plan after baseline failure, and Nosana performs one bounded GPU visual-proof job for the selected GUI demo. One pristine seed sandbox is cloned and snapshotted, baseline runs on a fork, and any repair forks are created concurrently from the still-pristine seed.

**Tech Stack:** TypeScript 5 strict mode, Next.js 16.3.3, React 19.2.8, Tailwind CSS 4, small shadcn-compatible local primitives, Lucide React, Daytona TypeScript SDK, OpenAI JavaScript SDK Responses API, Nosana TypeScript SDK or verified job API, Zod, Vitest, Testing Library.

**Spec:** `project-resurrection-spec.md`

## Global Constraints

- Timebox: 5 hours total; freeze major feature work at 4:30.
- Primary path: public Node.js/JavaScript/TypeScript web repositories; basic Python web detection remains bounded fallback support.
- Untrusted repository code executes only inside Daytona; no repository command runs on the Next.js host.
- Clone only canonical public `https://github.com/<owner>/<repo>` URLs built from validated segments.
- Never pass `DAYTONA_API_KEY`, `OPENAI_API_KEY`, host environment variables, or Supabase keys into a sandbox.
- Parallel repair forks: exactly 3; one strategy-generation round; no recursive forks.
- Command timeout: 120 seconds; total run timeout: 8 minutes.
- Sandbox allocation: 2 CPU, 4 GiB memory, 20 GiB disk, 15-minute TTL unless the account rejects those values during preflight.
- Winner ranking: no source changes, then environment/config changes, then dependency changes, then source changes, then fewer changed files, then faster verified boot.
- Verification: process still running plus HTTP 200-399 on a detected port; the model never declares success.
- Visual verification: for the selected GUI demo, Daytona captures the rendered screenshot and Nosana runs one GPU-backed visual-proof inference; it is demo-visible but never controls repair decisions.
- Repair trace/replay: optional polish after the core flow is green; it cannot delay integration or demo rehearsal.
- Persistence: atomic JSON files under `PROJECT_RESURRECTION_RUN_DIR` or the OS temp directory; no auth, Supabase, WebSockets, LangChain, or CI changes.
- TypeScript: explicit parameter and return types, no `any`, no default exports except React/Next pages, functions no longer than 40 lines, and nesting no deeper than three levels.
- Test-first chronology is required for production behavior: write a test, observe the intended failure, add the minimum implementation, then rerun the scoped test.
- Package installation, git operations, full-suite tests, E2E tests, and CI changes require explicit user approval at execution time.

---

## Pre-Task Critique and Risk Controls

- [CONFIRMED] The request solves a coherent hackathon problem, but “arbitrary GitHub repository” is not credible; all copy and acceptance criteria promise dormant public web projects only.
- [CONFIRMED] The main security boundary is sandbox isolation, not malware detection; the UI must not claim submitted repositories are safe.
- [CONFIRMED] Directly forking the baseline sandbox would contaminate all repairs, so baseline must run on its own fork while the seed remains untouched.
- [CONFIRMED] A single long browser request is fragile; `POST /api/runs` returns `202` immediately and a background job updates a pollable run record.
- [CONFIRMED] A file-backed run store is slightly more code than a module-global `Map`, but it respects the repository rule against global state and survives Next.js development reloads.
- [CONFIRMED] Shell injection from the submitted URL is prevented by parsing and reconstructing a canonical GitHub URL, then using `sandbox.git.clone()` instead of interpolating the URL into a shell command.
- [CONFIRMED] Model-generated commands are still arbitrary, but they execute only inside a secret-free, resource-limited, TTL-bound sandbox.
- [CONFIRMED] Waiting for all three repair results permits deterministic preservation ranking; the 8-minute total timeout bounds the latency cost.
- [UNCERTAIN] Public preview iframe headers may block embedding; the success UI must fall back to a new-tab link without treating that as resurrection failure.
- [UNCERTAIN] Historical runtime selection tools available in the default Daytona snapshot vary; Task 0 must prove one runtime-switch mechanism or constrain the demo repository accordingly.
- [CONFIRMED] Nosana is useful here only if judges can see evidence of real GPU work; a decorative SDK call or disconnected job would weaken the demo.
- [CONFIRMED] This visual-proof use is a deliberate user override of spec §9.11's narrower “only GPU-required repositories” guidance; the scope is capped at one post-repair inference so it cannot displace Daytona or parallel repair.
- [UNCERTAIN] Nosana queue latency and the exact current TypeScript job-submission method may not fit a per-resurrection cold job; Task 0 must choose and prove either the installed SDK path or a prewarmed Nosana endpoint before production integration.

## Current SDK Evidence and Mandatory Live Preflight

The following signatures were verified against official documentation on 2026-08-29, but installed package types remain the implementation authority:

| Status | Assumption | Evidence / implementation consequence |
|---|---|---|
| [DOCUMENTED] | Daytona package is `@daytona/sdk`; `new Daytona()` reads environment configuration. | [Daytona TypeScript SDK](https://www.daytona.io/docs/en/typescript-sdk/) |
| [DOCUMENTED] | `daytona.create({ resources, ttlMinutes, name })` returns a sandbox. | [Daytona client reference](https://www.daytona.io/docs/en/typescript-sdk/daytona/) |
| [DOCUMENTED] | `sandbox.createSnapshot(name, timeout?)` and `sandbox.fork({ name }, timeout?)` are current, non-experimental APIs. | [Daytona sandbox reference](https://www.daytona.io/docs/en/typescript-sdk/sandbox/) |
| [DOCUMENTED] | `sandbox.git.clone(url, path, branch?, commitId?, username?, password?, insecureSkipTls?, depth?)` clones without a host shell. | [Daytona Git reference](https://www.daytona.io/docs/en/typescript-sdk/git/) |
| [DOCUMENTED] | Long-running commands use `createSession`, `executeSessionCommand(..., { command, runAsync: true })`, `getSessionCommand`, and `getSessionCommandLogs`. | [Daytona process reference](https://www.daytona.io/docs/en/typescript-sdk/process/) |
| [DOCUMENTED] | `sandbox.getSignedPreviewUrl(port, expiresInSeconds?)` returns an embeddable/shareable signed URL. | [Daytona preview reference](https://www.daytona.io/docs/en/preview/) |
| [DOCUMENTED] | `sandbox.fs.downloadFile(path)` returns a buffer and `sandbox.fs.uploadFile(Buffer, path)` writes a file. | [Daytona filesystem reference](https://www.daytona.io/docs/en/typescript-sdk/file-system/) |
| [DOCUMENTED] | `gpt-5.6-sol` supports Responses, structured outputs, and `reasoning.effort` values including `medium` and `high`. | [GPT-5.6 Sol model](https://developers.openai.com/api/docs/models/gpt-5.6-sol) |
| [DOCUMENTED] | JavaScript structured output uses `responses.parse`, `zodTextFormat`, and `response.output_parsed`. | [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) |
| [DOCUMENTED] | Nosana jobs use a JSON job definition with `type: "container"`, a `container/run` operation, `gpu: true`, and a selected market; official examples post jobs with `nosana job post --file ... --market ...`. | [Nosana Stable Diffusion job example](https://docs.nosana.io/inference/stable-diffusion.html) |
| [DOCUMENTED] | The official TypeScript package is `@nosana/kit` and its current README documents client creation plus API-key or wallet authentication. | [Nosana Kit repository](https://github.com/nosana-ci/nosana-kit) |
| [VERIFY LIVE] | Daytona credentials permit one seed plus up to three concurrent repair children and one baseline child. | Run `npm run smoke:daytona`; if the quota is lower, stop and report that the approved core mechanic cannot be demonstrated rather than silently reducing fork count. |
| [VERIFY LIVE] | Snapshot creation and fork operations complete within the configured 60-second lifecycle timeout. | Record measured timings in `docs/demo-readiness.md`; do not tune by guesswork. |
| [VERIFY LIVE] | The default snapshot includes `git`, Node/npm, Python/pip, `curl`, and a usable runtime manager (`nvm`, `fnm`, `mise`, or none). | The smoke script prints exact versions and `command -v` results; repair prompts receive only verified capabilities. |
| [VERIFY LIVE] | The account can call `gpt-5.6-sol` with structured output. | Run the single structured connectivity check in Task 0; do not substitute a model without user approval because the spec fixes the model. |
| [VERIFY LIVE] | Signed preview URLs are reachable from the Next.js host and whether the chosen repo allows iframe embedding. | The smoke script starts `python3 -m http.server 8000`; UI uses a link fallback if frame loading is blocked. |
| [VERIFY LIVE] | The installed `@nosana/kit` types expose a supported server-side job submission/status path, or a prewarmed Nosana inference endpoint can be called with the approved credential. | Inspect installed declarations/source and record the exact method names in `docs/demo-readiness.md`; do not invent an SDK signature or shell out from the Next.js server. |
| [VERIFY LIVE] | A verified GPU container/model can classify one JPEG as meaningful UI, blank output, or error overlay within the remaining demo budget. | Pin the tested image reference/digest, market, median latency, job ID, and explorer/dashboard URL; if this fails, core resurrection remains valid but the hackathon demo is `NO-GO` until Nosana proof works. |

## State and Data Flow

```text
POST /api/runs -> validate URL -> write queued run -> start bounded background job -> 202 { id }
                                                 |
                                                 v
create seed -> clone -> snapshot S0 -> inspect/detect -> fork baseline -> install/start/verify
                                                           | success
                                                           v
                                                     publish preview
                                                           |
                                                        failure
                                                           v
                                              OpenAI structured 3-strategy plan
                                                           |
                                      fork S0 A/B/C concurrently from pristine seed
                                                           |
                                      execute + independently verify each candidate
                                                           |
                                      rank successes -> delete losers -> publish winner

GET /api/runs/:id <- atomic JSON run record <- serialized events from orchestrator
```

The seed stays pristine and is stopped after winner selection because Daytona fork lineage can prevent deleting a parent with an active child. The seed and winning child both have TTLs, while the baseline and losing repair forks are deleted immediately.

## Frozen Shared Interfaces

These names are the integration contract. Agent 1 consumes them, Agent 2 owns them, and Agent 3 implements the compute side without renaming fields.

```ts
export type RunStatus =
  | "queued"
  | "creating_sandbox"
  | "cloning"
  | "inspecting"
  | "planning"
  | "installing"
  | "starting"
  | "diagnosing"
  | "repairing"
  | "verifying"
  | "success"
  | "failed";

export type AttemptStatus = "queued" | "running" | "success" | "failed";
export type Invasiveness = "environment" | "config" | "dependency" | "source";

export interface RunEvent {
  id: string;
  at: string;
  kind: RunStatus | "snapshot" | "cleanup" | "winner";
  summary: string;
  forkId?: string;
  technical?: string;
}

export interface ResurrectionAttempt {
  id: string;
  title: string;
  hypothesis: string;
  invasiveness: Invasiveness;
  status: AttemptStatus;
  sandboxId?: string;
  changedFiles: string[];
  bootDurationMs?: number;
  failureReason?: string;
}

export interface ResurrectionRun {
  id: string;
  repoUrl: string;
  repoOwner: string;
  repoName: string;
  status: RunStatus;
  detected?: ProjectProfile;
  attempts: ResurrectionAttempt[];
  events: RunEvent[];
  previewUrl?: string;
  previewPort?: number;
  manifest?: ResurrectionManifest;
  visualProof?: VisualProofResult;
  startedAt: string;
  completedAt?: string;
  failureReason?: string;
}

export interface VisualProofResult {
  provider: "nosana";
  status: "passed" | "failed" | "unavailable";
  label?: "meaningful_ui" | "blank" | "error_overlay";
  summary: string;
  jobId?: string;
  evidenceUrl?: string;
  durationMs?: number;
}
```

```ts
export interface ComputeProvider {
  createSeed(input: CreateSeedInput): Promise<SandboxRef>;
  clonePublicRepository(sandbox: SandboxRef, input: CloneInput): Promise<CloneResult>;
  createSnapshot(sandbox: SandboxRef, name: string): Promise<SnapshotRef>;
  fork(sandbox: SandboxRef, name: string): Promise<SandboxRef>;
  listFiles(sandbox: SandboxRef, path: string, depth: number): Promise<SandboxFile[]>;
  readTextFile(sandbox: SandboxRef, path: string): Promise<string>;
  writeTextFile(sandbox: SandboxRef, path: string, content: string): Promise<void>;
  runCommand(sandbox: SandboxRef, input: CommandInput): Promise<CommandResult>;
  startProcess(sandbox: SandboxRef, input: StartProcessInput): Promise<ProcessRef>;
  getProcess(sandbox: SandboxRef, process: ProcessRef): Promise<ProcessState>;
  getProcessLogs(sandbox: SandboxRef, process: ProcessRef): Promise<ProcessLogs>;
  getSignedPreviewUrl(sandbox: SandboxRef, port: number): Promise<string>;
  stop(sandbox: SandboxRef): Promise<void>;
  delete(sandbox: SandboxRef): Promise<void>;
  deleteSnapshot(snapshot: SnapshotRef): Promise<void>;
}
```

The provider support types are also frozen so neither backend nor integration tests invent incompatible shapes:

```ts
export interface CreateSeedInput { name: string; cpu: number; memoryGiB: number; diskGiB: number; ttlMinutes: number }
export interface SandboxRef { id: string; name: string }
export interface SandboxFile { path: string; isDirectory: boolean; sizeBytes?: number }
export interface SnapshotRef { name: string }
export interface CloneInput { url: string; destination: string }
export interface CloneResult { commit: string }
export interface CommandInput { command: string; cwd: string; timeoutSeconds: number }
export interface CommandResult { exitCode: number; stdout: string; stderr: string; durationMs: number }
export interface StartProcessInput { command: string; cwd: string; sessionId: string }
export interface ProcessRef { sessionId: string; commandId: string }
export interface ProcessState { isAlive: boolean; exitCode?: number }
export interface ProcessLogs { stdout: string; stderr: string }
```

## File Map and Exclusive Ownership

### Agent 1 — UI

- Modify `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`.
- Create `src/app/run/[id]/page.tsx`, `src/app/run/[id]/loading.tsx`, `src/app/run/[id]/error.tsx`.
- Create `src/components/repo-input.tsx`, `src/components/resurrection-dashboard.tsx`, `src/components/resurrection-timeline.tsx`, `src/components/repair-race.tsx`, `src/components/project-preview.tsx`, `src/components/resurrection-summary.tsx`.
- Create local primitives under `src/components/ui/` and UI tests beside components.
- Create `src/lib/client/run-api.ts` and `src/hooks/use-run-polling.ts`.
- Must not edit `src/lib/resurrection/**`, `src/lib/daytona/**`, API routes, package files, or test configuration.

### Agent 2 — Backend / Orchestrator (primary agent)

- Own `package.json`, `package-lock.json`, `vitest.config.ts`, `src/test/setup.ts`, `.env.example`.
- Own `src/lib/contracts/**`, `src/lib/github/**`, `src/lib/store/**`, `src/lib/jobs/**`.
- Own API route handlers under `src/app/api/runs/**`.
- Own deterministic orchestration, detection, OpenAI planning, action execution, and winner selection under `src/lib/resurrection/**` except `verify.ts`.
- Must not edit Agent 1 or Agent 3 paths.

### Agent 3 — Daytona / Verification / Independent Integration Critic

- Own `src/lib/compute/provider.ts`, `src/lib/daytona/**`, `src/lib/nosana/**`, `src/lib/resurrection/verify.ts`, `scripts/daytona-smoke.ts`, `scripts/nosana-smoke.ts`, and their tests.
- After core integration, switch to read-only verifier: run scoped integration checks, record findings in `docs/demo-readiness.md`, and send implementation findings to the owning agent rather than editing another lane.
- Own the Nosana visual-proof implementation and evidence; Agent 2 alone integrates its frozen interface into orchestration.

### Test fixture ownership

- Helpers shown in a test snippet live in that same `*.test.ts`/`*.test.tsx` file unless explicitly listed as shared.
- Create `src/test/fakes/fake-compute-provider.ts` for `createFakeProvider`, `createParallelProvider`, `createRaceProviderWithWinner`, `createVerificationProvider`, `verifiedPreview`, and their typed inputs.
- Create `src/test/fakes/recording-responses-client.ts` for `RecordingResponsesClient`, `validThreeStrategyResponse`, and `duplicateStrategyResponse`.
- UI fixture builders remain beside their owning component tests; do not create a cross-lane fixture barrel.

### Shared-file rule

- Agent 2 publishes contract files first.
- Agents 1 and 3 may import those contracts but do not edit them.
- Only Agent 2 changes dependency manifests; other agents request dependencies through Agent 2.
- No agent performs git operations until the user explicitly authorizes them.

## Five-Hour Parallel Schedule

| Clock | Agent 1 — UI | Agent 2 — Backend | Agent 3 — Daytona / Verification | Integration gate |
|---|---|---|---|---|
| 0:00-0:20 | Read spec and frozen contracts; prepare component tests without production UI. | Task 0 dependency/test setup and Task 1 contracts/URL parser. | Task 0 live Daytona/Nosana SDK signature and quota spike after dependency gate. | Types compile; credentials, fork quota, and a viable Nosana submission path are proven. |
| 0:20-1:15 | Task 5 landing, polling run page, timeline against fixture JSON. | Tasks 2 and 4 run store, APIs, deterministic baseline orchestrator against fake provider. | Task 3 Daytona provider and real smoke script. | Public compatible repo reaches a signed Daytona preview through the real API. |
| 1:15-2:30 | Keep fixture-backed race UI aligned with contract; no backend edits. | Task 6 OpenAI planner and Task 7 parallel repair orchestration. | Add provider verification behavior; independently exercise snapshot/fork/start/cleanup. | Deliberately dormant repo shows three real repair forks and an objectively verified winner. |
| 2:30-3:15 | Task 8 replace fixture data with live polling and success summary. | Fix only integration defects in owned paths; add failure classification. | Verify cleanup, timeouts, port checks, and inspect exact sandbox inventory. | Core ten success metrics in the spec pass. |
| 3:15-4:00 | Accessibility/responsive polish; iframe fallback and Nosana proof badge. | Hardening cases; integrate the frozen visual-proof interface only. | Task 9 demo repository matrix and Task 10 Nosana GPU visual proof. | Primary/backup repos rehearsed and one real Nosana proof is visible. |
| 4:00-4:30 | Optional trace replay only if every core gate is green. | Optional trace data only if every core gate is green. | Independent final scoped verification and evidence record. | No open High/Critical correctness or cleanup finding. |
| 4:30-5:00 | Freeze; demo rehearsal only. | Freeze; bug fixes only. | Freeze; backup run and pitch evidence. | Demo-ready or explicit no-go with reason. |

---

### Task 0: Dependency, Test Harness, and Live SDK Contract Gate

**Owner:** Agent 2 for files; Agent 3 for live smoke evidence.

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `.env.example`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `scripts/daytona-smoke.ts`
- Create: `scripts/nosana-smoke.ts`
- Create: `docs/demo-readiness.md`

**Interfaces:**

- Consumes: current Next.js 16.3.3 project with `strict: true` already present in `tsconfig.json`.
- Produces: scripts `test`, `test:watch`, `typecheck`, `smoke:daytona`, and `smoke:nosana`; verified installed SDK signatures and live account capabilities.

- [ ] **Step 1: Verify package names and versions without installing**

Run:

```bash
npm view @daytona/sdk version
npm view @nosana/kit version
npm view openai version
npm view zod version
npm view vitest version
```

Expected: each command returns one published version. If any package is missing, mark `[VERIFY PACKAGE: <name>]` and stop dependency work.

- [ ] **Step 2: Obtain explicit package-install approval**

Do not run either install command until the user explicitly approves package installation.

```bash
npm install @daytona/sdk @nosana/kit openai zod lucide-react class-variance-authority clsx tailwind-merge
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event tsx
```

Expected: `package.json` and `package-lock.json` contain only the listed additions.

- [ ] **Step 3: Add exact scripts and environment template**

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "smoke:daytona": "tsx scripts/daytona-smoke.ts",
    "smoke:nosana": "tsx scripts/nosana-smoke.ts"
  }
}
```

Create `.env.example`:

```dotenv
DAYTONA_API_KEY=
DAYTONA_API_URL=
DAYTONA_TARGET=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-sol
NOSANA_API_KEY=
NOSANA_MARKET=
NOSANA_VISUAL_ENDPOINT_URL=
PROJECT_RESURRECTION_RUN_DIR=
```

Do not place real values in this file.

- [ ] **Step 4: Configure Vitest**

```ts
// vitest.config.ts
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Write the Daytona/OpenAI smoke script**

The script must:

1. validate `DAYTONA_API_KEY` and `OPENAI_API_KEY` without printing them;
2. create a 2 CPU / 4 GiB / 20 GiB / 15-minute-TTL seed;
3. run `git --version`, `node --version`, `npm --version`, `python3 --version`, `pip3 --version`, `curl --version`, and `command -v nvm || command -v fnm || command -v mise || true` inside it;
4. write a marker, create a named snapshot, create a baseline fork, and verify the marker exists;
5. start `python3 -m http.server 8000` asynchronously, obtain `getSignedPreviewUrl(8000, 3600)`, and fetch it for HTTP 200;
6. attempt three concurrent forks from the untouched seed and record allocation timings;
7. call `openai.responses.parse` with a two-field Zod schema using `gpt-5.6-sol` and `reasoning: { effort: "medium" }`;
8. delete all children, delete the snapshot, and delete the seed in `finally`, logging cleanup failures with sandbox IDs.

Use the documented SDK calls; after installation confirm their declarations with:

```bash
rg -n "createSnapshot\(|fork\(|getSignedPreviewUrl\(" node_modules/@daytona/sdk
rg -n "responses\.parse|zodTextFormat" node_modules/openai
```

- [ ] **Step 6: Run non-secret checks**

Run:

```bash
npm run typecheck
npm run lint -- vitest.config.ts src/test/setup.ts scripts/daytona-smoke.ts scripts/nosana-smoke.ts
```

Expected: both commands exit 0 with no warnings introduced by these files.

- [ ] **Step 7: Run live smoke only when credentials are present**

Run:

```bash
npm run smoke:daytona
```

Expected: output includes exact versions, one HTTP 200, three distinct fork IDs, one parsed OpenAI object, measured durations, and confirmed cleanup. Record only non-secret results in `docs/demo-readiness.md`.

- [ ] **Step 8: Prove the Nosana path before visual-proof implementation**

After package approval and credential provisioning, inspect the installed declarations/source with:

```bash
rg -n "createNosanaClient|jobs|runs|market" node_modules/@nosana/kit
```

Then implement `scripts/nosana-smoke.ts` against only the confirmed types. It must submit or call one GPU-backed image-classification workload, poll it with a two-minute deadline, validate a three-label result (`meaningful_ui`, `blank`, `error_overlay`), print the non-secret job ID/dashboard URL and duration, and clean up any disposable resource. Run:

```bash
npm run smoke:nosana
```

Expected: a real Nosana execution returns one valid label and durable evidence. If direct SDK submission is unavailable but a prewarmed Nosana endpoint is documented and verified, record that architecture and its authentication method. Do not guess a method name, invoke the Nosana CLI from the Next.js process, or proceed with a fake response.

**Acceptance criteria:**

- [ ] Installed types confirm every SDK method used by the plan.
- [ ] The account supports the required seed/baseline/three-repair concurrency.
- [ ] No credential appears in console output, files, preview URLs recorded to docs, or test fixtures.
- [ ] A signed preview is reachable from the Next.js host.
- [ ] One current, typed Nosana submission/status route or verified prewarmed endpoint is recorded with a real GPU job ID and measured latency.
- [ ] If any live criterion fails, the finding is explicit and core implementation does not fake a substitute.

**Approval-gated commit:** If git approval is later granted, use `[setup] add resurrection SDK and test harness`.

---

### Task 1: Frozen Domain Schemas, Provider Contract, and Safe GitHub URL Parsing

**Owner:** Agent 2 for contracts/parser; Agent 3 creates `provider.ts` from the frozen contract section and does not rename it.

**Files:**

- Create: `src/lib/contracts/run.ts`
- Create: `src/lib/contracts/repair.ts`
- Create: `src/lib/contracts/api.ts`
- Create: `src/lib/github/parse-url.ts`
- Create: `src/lib/github/parse-url.test.ts`
- Create: `src/lib/compute/provider.ts`

**Interfaces:**

- Consumes: Zod.
- Produces: `CreateRunRequestSchema`, `RunResponseSchema`, `ResurrectionRun`, `ProjectProfile`, `RepairPlanSchema`, `RepairAction`, `ComputeProvider`, and `parsePublicGitHubUrl(repoUrl: string): ParsedRepository`.

- [ ] **Step 1: Write failing URL boundary tests**

```ts
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
```

- [ ] **Step 2: Run the parser test and observe RED**

Run:

```bash
npm test -- src/lib/github/parse-url.test.ts
```

Expected: FAIL because `parse-url.ts` does not exist.

- [ ] **Step 3: Implement the exact parser boundary**

```ts
export interface ParsedRepository {
  owner: string;
  repo: string;
  canonicalUrl: string;
}

export class InvalidRepositoryUrlError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidRepositoryUrlError";
  }
}

export function parsePublicGitHubUrl(repoUrl: string): ParsedRepository {
  const url = new URL(repoUrl);
  const parts = url.pathname.split("/").filter(Boolean);
  const owner = parts[0];
  const repo = parts[1]?.replace(/\.git$/, "");

  if (url.protocol !== "https:" || url.hostname !== "github.com") {
    throw new InvalidRepositoryUrlError("Use a public HTTPS GitHub URL.");
  }
  if (url.username || url.password || url.search || url.hash || parts.length !== 2) {
    throw new InvalidRepositoryUrlError("Repository URL contains unsupported parts.");
  }
  if (!owner?.match(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/) ||
      !repo?.match(/^[A-Za-z0-9._-]+$/)) {
    throw new InvalidRepositoryUrlError("Repository owner or name is invalid.");
  }
  return { owner, repo, canonicalUrl: `https://github.com/${owner}/${repo}.git` };
}
```

If line limits require extraction, move the two regular expressions to module constants and extract `hasUnsupportedUrlParts(url, parts)`; preserve behavior exactly.

- [ ] **Step 4: Define schemas once and infer types**

`src/lib/contracts/run.ts` must export Zod schemas and inferred types for the frozen shared interfaces, plus:

```ts
export interface ProjectProfile {
  language: "javascript" | "typescript" | "python" | "unknown";
  framework: string;
  packageManager: "npm" | "pnpm" | "yarn" | "bun" | "pip" | "poetry" | "unknown";
  runtime?: string;
  installCommand?: string;
  buildCommand?: string;
  startCommand?: string;
  likelyPorts: number[];
  evidence: string[];
  isGui: boolean;
}

export interface ResurrectionManifest {
  repository: string;
  commit: string;
  detectedFramework: string;
  runtime?: string;
  packageManager: string;
  installCommand?: string;
  startCommand: string;
  port: number;
  repairs: Array<{ file?: string; summary: string }>;
}
```

`src/lib/contracts/api.ts` must define:

```ts
export const CreateRunRequestSchema = z.object({
  repoUrl: z.string().min(1).max(300),
}).strict();

export const CreateRunResponseSchema = z.object({
  id: z.string().regex(/^run_[0-9a-f-]{36}$/),
}).strict();
```

- [ ] **Step 5: Define the bounded repair plan**

`RepairPlanSchema` must enforce exactly three distinct strategy IDs and titles:

```ts
const RepairActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("run_command"), command: z.string().min(1), reason: z.string().min(1) }),
  z.object({ type: z.literal("write_file"), path: z.string().min(1), content: z.string(), reason: z.string().min(1) }),
  z.object({ type: z.literal("replace_text"), path: z.string().min(1), search: z.string().min(1), replacement: z.string(), reason: z.string().min(1) }),
  z.object({ type: z.literal("try_start"), command: z.string().min(1), expectedPorts: z.array(z.number().int().min(1).max(65535)).min(1), reason: z.string().min(1) }),
]);

const RepairStrategySchema = z.object({
  id: z.enum(["repair-a", "repair-b", "repair-c"]),
  title: z.string().min(1).max(80),
  hypothesis: z.string().min(1).max(400),
  invasiveness: z.enum(["environment", "config", "dependency", "source"]),
  actions: z.array(RepairActionSchema).min(1).max(8),
}).strict();

export const RepairPlanSchema = z.object({
  diagnosis: z.string().min(1),
  strategies: z.tuple([RepairStrategySchema, RepairStrategySchema, RepairStrategySchema]),
}).superRefine((plan, context) => {
  const ids = new Set(plan.strategies.map((strategy) => strategy.id));
  const titles = new Set(plan.strategies.map((strategy) => strategy.title));
  if (ids.size !== 3 || titles.size !== 3) {
    context.addIssue({ code: "custom", message: "Strategies must be meaningfully distinct." });
  }
});
```

- [ ] **Step 6: Publish `ComputeProvider` and supporting types**

Use the frozen interface exactly. Supporting types must be plain serializable interfaces with no Daytona imports so backend tests can use a fake provider:

```ts
export interface SandboxRef { id: string; name: string }
export interface CreateSeedInput { name: string; cpu: number; memoryGiB: number; diskGiB: number; ttlMinutes: number }
export interface SandboxFile { path: string; isDirectory: boolean; sizeBytes?: number }
export interface SnapshotRef { name: string }
export interface CloneInput { url: string; destination: string }
export interface CloneResult { commit: string }
export interface CommandInput { command: string; cwd: string; timeoutSeconds: number }
export interface CommandResult { exitCode: number; stdout: string; stderr: string; durationMs: number }
export interface StartProcessInput { command: string; cwd: string; sessionId: string }
export interface ProcessRef { sessionId: string; commandId: string }
export interface ProcessState { isAlive: boolean; exitCode?: number }
export interface ProcessLogs { stdout: string; stderr: string }
```

- [ ] **Step 7: Verify GREEN and type consistency**

Run:

```bash
npm test -- src/lib/github/parse-url.test.ts
npm run typecheck
```

Expected: parser tests pass and contract files compile without `any`.

**Acceptance criteria:**

- [ ] Unsafe URL variants are rejected before any Daytona call.
- [ ] Agent 1 can render `ResurrectionRun` without importing server-only code.
- [ ] Agent 3 can implement `ComputeProvider` without importing orchestration internals.
- [ ] Repair schema accepts exactly three strategies and rejects duplicate IDs/titles.
- [ ] No schema/type pair is duplicated manually when `z.infer` can be used.

**Approval-gated commit:** If git approval is later granted, use `[contracts] add resurrection domain boundaries`.

---

### Task 2: Atomic Run Store, Run Service, and Polling API

**Owner:** Agent 2.

**Files:**

- Create: `src/lib/store/run-store.ts`
- Create: `src/lib/store/file-run-store.ts`
- Create: `src/lib/store/file-run-store.test.ts`
- Create: `src/lib/jobs/start-run.ts`
- Create: `src/lib/jobs/start-run.test.ts`
- Create: `src/app/api/runs/route.ts`
- Create: `src/app/api/runs/[id]/route.ts`

**Interfaces:**

- Consumes: `CreateRunRequestSchema`, `ResurrectionRun`, `parsePublicGitHubUrl`.
- Produces: `RunStore`, `FileRunStore`, `createRun(repoUrl, dependencies): Promise<{ id: string }>`, `getRun(id): Promise<ResurrectionRun | undefined>`, `POST /api/runs`, and `GET /api/runs/:id`.

```ts
export interface RunStore {
  create(run: ResurrectionRun): Promise<void>;
  get(id: string): Promise<ResurrectionRun | undefined>;
  update(id: string, updater: (run: ResurrectionRun) => ResurrectionRun): Promise<ResurrectionRun>;
}
```

- [ ] **Step 1: Write failing atomic-store tests**

```ts
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createQueuedRun } from "@/lib/contracts/run";
import { FileRunStore } from "./file-run-store";

describe("FileRunStore", () => {
  it("serializes concurrent updates for one run", async () => {
    const directory = await mkdtemp(join(tmpdir(), "resurrection-store-test-"));
    const store = new FileRunStore(directory);
    const run = createQueuedRun("run_00000000-0000-4000-8000-000000000000", "https://github.com/acme/app.git", "acme", "app");
    await store.create(run);

    await Promise.all([
      store.update(run.id, (current) => ({ ...current, events: [...current.events, event("one")] })),
      store.update(run.id, (current) => ({ ...current, events: [...current.events, event("two")] })),
    ]);

    expect((await store.get(run.id))?.events.map((item) => item.summary).sort()).toEqual(["one", "two"]);
  });
});
```

Define the local test helper `event(summary: string): RunEvent` in the test file with fixed valid fields.

- [ ] **Step 2: Run the store test and observe RED**

Run:

```bash
npm test -- src/lib/store/file-run-store.test.ts
```

Expected: FAIL because `FileRunStore` does not exist.

- [ ] **Step 3: Implement per-run atomic JSON persistence**

`FileRunStore` must:

- validate run IDs with `/^run_[0-9a-f-]{36}$/` before building a path;
- create the directory with `mkdir({ recursive: true })`;
- serialize updates per run with a private `Map<string, Promise<void>>` owned by the store instance;
- write `${id}.${crypto.randomUUID()}.tmp`, then atomically rename it to `${id}.json`;
- parse disk data with `ResurrectionRunSchema`, never a type assertion;
- rethrow filesystem/validation errors with a typed `RunStoreError` containing the run ID.

No untrusted repository process can access this directory because it exists only on the Next.js host.

- [ ] **Step 4: Write failing run-service tests**

```ts
it("writes a queued run before starting background work", async () => {
  const calls: string[] = [];
  const dependencies = createRunServiceFixture(calls);

  const result = await createRun("https://github.com/acme/app", dependencies);

  expect(result.id).toMatch(/^run_/);
  expect(calls).toEqual(["store.create", "jobs.start"]);
});

it("rejects invalid URLs before writing a run", async () => {
  const calls: string[] = [];
  const dependencies = createRunServiceFixture(calls);

  await expect(createRun("https://evil.example/app", dependencies)).rejects.toThrow("public HTTPS GitHub URL");
  expect(calls).toEqual([]);
});
```

- [ ] **Step 5: Implement the background job seam**

```ts
export interface RunJob {
  start(runId: string): void;
}

export interface CreateRunDependencies {
  store: RunStore;
  jobs: RunJob;
  now: () => Date;
  randomUuid: () => string;
}
```

`start()` must explicitly handle and log rejection:

```ts
public start(runId: string): void {
  void this.orchestrator.run(runId).catch(async (error: unknown) => {
    console.error("resurrection job failed", { runId, error: errorMessage(error) });
    await this.markFailed(runId, error);
  });
}
```

This is the only fire-and-forget boundary; it logs, persists failure, and never exposes a secret.

- [ ] **Step 6: Add thin Node-runtime route handlers**

`POST /api/runs`:

- parse JSON in a typed catch block;
- validate with `CreateRunRequestSchema.safeParse`;
- return `400 { error }` for malformed input;
- return `202 { id }` after `createRun` writes the queued record;
- return `503 { error: "Resurrection service is not configured." }` if required credentials are absent.

`GET /api/runs/[id]`:

- use `params: Promise<{ id: string }>` and await it;
- return `404 { error: "Run not found." }` when absent;
- return the complete `ResurrectionRun` with `Cache-Control: no-store` when present.

Do not export `runtime = "edge"`; Daytona and filesystem dependencies require the default Node.js runtime.

- [ ] **Step 7: Verify scoped behavior**

Run:

```bash
npm test -- src/lib/store/file-run-store.test.ts src/lib/jobs/start-run.test.ts
npm run typecheck
npm run lint -- src/lib/store src/lib/jobs src/app/api/runs
```

Expected: all scoped tests pass; invalid URLs create no file and start no job.

**Acceptance criteria:**

- [ ] `POST` responds before the long job finishes.
- [ ] `GET` observes complete atomic JSON records during concurrent event writes.
- [ ] Route handlers contain validation/translation only, not orchestration logic.
- [ ] Invalid IDs cannot escape the run-store directory.
- [ ] Background failures become `failed` runs with a human-readable reason.

**Approval-gated commit:** If git approval is later granted, use `[api] add pollable resurrection runs`.

---

### Task 3: Daytona Compute Provider and Objective Verification

**Owner:** Agent 3.

**Files:**

- Create: `src/lib/daytona/client.ts`
- Create: `src/lib/daytona/daytona-provider.ts`
- Create: `src/lib/daytona/daytona-provider.test.ts`
- Create: `src/lib/daytona/path-policy.ts`
- Create: `src/lib/daytona/path-policy.test.ts`
- Create: `src/lib/resurrection/verify.ts`
- Create: `src/lib/resurrection/verify.test.ts`

**Interfaces:**

- Consumes: frozen `ComputeProvider` and serializable supporting types from `src/lib/compute/provider.ts`.
- Produces: `createDaytonaProvider(): DaytonaProvider`, `resolveRepositoryPath(repoRoot: string, relativePath: string): string`, and `verifyWebProcess(input: VerificationInput): Promise<VerificationResult>`.

```ts
export interface VerificationInput {
  provider: ComputeProvider;
  sandbox: SandboxRef;
  process: ProcessRef;
  likelyPorts: number[];
  timeoutAt: number;
  now: () => number;
}

export interface VerificationResult {
  isVerified: boolean;
  processAlive: boolean;
  port?: number;
  previewUrl?: string;
  httpStatus?: number;
  failureReason?: string;
}
```

- [ ] **Step 1: Write failing path-confinement tests**

```ts
import { describe, expect, it } from "vitest";

import { UnsafeSandboxPathError, resolveRepositoryPath } from "./path-policy";

describe("resolveRepositoryPath", () => {
  it("resolves a repository-relative path", () => {
    expect(resolveRepositoryPath("workspace/repo", "src/app.ts")).toBe("workspace/repo/src/app.ts");
  });

  it.each(["../secret", "/etc/passwd", "src/../../secret", "src/\u0000bad"])(
    "rejects path escape %s",
    (path: string) => {
      expect(() => resolveRepositoryPath("workspace/repo", path)).toThrow(UnsafeSandboxPathError);
    },
  );
});
```

- [ ] **Step 2: Run path tests and observe RED**

Run:

```bash
npm test -- src/lib/daytona/path-policy.test.ts
```

Expected: FAIL because `path-policy.ts` does not exist.

- [ ] **Step 3: Implement the provider with a narrow SDK translation layer**

Use one `Daytona` client per background job, constructed only on the server. The adapter mapping is:

```ts
daytona.create({
  name: input.name,
  language: "typescript",
  resources: { cpu: 2, memory: 4, disk: 20 },
  ttlMinutes: 15,
  labels: { product: "project-resurrection", runId: input.runId, role: "seed" },
});

sandbox.git.clone(input.url, input.destination, undefined, undefined, undefined, undefined, false, 1);
sandbox.createSnapshot(name, 60);
sandbox.fork({ name }, 60);
sandbox.fs.listFiles(path, { depth });
sandbox.fs.downloadFile(path);
sandbox.fs.uploadFile(Buffer.from(content, "utf8"), path);
sandbox.process.executeCommand(command, cwd, {}, timeoutSeconds);
sandbox.process.createSession(sessionId);
sandbox.process.executeSessionCommand(sessionId, { command, runAsync: true }, 30);
sandbox.process.getSessionCommand(sessionId, commandId);
sandbox.process.getSessionCommandLogs(sessionId, commandId);
sandbox.getSignedPreviewUrl(port, 3600);
sandbox.stop(60, false);
sandbox.delete(60, true);
daytona.snapshot.delete(snapshot.name);
```

The clone URL is already canonical and must be passed as a method argument, never shell-concatenated. `writeTextFile` must call `resolveRepositoryPath` before uploading. `runCommand` and `startProcess` use only the fixed repository working directory supplied by the orchestrator.

If installed SDK types reject any documented call, update only this adapter to the installed signature, mark the assumption in `docs/demo-readiness.md`, and do not leak Daytona types into `ComputeProvider`.

- [ ] **Step 4: Write provider translation tests against a typed SDK facade**

Do not mock the entire third-party SDK. Inject a small internal `DaytonaSdkFacade` implemented by the real SDK wrapper and use a hand-written fake to assert:

```ts
it("creates a secret-free resource-limited seed", async () => {
  const sdk = new RecordingDaytonaFacade();
  const provider = new DaytonaProvider(sdk);

  await provider.createSeed({ runId: "run_1", name: "resurrection-run-1-seed" });

  expect(sdk.createInput).toMatchObject({
    resources: { cpu: 2, memory: 4, disk: 20 },
    ttlMinutes: 15,
  });
  expect(sdk.createInput).not.toHaveProperty("envVars");
  expect(sdk.createInput).not.toHaveProperty("secrets");
});
```

Also assert that `clonePublicRepository` calls the Git facade and never `executeCommand`, and that `delete` waits for destruction.

- [ ] **Step 5: Write failing verification tests**

```ts
it("accepts only a live process and HTTP 200-399", async () => {
  const provider = createVerificationProvider({ processAlive: true, statuses: { 3000: 503, 5173: 302 } });

  const result = await verifyWebProcess(createVerificationInput(provider, [3000, 5173]));

  expect(result).toMatchObject({
    isVerified: true,
    processAlive: true,
    port: 5173,
    httpStatus: 302,
  });
});

it("rejects an HTTP response when the process already exited", async () => {
  const provider = createVerificationProvider({ processAlive: false, statuses: { 3000: 200 } });

  await expect(verifyWebProcess(createVerificationInput(provider, [3000]))).resolves.toMatchObject({
    isVerified: false,
    processAlive: false,
  });
});
```

- [ ] **Step 6: Implement bounded port verification**

Rules:

- inspect process logs first for `localhost:<port>`, `127.0.0.1:<port>`, or `0.0.0.0:<port>` and place detected ports before the profile list;
- de-duplicate and cap candidates to 10 integers;
- for each candidate, obtain a signed URL and use host `fetch` with `redirect: "manual"` and an `AbortSignal.timeout` bounded by the remaining run time and 5 seconds;
- accept 200-399 only when `getProcess(...).isAlive` is true before and after the HTTP response;
- preserve the last concrete failure reason without logging a full signed URL;
- do not accept a build-only success as a live preview.

- [ ] **Step 7: Verify provider and verifier**

Run:

```bash
npm test -- src/lib/daytona/path-policy.test.ts src/lib/daytona/daytona-provider.test.ts src/lib/resurrection/verify.test.ts
npm run typecheck
npm run lint -- src/lib/daytona src/lib/resurrection/verify.ts
```

Expected: scoped tests pass; no SDK class crosses the provider boundary.

**Acceptance criteria:**

- [ ] Every lifecycle, file, process, and preview operation maps to a confirmed SDK call.
- [ ] Sandbox creation contains resource limits and TTL and contains no host secret map.
- [ ] File writes cannot leave the cloned repository directory.
- [ ] Verification rejects dead processes, 4xx/5xx responses, and exhausted time budgets.
- [ ] Errors include operation and sandbox ID but never API keys or full signed preview URLs.

**Approval-gated commit:** If git approval is later granted, use `[daytona] add isolated compute provider`.

---

### Task 4: Deterministic Inspection, Detection, and Baseline Resurrection Vertical Slice

**Owner:** Agent 2. Agent 3 supplies the provider and verifier without editing this task's files.

**Files:**

- Create: `src/lib/resurrection/limits.ts`
- Create: `src/lib/resurrection/errors.ts`
- Create: `src/lib/resurrection/inspect.ts`
- Create: `src/lib/resurrection/inspect.test.ts`
- Create: `src/lib/resurrection/detect.ts`
- Create: `src/lib/resurrection/detect.test.ts`
- Create: `src/lib/resurrection/run-reporter.ts`
- Create: `src/lib/resurrection/baseline.ts`
- Create: `src/lib/resurrection/baseline.test.ts`
- Create: `src/lib/resurrection/orchestrator.ts`
- Create: `src/lib/resurrection/orchestrator.test.ts`

**Interfaces:**

- Consumes: `ComputeProvider`, `RunStore`, `verifyWebProcess`, parsed repository data.
- Produces: `collectRepoEvidence(provider, sandbox, repoRoot): Promise<RepoEvidence>`, `detectProject(evidence): ProjectProfile`, `runBaseline(input): Promise<BaselineResult>`, and `ResurrectionOrchestrator.run(runId): Promise<void>`.

```ts
export interface RepoEvidence {
  rootFiles: string[];
  textFiles: Record<string, string>;
  commit: string;
}

export type BaselineResult =
  | { status: "success"; sandbox: SandboxRef; process: ProcessRef; verification: VerificationResult }
  | { status: "failed"; sandbox: SandboxRef; failure: BaselineFailure };

export interface BaselineFailure {
  stage: "install" | "start" | "verify";
  command: string;
  exitCode?: number;
  stdout: string;
  stderr: string;
  summary: string;
}
```

- [ ] **Step 1: Write failing deterministic detection tests**

```ts
it("detects a locked Next.js npm project without AI", () => {
  const evidence = repoEvidence({
    "package.json": JSON.stringify({
      engines: { node: "16.x" },
      scripts: { dev: "next dev", build: "next build" },
      dependencies: { next: "12.3.4", react: "17.0.2" },
    }),
    "package-lock.json": "{}",
  });

  expect(detectProject(evidence)).toMatchObject({
    language: "javascript",
    framework: "Next.js",
    packageManager: "npm",
    runtime: "Node 16.x",
    installCommand: "npm ci",
    startCommand: "npm run dev",
    likelyPorts: [3000],
    isGui: true,
  });
});

it("detects a FastAPI requirements project", () => {
  const evidence = repoEvidence({ "requirements.txt": "fastapi==0.95.0\nuvicorn==0.21.0\n" });
  expect(detectProject(evidence)).toMatchObject({
    language: "python",
    framework: "FastAPI",
    packageManager: "pip",
    installCommand: "pip3 install -r requirements.txt",
    likelyPorts: [8000],
    isGui: false,
  });
});
```

Python start commands are set only when a bounded deterministic entrypoint is present in `Procfile`, `README` command snippets, or a conventional root module (`app.py` for Flask/Streamlit/Gradio); otherwise leave `startCommand` absent and fail as unsupported rather than guessing a module import.

- [ ] **Step 2: Run detection tests and observe RED**

Run:

```bash
npm test -- src/lib/resurrection/detect.test.ts
```

Expected: FAIL because deterministic detection does not exist.

- [ ] **Step 3: Implement bounded evidence collection**

Use a fixed allowlist:

```ts
export const HIGH_VALUE_FILES = [
  "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb",
  "requirements.txt", "pyproject.toml", "Pipfile", "poetry.lock",
  "Dockerfile", "docker-compose.yml", "compose.yml", "README.md", "README",
  ".nvmrc", ".node-version", ".python-version", ".tool-versions",
  "vercel.json", "Procfile", ".env.example", ".env.sample",
] as const;
```

Read at most 32 KiB per file and 128 KiB total. List only depth two. Never read `.env`, private keys, credential files, binary files, `node_modules`, `.git`, build output, or an entire source tree. Store evidence strings such as `package.json scripts.dev=next dev`; do not send raw lockfiles to OpenAI.

- [ ] **Step 4: Implement deterministic detection**

Rules:

- lockfile selects package manager; if no lock exists, prefer the declared `packageManager`, then npm for Node;
- install command is `npm ci`, `pnpm install --frozen-lockfile`, `yarn install --frozen-lockfile`, `bun install --frozen-lockfile`, `pip3 install -r requirements.txt`, or `poetry install` only when its matching evidence exists;
- start command respects actual scripts in priority `dev`, `start`; never invent a missing npm script;
- framework evidence comes from dependencies and known config names;
- Node/Vite/React/Vue are GUI, Express is API, Streamlit/Gradio are GUI, Flask/FastAPI/Django are API unless static/template evidence proves a GUI;
- default likely ports use the spec list ordered by framework;
- unsupported detection returns `language: "unknown"`, no start command, and evidence describing why.

- [ ] **Step 5: Write failing baseline tests using `FakeComputeProvider`**

```ts
it("clones and snapshots before installing on a baseline fork", async () => {
  const calls: string[] = [];
  const provider = createFakeProvider(calls, { verification: verifiedPreview(3000) });

  const result = await runDeterministicResurrection(createBaselineInput(provider));

  expect(result.status).toBe("success");
  expect(calls).toEqual([
    "createSeed",
    "clonePublicRepository",
    "createSnapshot",
    "collectRepoEvidence",
    "fork:baseline",
    "runCommand:npm ci",
    "startProcess:npm run dev",
    "verifyWebProcess",
  ]);
});

it("never installs on the pristine seed", async () => {
  const provider = createFakeProvider([], { verification: verifiedPreview(3000) });
  await runDeterministicResurrection(createBaselineInput(provider));
  expect(provider.commandSandboxes).not.toContain(provider.seed.id);
});
```

- [ ] **Step 6: Implement the earliest working end-to-end orchestrator**

The first production path must do only:

1. load the queued run;
2. compute `deadline = startedAt + 8 minutes`;
3. create seed, clone via Git API, resolve commit with `git rev-parse HEAD` inside the sandbox, and create snapshot `resurrection-<run-id>-s0`;
4. inspect and detect deterministically;
5. if no install or start command exists, fail with the unsupported message from the spec;
6. fork the untouched seed once as `baseline`;
7. run install with 120-second timeout;
8. start the detected command asynchronously;
9. independently verify process and HTTP;
10. on success, stop the seed, persist preview/manifest, and mark success;
11. on baseline failure, persist `diagnosing` plus `BaselineFailure` and return control to the repair stage added in Task 7.

All state transitions go through `RunReporter`, which appends human-readable events and serializes writes through `RunStore.update`.

- [ ] **Step 7: Run scoped baseline verification**

Run:

```bash
npm test -- src/lib/resurrection/inspect.test.ts src/lib/resurrection/detect.test.ts src/lib/resurrection/baseline.test.ts src/lib/resurrection/orchestrator.test.ts
npm run typecheck
npm run lint -- src/lib/resurrection
```

Expected: tests prove snapshot chronology and zero commands on the seed.

- [ ] **Step 8: Run the first real vertical slice**

With credentials and the known-compatible public fixture URL configured, run:

```bash
npm run dev
```

Then create a run through the UI or `POST /api/runs` and poll its ID. Expected: a real signed Daytona preview reaches HTTP 200-399 with no OpenAI call.

**Acceptance criteria:**

- [ ] The compatible-repo path reaches a verified preview before repair code exists.
- [ ] Clone and snapshot occur before any install/start command.
- [ ] Baseline runs on a child, not the pristine seed.
- [ ] Unsupported repos fail explicitly without an OpenAI guess.
- [ ] Every event is human-readable; raw stdout/stderr is optional technical detail.
- [ ] Total evidence sent onward is bounded and excludes actual `.env` files.

**Approval-gated commit:** If git approval is later granted, use `[resurrection] add deterministic baseline flow`.

---

### Task 5: Landing, Polling Run Page, and Fixture-Driven Progress UI

**Owner:** Agent 1. This task starts immediately after Task 1 contracts compile and runs in parallel with Tasks 2-4.

**Files:**

- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/app/run/[id]/page.tsx`
- Create: `src/app/run/[id]/loading.tsx`
- Create: `src/app/run/[id]/error.tsx`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/repo-input.tsx`
- Create: `src/components/repo-input.test.tsx`
- Create: `src/components/resurrection-dashboard.tsx`
- Create: `src/components/resurrection-timeline.tsx`
- Create: `src/components/repair-race.tsx`
- Create: `src/components/project-preview.tsx`
- Create: `src/components/resurrection-summary.tsx`
- Create: `src/lib/client/run-api.ts`
- Create: `src/hooks/use-run-polling.ts`
- Create: `src/hooks/use-run-polling.test.tsx`

**Interfaces:**

- Consumes: `CreateRunResponseSchema`, `ResurrectionRunSchema`, and shared run/attempt/event types only.
- Produces: `RepoInput`, `ResurrectionDashboard`, and `useRunPolling(runId: string): RunPollingState`.

```ts
export type RunPollingState =
  | { status: "loading"; run?: never; error?: never }
  | { status: "ready"; run: ResurrectionRun; error?: never }
  | { status: "error"; run?: never; error: string };
```

- [ ] **Step 1: Write failing input behavior tests**

```tsx
// @vitest-environment jsdom
it("creates a run and navigates to its run page", async () => {
  const createRun = vi.fn().mockResolvedValue({ id: "run_00000000-0000-4000-8000-000000000000" });
  const navigate = vi.fn();
  render(<RepoInput createRun={createRun} navigate={navigate} />);

  await userEvent.type(screen.getByLabelText("Public GitHub repository"), "https://github.com/acme/old-app");
  await userEvent.click(screen.getByRole("button", { name: "Resurrect project" }));

  expect(createRun).toHaveBeenCalledWith("https://github.com/acme/old-app");
  expect(navigate).toHaveBeenCalledWith("/run/run_00000000-0000-4000-8000-000000000000");
});
```

Add a second test asserting a `400` API error appears inline and focus moves to the error message.

- [ ] **Step 2: Run UI tests and observe RED**

Run:

```bash
npm test -- src/components/repo-input.test.tsx
```

Expected: FAIL because `RepoInput` does not exist.

- [ ] **Step 3: Implement the landing state and local primitives**

Use native form semantics, shadcn-compatible local `Button`, `Input`, `Card`, and `Badge` components, Lucide icons, and Tailwind classes. Do not add a component framework or animation dependency.

Required copy:

- headline: `Bring software back to life.`
- support: `Paste a dormant GitHub project. We safely reconstruct its environment, repair what is necessary, and turn it back into something you can experience.`
- CTA: `Resurrect project`
- secondary statement: `We preserve software as software — not screenshots and dead links.`

The input component owns interaction state and calls the injected `createRun`; `page.tsx` remains a Server Component that renders it.

- [ ] **Step 4: Write and implement polling behavior**

Test with fake timers that polling occurs every 1500 ms, stops at `success`/`failed`, aborts in-flight fetch on unmount, and surfaces malformed API responses.

Implementation constraints:

- use one `useEffect` because polling synchronizes with an external HTTP system;
- create an `AbortController` inside the effect and abort it in cleanup;
- `fetchRun` validates JSON using `ResurrectionRunSchema.parse`;
- do not duplicate server state into separate derived React state;
- do not use WebSockets.

- [ ] **Step 5: Implement progress and success states against fixture JSON**

`ResurrectionDashboard` renders from a supplied `ResurrectionRun` and must show:

- `RESURRECTING` for non-terminal states;
- the event timeline with expandable technical details via native `<details>`;
- three repair cards when `attempts.length === 3`, with queued/running/success/failed state;
- `PROJECT RESURRECTED` plus framework/runtime/package manager/attempt count/changed-file count;
- an iframe only after success and only when `previewUrl` exists, plus an always-available `Open live project` new-tab link;
- the failure reason for failed runs without implying success.

Keep the visual direction `digital archive × museum exhibit × developer terminal`; use off-white/ink, monospaced accession labels, and restrained green only for verified success.

- [ ] **Step 6: Update metadata and responsive styling**

Set metadata title `Project Resurrection` and description `Bring dormant web projects back to life in an isolated Daytona sandbox.` Use the existing Geist fonts. At 390 px width, cards stack, text remains readable, and there is no horizontal overflow.

- [ ] **Step 7: Verify the UI lane**

Run:

```bash
npm test -- src/components/repo-input.test.tsx src/hooks/use-run-polling.test.tsx
npm run typecheck
npm run lint -- src/app src/components src/hooks src/lib/client
```

Expected: tests pass and the UI compiles without importing server-only modules.

**Acceptance criteria:**

- [ ] Valid submission navigates to the run page; invalid submission remains on the page with an accessible error.
- [ ] Polling is 1.5 seconds, abortable, schema-validated, and terminal-aware.
- [ ] The default view contains human-readable events, not raw terminal spam.
- [ ] Success works with either iframe embedding or link-only fallback.
- [ ] Agent 1 changed no backend, Daytona, package, or test-config files.

**Approval-gated commit:** If git approval is later granted, use `[ui] add resurrection input and progress states`.

---

### Task 6: Structured OpenAI Repair Planner and Safe Action Executor

**Owner:** Agent 2.

**Files:**

- Create: `src/lib/openai/client.ts`
- Create: `src/lib/openai/prompts.ts`
- Create: `src/lib/openai/repair-planner.ts`
- Create: `src/lib/openai/repair-planner.test.ts`
- Create: `src/lib/resurrection/execute-actions.ts`
- Create: `src/lib/resurrection/execute-actions.test.ts`

**Interfaces:**

- Consumes: compact `RepoEvidence`, `ProjectProfile`, `BaselineFailure`, `RepairPlanSchema`, `ComputeProvider`.
- Produces: `RepairPlanner.plan(input): Promise<ParallelRepairPlan>` and `executeRepairStrategy(input): Promise<RepairExecutionResult>`.

```ts
export interface RepairPlanner {
  plan(input: RepairPlannerInput): Promise<ParallelRepairPlan>;
}

export interface RepairPlannerInput {
  evidence: RepoEvidence;
  profile: ProjectProfile;
  failure: BaselineFailure;
  verifiedCapabilities: string[];
}

export interface RepairExecutionResult {
  process?: ProcessRef;
  changedFiles: string[];
  actionSummaries: string[];
  failureReason?: string;
}
```

- [ ] **Step 1: Write failing planner contract tests**

```ts
it("uses one medium-effort structured Responses call", async () => {
  const responses = new RecordingResponsesClient(validThreeStrategyResponse());
  const planner = new OpenAIRepairPlanner(responses, { model: "gpt-5.6-sol" });

  const plan = await planner.plan(repairPlannerInput());

  expect(plan.strategies).toHaveLength(3);
  expect(responses.lastRequest).toMatchObject({
    model: "gpt-5.6-sol",
    reasoning: { effort: "medium" },
  });
});

it("rejects duplicate strategies returned by the model", async () => {
  const planner = createPlannerWithOutput(duplicateStrategyResponse());
  await expect(planner.plan(repairPlannerInput())).rejects.toThrow("meaningfully distinct");
});
```

- [ ] **Step 2: Run planner tests and observe RED**

Run:

```bash
npm test -- src/lib/openai/repair-planner.test.ts
```

Expected: FAIL because the planner is missing.

- [ ] **Step 3: Implement a single structured planning call**

Use:

```ts
const response = await openai.responses.parse({
  model: config.model,
  reasoning: { effort: chooseReasoningEffort(input) },
  input: [
    { role: "system", content: REPAIR_SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify(toPromptEvidence(input)) },
  ],
  text: {
    format: zodTextFormat(RepairPlanSchema, "parallel_repair_plan"),
  },
});
```

`chooseReasoningEffort` returns `"high"` only when deterministic evidence contains multiple runtime constraints or the baseline failure classifier returns `dependency_conflict`; otherwise it returns `"medium"`. There is no second planning round after fork failures.

The system prompt must state restoration-before-modification, no success claims, exactly three meaningfully different strategies, verified capabilities only, minimal changes, and no secrets/host access. Prompt input includes bounded evidence and truncated failure output, not full repository contents.

- [ ] **Step 4: Write failing action-executor tests**

```ts
it("applies an exact single replacement inside the repo", async () => {
  const provider = createActionProvider({ "workspace/repo/package.json": "old-value" });
  const result = await executeRepairStrategy({
    ...actionInput(provider),
    strategy: strategyWith({
      type: "replace_text",
      path: "package.json",
      search: "old-value",
      replacement: "new-value",
      reason: "restore compatibility",
    }),
  });

  expect(provider.writes).toEqual([{ path: "workspace/repo/package.json", content: "new-value" }]);
  expect(result.changedFiles).toEqual(["package.json"]);
});

it("rejects zero-match and multi-match replacements", async () => {
  const provider = createActionProvider({ "workspace/repo/app.ts": "x x" });
  await expect(executeRepairStrategy(actionInputWithReplacement(provider, "x"))).rejects.toThrow("exactly once");
});
```

- [ ] **Step 5: Implement deterministic action execution**

Rules:

- execute actions in listed order with at most six actions per strategy;
- cap every `run_command` at 120 seconds and the strategy at the global deadline;
- resolve `write_file` and `replace_text` through the repository path policy;
- reject file contents above 64 KiB and action commands above 2,000 characters;
- `replace_text` requires exactly one match;
- record changed paths in a set and return a sorted array;
- `try_start` may appear once and must be the last action;
- if no `try_start` appears, reuse the detected start command after actions;
- catch errors as `unknown`, narrow them, persist a clear failure, and rethrow typed executor errors where the orchestrator must clean up.

The executor does not call OpenAI again and never recursively requests more actions.

- [ ] **Step 6: Verify planner and executor**

Run:

```bash
npm test -- src/lib/openai/repair-planner.test.ts src/lib/resurrection/execute-actions.test.ts
npm run typecheck
npm run lint -- src/lib/openai src/lib/resurrection/execute-actions.ts
```

Expected: invalid structured output and unsafe file operations fail closed.

**Acceptance criteria:**

- [ ] Exactly one OpenAI request yields exactly three distinct strategies.
- [ ] No free-running model/tool loop exists.
- [ ] Model output is Zod-validated before any sandbox action.
- [ ] File edits are bounded, confined, exact-match operations with recorded changed paths.
- [ ] Source modification is available but ranked as most invasive.

**Approval-gated commit:** If git approval is later granted, use `[repair] add structured repair planning`.

---

### Task 7: Three-Way Parallel Repair, Winner Selection, and Cleanup

**Owner:** Agent 2 for implementation; Agent 3 writes/executes independent integration checks after the scoped unit tests pass.

**Files:**

- Create: `src/lib/resurrection/fork-repair.ts`
- Create: `src/lib/resurrection/fork-repair.test.ts`
- Create: `src/lib/resurrection/select-winner.ts`
- Create: `src/lib/resurrection/select-winner.test.ts`
- Modify: `src/lib/resurrection/orchestrator.ts`
- Modify: `src/lib/resurrection/orchestrator.test.ts`

**Interfaces:**

- Consumes: pristine seed `SandboxRef`, `ParallelRepairPlan`, action executor, verifier, reporter, and deadline.
- Produces: `runParallelRepairs(input): Promise<RepairRaceResult>` and `selectWinner(successes: SuccessfulRepair[]): SuccessfulRepair`.

```ts
export interface SuccessfulRepair {
  strategy: RepairStrategy;
  sandbox: SandboxRef;
  process: ProcessRef;
  verification: VerificationResult & { isVerified: true; port: number; previewUrl: string };
  changedFiles: string[];
  bootDurationMs: number;
}

export type RepairRaceResult =
  | { status: "success"; winner: SuccessfulRepair; attempts: ResurrectionAttempt[] }
  | { status: "failed"; attempts: ResurrectionAttempt[]; failureReason: string };
```

- [ ] **Step 1: Write failing concurrency and origin tests**

```ts
it("forks exactly three repairs concurrently from the pristine seed", async () => {
  const gate = createConcurrencyGate(3);
  const provider = createParallelProvider(gate);

  const racePromise = runParallelRepairs(createRepairRaceInput(provider));
  await gate.waitUntilAllStarted();

  expect(provider.forkParents).toEqual(["seed", "seed", "seed"]);
  expect(provider.maxConcurrentForks).toBe(3);
  gate.release();
  await racePromise;
});

it("deletes baseline and losing repairs but preserves the winner", async () => {
  const provider = createRaceProviderWithWinner("strategy-b");
  const result = await runParallelRepairs(createRepairRaceInput(provider));

  expect(result.status).toBe("success");
  expect(provider.deletedIds.sort()).toEqual(["fork-a", "fork-c"]);
  expect(provider.deletedIds).not.toContain("fork-b");
});
```

- [ ] **Step 2: Run repair race tests and observe RED**

Run:

```bash
npm test -- src/lib/resurrection/fork-repair.test.ts
```

Expected: FAIL because the repair race is missing.

- [ ] **Step 3: Write failing winner-ranking tests**

```ts
it("prefers environment repair over faster source repair", () => {
  const winner = selectWinner([
    success({ id: "source", invasiveness: "source", changedFiles: ["a.ts"], bootDurationMs: 100 }),
    success({ id: "environment", invasiveness: "environment", changedFiles: [], bootDurationMs: 500 }),
  ]);
  expect(winner.strategy.id).toBe("environment");
});

it("uses changed-file count then boot duration as tie breakers", () => {
  const winner = selectWinner([
    success({ id: "many", invasiveness: "config", changedFiles: ["a", "b"], bootDurationMs: 100 }),
    success({ id: "few-slow", invasiveness: "config", changedFiles: ["a"], bootDurationMs: 500 }),
    success({ id: "few-fast", invasiveness: "config", changedFiles: ["a"], bootDurationMs: 200 }),
  ]);
  expect(winner.strategy.id).toBe("few-fast");
});
```

- [ ] **Step 4: Implement deterministic ranking**

```ts
export const INVASIVENESS_RANK: Readonly<Record<Invasiveness, number>> = {
  environment: 0,
  config: 1,
  dependency: 2,
  source: 3,
};
```

Sort a copied array by invasiveness rank, changed-file count, boot duration, then strategy ID for a stable final tie-break. Only independently verified successes enter this function.

- [ ] **Step 5: Implement the repair race**

Required sequence:

1. persist the three attempts as `queued` before allocating forks;
2. call all three `provider.fork(seed, name)` promises in one `Promise.allSettled`;
3. for each fulfilled fork, mark the attempt `running`, execute its strategy, start the process, and call independent verification;
4. capture each result without letting one rejection cancel sibling work;
5. wait for all attempts to settle or the global deadline;
6. select the best verified success using `selectWinner`;
7. delete every losing/failed fork immediately with `Promise.allSettled` and emit cleanup outcomes;
8. on success, stop the seed, delete the baseline, retain only the winner and its signed preview, and delete the clean snapshot unless preservation polish is explicitly enabled;
9. on total failure, delete all child sandboxes, delete the snapshot, delete the seed, and persist the spec's three-attempt failure message.

Never fork a repair child. All `forkParents` must equal the seed ID.

- [ ] **Step 6: Integrate repair after baseline failure**

Update the orchestrator:

```ts
const baseline = await runBaseline(context);
if (baseline.status === "success") {
  await completeSuccessfulRun(context, baseline);
  return;
}

await reporter.transition("diagnosing", "Baseline startup failed; preparing repair hypotheses.");
const plan = await repairPlanner.plan(toRepairPlannerInput(context, baseline.failure));
const race = await runParallelRepairs(toRepairRaceInput(context, plan));
await completeRepairRace(context, race);
```

Keep each helper below 40 lines; `run()` remains a state-machine coordinator, not an implementation dump.

- [ ] **Step 7: Add total-timeout and cleanup tests**

Use an injected clock/abort signal to prove:

- no new action starts after the 8-minute deadline;
- a timed-out attempt becomes failed;
- cleanup runs even when verification throws;
- cleanup failures are logged and emitted but do not convert a verified winner into a false failure;
- all-failed runs never contain a preview URL.

- [ ] **Step 8: Verify scoped parallel repair**

Run:

```bash
npm test -- src/lib/resurrection/fork-repair.test.ts src/lib/resurrection/select-winner.test.ts src/lib/resurrection/orchestrator.test.ts
npm run typecheck
npm run lint -- src/lib/resurrection
```

Expected: tests prove concurrency of three, identical pristine parent IDs, independent verification, deterministic ranking, and losing-fork cleanup.

**Acceptance criteria:**

- [ ] Parallel forked repair is present in the core path and cannot be feature-flagged away for the target dormant demo.
- [ ] Exactly three meaningfully distinct strategies race concurrently from the untouched seed.
- [ ] A model claim cannot qualify a winner; verification data is mandatory.
- [ ] All losing/failed forks and the baseline are deleted immediately.
- [ ] The winner summary includes strategy, environment, changed files, attempt count, port, and verification status.
- [ ] No recursive fork or second strategy-generation round exists.

**Approval-gated commit:** If git approval is later granted, use `[repair] race three isolated repair forks`.

---

### Task 8: Live Repair-Race UI, Success Summary, and Failure States

**Owner:** Agent 1.

**Files:**

- Modify: `src/components/resurrection-dashboard.tsx`
- Modify: `src/components/resurrection-timeline.tsx`
- Modify: `src/components/repair-race.tsx`
- Modify: `src/components/project-preview.tsx`
- Modify: `src/components/resurrection-summary.tsx`
- Create: `src/components/resurrection-dashboard.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**

- Consumes: live `ResurrectionRun` from `useRunPolling`; no new API fields.
- Produces: fully live progress, parallel-race, success, and graceful-failure presentation.

- [ ] **Step 1: Write failing state-rendering tests**

```tsx
// @vitest-environment jsdom
it("renders three repairs as a parallel race", () => {
  render(<ResurrectionDashboard run={repairingRunFixture()} />);
  expect(screen.getByText("RESURRECTING")).toBeInTheDocument();
  expect(screen.getAllByTestId("repair-attempt")).toHaveLength(3);
  expect(screen.getByText("Historical Node runtime")).toBeInTheDocument();
  expect(screen.getByText("Legacy dependency resolution")).toBeInTheDocument();
  expect(screen.getByText("Minimal compatibility patch")).toBeInTheDocument();
});

it("renders verified success with a link fallback", () => {
  render(<ResurrectionDashboard run={successfulRunFixture()} />);
  expect(screen.getByText("PROJECT RESURRECTED")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open live project" })).toHaveAttribute("target", "_blank");
  expect(screen.getByText("HTTP verification")).toBeInTheDocument();
});

it("renders failure without preview controls", () => {
  render(<ResurrectionDashboard run={failedRunFixture()} />);
  expect(screen.getByText(/could not be started after 3 repair attempts/i)).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Open live project" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run dashboard tests and observe RED**

Run:

```bash
npm test -- src/components/resurrection-dashboard.test.tsx
```

Expected: FAIL until the live status mapping and summary exist.

- [ ] **Step 3: Map state to clear human copy**

Use exhaustive `switch` functions for status labels. Required mappings include:

```ts
const STATUS_LABELS: Readonly<Record<RunStatus, string>> = {
  queued: "Queued for resurrection",
  creating_sandbox: "Creating isolated Daytona sandbox",
  cloning: "Cloning repository inside the sandbox",
  inspecting: "Reconstructing the expected environment",
  planning: "Preparing a deterministic launch plan",
  installing: "Installing project dependencies",
  starting: "Attempting baseline startup",
  diagnosing: "Diagnosing baseline failure",
  repairing: "Racing three isolated repair strategies",
  verifying: "Independently verifying the surviving project",
  success: "Project resurrected",
  failed: "Resurrection stopped",
};
```

Do not show raw stdout/stderr until the user expands a technical-details disclosure.

- [ ] **Step 4: Make the parallel race visually explicit**

Render a three-column desktop / stacked mobile layout with shared origin `Clean snapshot S0`, strategy labels A/B/C, status indicators, hypothesis, invasiveness badge, and changed-file count. Use CSS transitions only; no motion library installation.

- [ ] **Step 5: Implement the success summary and preview fallback**

Show:

- framework, runtime, package manager;
- install and start commands in monospaced text;
- total repair attempts;
- whether the winner reconstructed the environment or changed code;
- changed file names;
- process and HTTP verification checks;
- `Open live project` link.

Attempt iframe rendering only after success. Add `sandbox="allow-forms allow-modals allow-popups allow-scripts allow-same-origin"`, a descriptive title, and a visible fallback link. A frame `load` event does not count as verification; verification comes only from backend data.

- [ ] **Step 6: Implement exact graceful-failure copy**

Map backend categories to the spec text:

- unsupported: `We couldn't identify a runnable application in this repository.`
- repair exhausted: `We reconstructed the likely environment, but the project still could not be started after 3 repair attempts.`
- missing environment: `The application requires environment variables that are not present.`
- external service: `The project starts, but requires an external database/service that could not be reconstructed automatically.`

Unknown failures show the persisted reason and never render preview UI.

- [ ] **Step 7: Verify live UI behavior**

Run:

```bash
npm test -- src/components/resurrection-dashboard.test.tsx src/components/repo-input.test.tsx src/hooks/use-run-polling.test.tsx
npm run typecheck
npm run lint -- src/app src/components src/hooks src/lib/client
```

Expected: all UI tests pass, including terminal polling and no-preview-on-failure.

**Acceptance criteria:**

- [ ] Judges can see three repair paths racing from one clean origin.
- [ ] The preview is the success payoff, not a log dashboard.
- [ ] Technical details are available but collapsed by default.
- [ ] Every failure state is honest and actionable.
- [ ] Mobile layout has no horizontal overflow at 390 × 900.

**Approval-gated commit:** If git approval is later granted, use `[ui] show live repair race and preview`.

---

### Task 9: Safety Hardening, Demo Repository Matrix, and Independent Integration Verification

**Owner:** Agent 3 as independent verifier. Implementation defects are assigned back to the owning agent; Agent 3 does not silently fix other lanes.

**Files:**

- Create: `src/lib/resurrection/orchestrator.integration.test.ts`
- Modify: `docs/demo-readiness.md`
- No production file edits by Agent 3 unless the finding is inside Agent 3's owned Daytona/verification paths.

**Interfaces:**

- Consumes: complete API, orchestrator, `FakeComputeProvider`, and real Daytona smoke path.
- Produces: reproducible evidence for safety, timeouts, cleanup, primary/backup demo repositories, and an explicit go/no-go assessment.

- [ ] **Step 1: Add an integration test matrix with fakes**

Use table-driven tests for:

```ts
interface IntegrationCase {
  name: string;
  fixture: FakeRepositoryFixture;
  expectedStatus: "success" | "failed";
  expectedFailure?: string;
  expectedForkCount: number;
}

const CASES: IntegrationCase[] = [
  { name: "invalid URL", fixture: invalidUrlFixture(), expectedStatus: "failed", expectedFailure: "public HTTPS GitHub URL", expectedForkCount: 0 },
  { name: "unsupported repository", fixture: unsupportedFixture(), expectedStatus: "failed", expectedFailure: "runnable application", expectedForkCount: 0 },
  { name: "baseline success", fixture: baselineSuccessFixture(), expectedStatus: "success", expectedForkCount: 1 },
  { name: "install timeout", fixture: installTimeoutFixture(), expectedStatus: "failed", expectedFailure: "120 seconds", expectedForkCount: 4 },
  { name: "three repairs fail", fixture: exhaustedFixture(), expectedStatus: "failed", expectedFailure: "3 repair attempts", expectedForkCount: 4 },
  { name: "repair winner", fixture: repairWinnerFixture(), expectedStatus: "success", expectedForkCount: 4 },
];
```

`expectedForkCount: 4` means one baseline child plus three repair children; the seed itself is created, not forked.

- [ ] **Step 2: Run integration tests and record exact scoped evidence**

Run:

```bash
npm test -- src/lib/resurrection/orchestrator.integration.test.ts
```

Expected: each case passes and fake inventory is empty after failed runs; successful runs retain only seed plus winner until TTL.

- [ ] **Step 3: Check security invariants statically**

Run:

```bash
rg -n "process\.(exec|spawn)|execSync|spawnSync|child_process" src
rg -n "OPENAI_API_KEY|DAYTONA_API_KEY|SUPABASE_SERVICE_ROLE_KEY" src scripts
rg -n "@ts-ignore|@ts-expect-error|catch\s*\([^)]*\)\s*\{\s*\}" src
```

Expected:

- no host process execution in `src`;
- key names appear only in server config validation, never in sandbox environment construction or client code;
- no suppression directives or empty catches.

Manually inspect every match and record disposition in `docs/demo-readiness.md`.

- [ ] **Step 4: Test real failure modes on Daytona**

For each real run, record run ID, repository commit, elapsed time, seed ID, baseline ID, repair fork IDs, winner ID, HTTP status, changed files, and cleanup result. Do not record API keys or full signed preview URLs.

Required live cases:

1. known-compatible public web repo: baseline succeeds;
2. target dormant public GUI repo: baseline fails and one of three repairs succeeds;
3. unsupported public repo: fails gracefully before install;
4. backup dormant repo: full core path succeeds within 8 minutes.

- [ ] **Step 5: Select primary and backup demo repositories**

Evaluate 3-5 candidates outside the core implementation timebox against:

- public and 3-7 years old;
- visible web UI;
- no API key, proprietary service, database, or licensed binary;
- baseline failure demonstrates useful environment reconstruction;
- repaired boot under approximately 2 minutes;
- stable across two consecutive full runs.

Only the primary and backup need two-run proof. Record canonical URLs and commits in `docs/demo-readiness.md`; do not hardcode them into production UI.

- [ ] **Step 6: Independently verify losing-fork cleanup**

After each live run, use the Daytona dashboard or a small read-only SDK inventory call to confirm every baseline/losing fork is destroyed and the seed/winner TTL is set. A green API response is insufficient if resources leak.

- [ ] **Step 7: Issue go/no-go verdict**

`docs/demo-readiness.md` ends with:

```markdown
## Go / No-Go

- Core flow: GO | NO-GO
- Parallel fork evidence: GO | NO-GO
- Cleanup evidence: GO | NO-GO
- Primary demo repository: <canonical owner/repo at commit>
- Backup demo repository: <canonical owner/repo at commit>
- Nosana visual proof: GO | NO-GO | NOT_APPLICABLE_NON_GUI
- Open findings: <number by severity>
```

**Acceptance criteria:**

- [ ] The target dormant repo succeeds twice without manual sandbox intervention.
- [ ] The backup repo succeeds once after selection and once during final rehearsal.
- [ ] No secret reaches a sandbox or client bundle.
- [ ] Losing resources are independently confirmed destroyed.
- [ ] Any open High/Critical finding produces `NO-GO`; a scoped green test cannot override it.

**Approval-gated commit:** If git approval is later granted, use `[verify] add resurrection integration evidence`.

---

### Task 10: Nosana GPU Visual Proof for the GUI Demo

**Owner:** Agent 3 owns screenshot capture, the Nosana adapter, tests, and evidence. Agent 2 integrates the frozen interface. Agent 1 renders the returned badge/link. This task is required for the selected GUI hackathon demo, but it does not enter the repair loop or replace Daytona process+HTTP verification.

**Files:**

- Create: `src/lib/daytona/capture-screenshot.ts`
- Create: `src/lib/daytona/capture-screenshot.test.ts`
- Create: `src/lib/nosana/client.ts`
- Create: `src/lib/nosana/visual-proof.ts`
- Create: `src/lib/nosana/visual-proof.test.ts`
- Modify: `src/lib/contracts/run.ts`
- Modify: `src/lib/resurrection/orchestrator.ts`
- Modify: `src/lib/resurrection/orchestrator.test.ts`
- Modify: `src/components/resurrection-summary.tsx`
- Modify: `src/components/resurrection-summary.test.tsx`
- Modify: `docs/demo-readiness.md`

**Interfaces:**

```ts
export interface NosanaVisualClient {
  classifyScreenshot(input: {
    jpegBase64: string;
    deadlineMs: number;
  }): Promise<{
    jobId: string;
    evidenceUrl: string;
    label: "meaningful_ui" | "blank" | "error_overlay";
    summary: string;
    durationMs: number;
  }>;
}

export interface VisualProofVerifier {
  verify(input: {
    sandbox: SandboxRef;
    previewUrl: string;
    deadlineMs: number;
  }): Promise<VisualProofResult>;
}
```

`NosanaVisualClient` is the stable application seam. Its production adapter must use only the submission/status calls verified in Task 0; `[VERIFY SIGNATURE]` applies until installed `@nosana/kit` declarations or the verified prewarmed endpoint contract confirms them.

- [ ] **Step 1: Freeze the proved execution route**

From `npm run smoke:nosana`, record the exact SDK methods or HTTPS endpoint, auth mechanism, market, immutable GPU container image reference/digest, output schema, median latency, and evidence-URL format in `docs/demo-readiness.md`. Use a prewarmed Nosana endpoint if cold job scheduling threatens the five-minute demo. Do not build or deploy a custom model during the hackathon.

- [ ] **Step 2: Write RED tests for classification and failure behavior**

```ts
it.each([
  ["meaningful_ui", "passed"],
  ["blank", "failed"],
  ["error_overlay", "failed"],
])("maps Nosana label %s to %s", async (label, status) => {
  const verifier = createVisualProofFixture({ label });
  await expect(verifier.verify(visualProofInput())).resolves.toMatchObject({
    provider: "nosana",
    status,
    label,
  });
});

it("returns unavailable with a reason when the bounded Nosana call fails", async () => {
  const verifier = createVisualProofFixture({ error: new Error("deadline exceeded") });
  await expect(verifier.verify(visualProofInput())).resolves.toMatchObject({
    provider: "nosana",
    status: "unavailable",
  });
});
```

Run `npm test -- src/lib/nosana/visual-proof.test.ts`; expected RED because the adapter and verifier do not exist.

- [ ] **Step 3: Implement one bounded proof request**

After the winner passes Daytona process+HTTP checks, capture exactly one JPEG inside the Daytona browser/computer-use environment, reject empty or oversized data, and send only the image bytes plus a fixed classification prompt to Nosana. Validate the response with a strict Zod schema. Permit one request and status polling only until `deadlineMs`; no retry agent, repair feedback, video, or continuous GPU workload.

Security limits: never send repository source, logs, secrets, signed preview URLs, or user credentials to Nosana; never expose `NOSANA_API_KEY` to the browser or Daytona sandbox; sanitize the evidence URL to an allowed Nosana HTTPS host before returning it.

- [ ] **Step 4: Integrate after objective verification**

```ts
if (context.profile.isGui && context.visualProofVerifier) {
  await reporter.transition("verifying", "Requesting Nosana GPU visual proof.");
  visualProof = await context.visualProofVerifier.verify({
    sandbox: winner.sandbox,
    previewUrl: winner.verification.previewUrl,
    deadlineMs: Math.min(context.deadlineMs, Date.now() + 120_000),
  });
}
```

Persist `visualProof` on the run. `failed` makes a GUI run fail because the page is blank or broken. `unavailable` preserves the already-proven core resurrection result but makes `Nosana visual proof: NO-GO` in demo readiness. Non-GUI repositories do not invoke this stage.

- [ ] **Step 5: Render demo-visible evidence**

Agent 1 adds a `GPU visual proof · Nosana` row to the success summary showing Passed/Failed/Unavailable, the short summary, duration, and a safe external evidence link when present. Add a component test confirming secrets and raw image data are never rendered.

- [ ] **Step 6: Verify scoped behavior**

Run:

```bash
npm test -- src/lib/daytona/capture-screenshot.test.ts src/lib/nosana/visual-proof.test.ts src/lib/resurrection/orchestrator.test.ts src/components/resurrection-summary.test.tsx
npm run typecheck
```

Then, with explicit live/E2E approval, run the selected GUI repository once and record the Daytona sandbox ID, Nosana job ID/evidence URL, label, and timing without credentials or signed preview tokens.

**Acceptance criteria:**

- [ ] The selected GUI demo produces one real Nosana GPU job or verified prewarmed-endpoint execution after Daytona HTTP success.
- [ ] The UI visibly attributes the proof to Nosana and links to non-secret execution evidence.
- [ ] `meaningful_ui` passes; `blank` and `error_overlay` fail; malformed/timeout responses become explicit `unavailable` results.
- [ ] Nosana receives only bounded screenshot bytes and cannot influence repair commands, fork selection, or cleanup.
- [ ] Daytona remains the sole environment that clones, installs, starts, and repairs submitted repositories.
- [ ] A missing Nosana proof does not falsify core resurrection success, but it blocks the final hackathon `GO` for the chosen GUI demo.

**Approval-gated commit:** If git approval is later granted, use `[verify] add Nosana GPU visual proof`.

---

### Task 11: Optional Structured Repair Trace Replay

**Owner:** Agent 2 for trace data and Agent 1 for replay controls. Start only after Task 9 reports all core gates `GO` and the clock is before 4:00.

**Files when started:**

- Modify: `src/lib/contracts/run.ts`
- Modify: `src/lib/resurrection/run-reporter.ts`
- Create: `src/components/repair-replay.tsx`
- Create: `src/components/repair-replay.test.tsx`
- Modify: `src/components/resurrection-dashboard.tsx`

**Interfaces:**

- Consumes: existing `RunEvent` records already persisted for the timeline.
- Produces: optional `RepairTraceEvent[]` projection and a pause/play scrubber; no new backend endpoint.

- [ ] **Step 1: Enforce the time and stability gate**

Do not start if any core test, primary demo run, backup demo run, cleanup check, or visual requirement is unresolved. Record `Trace replay: skipped to protect core demo` and continue to Task 12.

- [ ] **Step 2: Write a failing pure projection test**

```ts
it("projects existing run events into chronological replay frames", () => {
  const frames = toRepairTrace(eventsOutOfOrderFixture());
  expect(frames.map((frame) => frame.type)).toEqual([
    "inspection",
    "failure",
    "hypothesis",
    "command",
    "verification",
    "winner",
  ]);
});
```

- [ ] **Step 3: Implement projection without new persistence**

Map existing events to:

```ts
export interface RepairTraceEvent {
  timestamp: string;
  forkId?: string;
  type: "inspection" | "hypothesis" | "command" | "failure" | "patch" | "verification" | "winner";
  summary: string;
  diff?: string;
  reason?: string;
}
```

Do not record full file contents, secrets, signed URLs, or terminal streams. Diffs are limited to changed paths and short summaries already present in run data.

- [ ] **Step 4: Add a lightweight replay control**

Use React state and a 750 ms interval with cleanup. Render existing timeline frames one at a time with Play, Pause, and Reset buttons. Do not add a motion/video dependency.

- [ ] **Step 5: Verify optional polish quickly**

Run:

```bash
npm test -- src/components/repair-replay.test.tsx
npm run typecheck
```

Expected: test passes within the remaining polish timebox. If it does not, remove this optional production work and retain the existing static timeline.

**Acceptance criteria:**

- [ ] Replay derives from existing events and adds no orchestration dependency.
- [ ] Core API and static timeline work without replay.
- [ ] Optional work consumes no time after 4:30.

**Approval-gated commit:** If git approval is later granted and the task shipped, use `[ui] add repair trace replay`.

---

### Task 12: Final Scoped Verification, Full-Suite Approval Gate, and Demo Freeze

**Owner:** All three agents; Agent 3 records the independent verdict.

**Files:**

- Modify: `docs/demo-readiness.md`
- Modify: `README.md`
- No feature files unless fixing a reproduced defect in the owning lane.

**Interfaces:**

- Consumes: completed core system, primary/backup demo evidence.
- Produces: reproducible local setup, final verification evidence, and a frozen demo procedure.

- [ ] **Step 1: Update the README with verified setup only**

Document:

- Node/npm versions actually used;
- copy `.env.example` to `.env.local` and fill only Daytona/OpenAI credentials;
- approved install command `npm install`;
- `npm run dev`;
- supported public web-project scope and safety disclaimer;
- primary flow and 8-minute limit;
- no claim of malware certification, permanent hosting, private repositories, Nosana-powered repair execution, or universal language support;
- Nosana's bounded role: GPU visual proof of one post-repair GUI screenshot.

Do not include real credentials, signed preview URLs, sandbox IDs, or unverified deployment instructions.

- [ ] **Step 2: Run each lane's scoped checks**

Agent 1:

```bash
npm test -- src/components src/hooks
npm run lint -- src/app src/components src/hooks src/lib/client
```

Agent 2:

```bash
npm test -- src/lib/github src/lib/store src/lib/jobs src/lib/openai src/lib/resurrection
npm run lint -- src/app/api src/lib/contracts src/lib/github src/lib/store src/lib/jobs src/lib/openai src/lib/resurrection
```

Agent 3:

```bash
npm test -- src/lib/daytona src/lib/nosana src/lib/resurrection/verify.test.ts src/lib/resurrection/orchestrator.integration.test.ts
npm run lint -- src/lib/daytona src/lib/nosana src/lib/resurrection/verify.ts scripts/daytona-smoke.ts scripts/nosana-smoke.ts
```

Expected: each scoped command exits 0 with no warnings. These are scoped commands, not authorization to run the entire suite.

- [ ] **Step 3: Run typecheck and production build**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both exit 0. `npm run build` does not contact Daytona/OpenAI or start a repository run.

- [ ] **Step 4: Obtain explicit approval for the full test suite and E2E demo run**

Only after approval, run:

```bash
npm test
```

Then execute one primary and one backup live resurrection from the UI. Expected: both meet their recorded outcomes, and the primary dormant repo visibly races three repairs.

- [ ] **Step 5: Recheck live resource cleanup**

After the primary and backup runs, independently list relevant Daytona sandboxes by run label. Expected: no baseline or losing repair remains; only the TTL-bound seed/winner pairs remain for successful previews.

- [ ] **Step 6: Rehearse the 90-second demo**

Use the spec sequence exactly:

1. state the dead-link/software-preservation problem;
2. paste the prevalidated primary public repo URL;
3. show clone, clean snapshot, baseline failure, and three repair branches;
4. show the verified winner and cleanup;
5. open the live project;
6. close with `Instead of preserving what software looked like, we preserve the ability to experience it.`

Keep the backup repo URL ready. Do not improvise a new repository in front of judges.

- [ ] **Step 7: Freeze at 4:30**

After 4:30, allow only reproduced bug fixes, verification reruns, backup checks, and pitch preparation. Do not expand Nosana beyond the already-integrated visual proof or start persistence, auth, CI/CD, private GitHub, generalized language support, or architecture refactors.

**Acceptance criteria:**

- [ ] Typecheck, build, scoped lint, and scoped tests pass with exact commands recorded.
- [ ] Full suite and live E2E run only after explicit approval.
- [ ] Primary and backup live outcomes match `docs/demo-readiness.md`.
- [ ] Parallel fork evidence and cleanup evidence are independently confirmed.
- [ ] The chosen GUI demo has a real, demo-visible Nosana proof with non-secret execution evidence.
- [ ] README describes only the verified local demo path.
- [ ] Final verdict is `GO` with no open High/Critical finding, or `NO-GO` with the exact blocker.

**Approval-gated commit:** If git approval is later granted, use `[docs] finalize resurrection demo runbook`.

---

## Integration Checkpoints and Handoff Protocol

1. **Contract checkpoint (target 0:20):** Agent 2 announces the exact contract commit/diff; Agents 1 and 3 typecheck their imports before further work.
2. **Vertical-slice checkpoint (target 1:15):** Agent 2 wires API/orchestrator, Agent 3 supplies the real provider, and Agent 1 points polling at the live API. The gate is a compatible public repo preview without OpenAI.
3. **Repair checkpoint (target 2:30):** The backend receives one structured plan, Daytona creates three real forks concurrently, and the UI renders all three attempts from live events.
4. **Verification checkpoint (target 3:15):** Agent 3 independently confirms process+HTTP success and losing-fork deletion; owners fix findings in their own paths.
5. **Demo checkpoint (target 4:00):** primary and backup repositories are recorded with commits and timings; the chosen GUI demo has a passed Nosana visual proof or the build is explicitly `NO-GO`.
6. **Freeze checkpoint (4:30):** no new feature work.

Every handoff includes:

- files changed;
- exact commands run and exit status;
- RED failure observed before production behavior;
- GREEN scoped result;
- SDK assumptions confirmed or still marked `[UNCERTAIN]`;
- open findings by severity;
- no self-closure claim for findings assigned to another agent.

## Scope Exclusions Enforced by This Plan

- No Supabase, authentication, private repositories, GitHub OAuth, or user accounts.
- No Nosana repair execution, agent loop, per-fork inference, model training, or general GPU routing; Nosana is limited to one post-verification GUI screenshot proof.
- No LangChain, general agent loop, multi-round repair tree, or more than three repair forks.
- No WebSockets, durable queue, production multi-tenancy, billing, Kubernetes, CI/CD, or automatic PRs.
- No host cloning, host dependency installation for submitted repos, host builds, or host process startup.
- No arbitrary database/service reconstruction.
- No full video recording or visual regression system.
- No successful-environment snapshot marketplace; clean S0 exists only for the run and is deleted after core cleanup unless optional preservation is explicitly approved later.

## Final Plan Self-Review Checklist

- [ ] Spec coverage: input, Daytona isolation, clean snapshot, deterministic detection, baseline, exactly three parallel repairs, objective verification, preview, summary, safety limits, cleanup, failures, and conditional visual verification each map to a task.
- [ ] Earliest end-to-end flow: Tasks 1-5 produce a compatible-repo live preview before OpenAI repair is implemented.
- [ ] Parallelization: each agent has disjoint production paths after the contract checkpoint.
- [ ] Optional polish: trace replay and successful preservation cannot block core gates.
- [ ] API currency: documented Daytona/OpenAI/Nosana surfaces are listed, and live/account assumptions have explicit preflight checks.
- [ ] Type consistency: `ResurrectionRun`, `RepairPlan`, `ComputeProvider`, verification, and winner fields use one frozen spelling throughout.
- [ ] Security: no submitted URL enters a host shell, no host secrets enter a sandbox, and file actions are repository-confined.
- [ ] Cleanup: baseline, losers, failed runs, snapshots, seeds, and winners each have an explicit lifecycle disposition.
- [ ] No invented SDK signature or unassigned implementation step remains; Nosana adapter implementation is gated on installed types or the verified endpoint contract.

## Review Notes

- Changed: created a task-by-task, test-first implementation plan optimized for a working deterministic baseline by approximately 1:15 and the required three-fork repair race by approximately 2:30.
- Changed: assigned UI to Agent 1, API/orchestration/OpenAI to Agent 2, and Daytona/provider/independent verification to Agent 3 with exclusive file ownership.
- Changed: assigned Nosana to Agent 3 as a bounded, real GPU visual-proof stage with a UI badge and job evidence; it does not control repairs.
- Changed: resolved baseline contamination by keeping a pristine seed, snapshotting it, and running baseline and repairs only on its children.
- Intentionally not changed: no application source, dependency manifest, lockfile, CI configuration, or runtime configuration was modified by writing this plan.
- Intentionally excluded: Nosana-driven repair execution or model training, Supabase, auth, WebSockets, LangChain, private repositories, CI/CD, and production infrastructure.
- Known limitation: process-local file persistence and background work are credible for a local judging demo but not a production deployment model.
- Human review before implementation: approve package installation, provide Daytona/OpenAI/Nosana credentials out of band, confirm live Daytona quota and Nosana market/endpoint access, and separately approve any git or full-suite/E2E operation.
