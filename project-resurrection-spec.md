# Project Resurrection — Full Hackathon Product & Implementation Spec

> **Purpose of this file:** Paste this entire document into an AI coding agent as the source of truth for building the project.
>
> **Hackathon constraint:** 5 hours total. Optimize for a compelling, reliable MVP and demo. Do not over-engineer.

---

# 0. One-line concept

**Project Resurrection safely brings dormant software back to life by taking a repository, reconstructing its environment inside an isolated sandbox, repairing only what is necessary, verifying that it runs, and exposing the result as a real interactive prototype.**

Core insight:

> **We archive software like images, even though software is meant to be experienced.**

---

# 1. Problem

Developer communities, hackathons, universities, open-source projects, and individuals preserve old software mostly as:

- GitHub repositories
- screenshots
- videos
- Devpost pages
- dead deployment URLs
- README files

The software itself is often no longer directly usable.

A dormant repository may still contain a perfectly good application, but bringing it back requires someone to manually:

1. understand the stack,
2. determine the expected runtime,
3. install dependencies,
4. recreate missing environment assumptions,
5. fix incompatible dependencies or scripts,
6. start the correct services,
7. discover the correct port,
8. verify that the application actually works,
9. keep a reproducible working environment.

The project may not even be broken. It may simply be **dormant**.

Today, an archive usually lets people **look at what was built**.

This product lets people **experience what was built**.

---

# 2. Target users

## Primary user for the hackathon MVP

A developer who has an old or dormant public GitHub repository and wants to make it runnable again without manually reconstructing the environment.

## Secondary users

- Hackathon organizers preserving past projects
- Developer communities maintaining project archives
- Universities preserving student software
- Open-source maintainers
- Researchers preserving runnable research code
- Developers inheriting old internal tools
- Portfolio owners with dead deployments

---

# 3. Core value proposition

Input:

```text
https://github.com/owner/repository
```

Output:

```text
A safely isolated, live, interactive version of that project.
```

The system should:

```text
repository
   ↓
inspect
   ↓
infer environment
   ↓
create isolated sandbox
   ↓
clone repository
   ↓
snapshot clean cloned state
   ↓
attempt baseline startup
   ↓
if broken → fork snapshot N ways
   ↓
run parallel repair strategies
   ↓
keep first/best fork that actually boots
   ↓
verify process + HTTP + optional visual render
   ↓
live preview URL
   ↓
preserve successful environment metadata
```

---

# 4. Product principles

## 4.1 Safe by default

Never execute repository code on the host machine.

All untrusted repository code must run inside a Daytona sandbox.

Never expose application secrets to the submitted repository unless explicitly required and approved.

Never automatically execute destructive actions outside the sandbox.

## 4.2 Restore before modifying

Do not immediately rewrite old code to modern standards.

First attempt to reproduce the environment the software expected.

Preferred order:

```text
1. detect expected runtime
2. install correct dependency versions
3. use existing scripts
4. reconstruct missing config
5. only then modify code if required
```

The goal is **resurrection**, not modernization.

## 4.3 Minimal repair

If code changes are necessary:

- make the smallest viable patch,
- preserve intended behavior,
- record exactly what changed,
- never perform broad refactors during the MVP.

## 4.4 Objective verification

The agent must not be allowed to simply claim:

> "The project works."

The system should independently verify at least one of:

- expected process is alive,
- HTTP endpoint returns 2xx/3xx,
- detected preview port responds,
- build command exits successfully,
- existing test suite passes.

For frontend applications, an HTTP health check is sufficient for MVP.

## 4.5 Experience over archive

The final product should emphasize the live software, not logs or AI chat.

The live preview is the hero outcome.

---

# 5. Hackathon scoring strategy

The project should explicitly optimize for:

| Criterion | Strategy |
|---|---|
| MVP | One public GitHub URL → live project |
| Creativity | Interactive software preservation / resurrection |
| Product-market fit | Dormant repos, dead demos, hackathon archives |
| Problem / gap | Existing archives preserve descriptions, not runnable experiences |
| Demo potential | Broken/dead-looking repo becomes live in front of judges |

---

# 6. MVP scope

## MUST HAVE

### Input

- GitHub repository URL input
- Validate that it is a public GitHub repo
- Start resurrection button

### Resurrection pipeline

- Create isolated Daytona sandbox
- Clone the repository
- Inspect important files
- Infer framework/runtime
- Determine probable install command
- Determine probable run command
- Install dependencies
- Attempt baseline startup
- Detect failures
- Snapshot the clean post-clone sandbox before any repair
- Generate multiple distinct repair strategies
- Fork the clean snapshot into parallel repair sandboxes
- Execute repair strategies concurrently
- Verify each fork independently
- Keep the first successful fork, or rank successful forks by minimal invasiveness
- Terminate losing forks
- Detect open application port
- Generate Daytona preview URL
- Verify HTTP response
- If the project has a GUI, optionally perform visual verification with Computer Use / browser screenshot inspection

### UI

- Landing/input state
- Live resurrection progress
- Timeline/log of meaningful steps
- Success state
- Embedded or linked live preview
- Basic summary:
  - detected stack
  - runtime
  - install command
  - run command
  - number of repair attempts
  - changes made

### Safety

- All repo code executes only inside Daytona
- Hard execution timeout
- Hard maximum repair attempts
- No host shell execution
- No secrets passed into sandbox by default

---

# 7. Explicit non-goals for 5-hour MVP

Do **not** build these unless the core flow is already complete:

- private GitHub repository auth
- organization/team accounts
- billing
- production-grade multi-tenancy
- full software preservation network
- permanent archive browsing
- advanced malware analysis
- Kubernetes orchestration
- arbitrary cloud-provider routing
- full Nosana integration
- general-purpose multi-agent orchestration beyond the bounded parallel repair search
- visual regression testing
- automatic PR creation
- full environment snapshot marketplace
- Dockerfile generation for every repo
- support for every programming language
- complete database/service reconstruction
- production observability stack

---

# 8. Supported repositories for MVP

Bias toward **web projects**, because they produce the strongest visual demo.

Support in this priority order:

1. Node.js / JavaScript / TypeScript web apps
   - Next.js
   - Vite
   - React
   - Vue
   - Express
   - common npm-based apps

2. Python web apps
   - Flask
   - FastAPI
   - Streamlit
   - Gradio

3. Optional if time allows
   - static HTML/CSS/JS
   - simple Dockerfile-based apps

The AI may attempt unsupported projects, but the UI should not promise universal compatibility.

---


# 8.1 Core differentiator — parallel forked repair search

This is a **core MVP mechanic**, not a stretch feature.

Linear repair is fragile:

```text
clean repo
   ↓
try fix A
   ↓
A changes environment
   ↓
try fix B on top of A
   ↓
state is now contaminated
```

Instead:

```text
                    clean cloned repo
                           │
                      snapshot S0
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
       fork A           fork B           fork C
          │                │                │
   old runtime pin   dependency relax   minimal patch
          │                │                │
        verify           verify           verify
          │                │                │
       FAIL             SUCCESS            FAIL
                           │
                           ↓
                    promote fork B
```

The product should use Daytona snapshot/fork semantics to create multiple isolated repair worlds from the exact same starting state.

### Why this matters

It provides three benefits simultaneously:

1. **Search quality** — different repair hypotheses can be tested without contaminating one another.
2. **Latency** — repair attempts run concurrently rather than sequentially.
3. **Demo clarity** — the UI can visibly show several repair paths racing and one surviving.

### Repair strategy examples

For Node projects:

```text
A. respect package.json engines / .nvmrc exactly
B. try an older compatible Node LTS
C. relax dependency resolution / legacy peer dependency mode
D. patch one deprecated package/API usage only
```

For Python projects:

```text
A. respect .python-version / pyproject constraints
B. try older Python minor version
C. install from lockfile vs requirements fallback
D. minimally patch deprecated import/API usage
```

Strategies must be **meaningfully different**. Do not launch four forks that only vary superficial command syntax.

### Fork count

For the hackathon MVP:

```text
N = 3
```

Default to three parallel repair forks.

Allow `N = 4` only if sandbox startup and API limits remain reliable.

### Winner selection

A fork qualifies only if independent verification succeeds.

If multiple forks succeed, rank:

```text
1. no source changes
2. environment/config-only changes
3. dependency changes
4. source-code patches
5. fewer total changes
6. faster successful boot
```

This encodes the preservation philosophy directly into the algorithm.

### Cleanup

Immediately terminate losing forks after a winner is selected.

Do not leave repair sandboxes running.

---

# 9. Optimal hackathon tech stack

## 9.1 Language

**TypeScript end-to-end.**

Reason:

- Daytona has a TypeScript SDK.
- GitHub integration is straightforward.
- OpenAI SDK is first-class.
- Next.js frontend/backend can share types.
- One language minimizes context switching during a 5-hour build.

---

## 9.2 Application framework

**Next.js App Router + TypeScript**

Use:

- React Server Components where convenient
- client components only for interactive run state
- Route Handlers for API endpoints

Do not split into a separate Python backend unless absolutely necessary.

---

## 9.3 Styling

- Tailwind CSS
- shadcn/ui for primitives
- Lucide icons
- Motion / Framer Motion only for lightweight transitions if already installed

Design direction:

- archival / museum-like
- modern developer tooling
- restrained interface
- strong typography
- resurrection timeline as core visual
- live preview as the payoff

Do not burn hackathon time on excessive animation.

---

## 9.4 Execution infrastructure

**Daytona**

Daytona is the core enabling infrastructure.

Use it for:

- sandbox creation
- isolated code execution
- filesystem operations
- process execution
- preview URLs
- snapshotting the clean cloned project before repairs
- forking that snapshot into multiple parallel repair attempts
- optional snapshotting of the final successful resurrection

Every submitted repository must run inside a Daytona sandbox.

No repository command may run on the Next.js server itself.

---

## 9.5 AI model

### Primary resurrection agent

**OpenAI GPT-5.6 Sol via the Responses API**

Default:

```text
model: gpt-5.6-sol
reasoning.effort: medium
```

Escalate to `high` only when:

- two repair attempts fail,
- dependency conflicts are non-obvious,
- multiple runtime interpretations are possible.

Do not use high reasoning on every step.

The agent's responsibilities are:

- inspect repo evidence,
- infer environment,
- diagnose baseline startup failures,
- generate 3 meaningfully distinct repair strategies,
- choose commands for each strategy,
- decide whether a code/config change is necessary,
- generate minimal patches,
- summarize why each strategy differs.

The orchestrator executes strategies concurrently. The model does not manually serialize them.

Do not use the LLM for deterministic tasks such as URL parsing or process polling.

### Optional cheap classifier

Only if needed:

```text
gpt-5.6-luna
```

for lightweight classification or summarization.

For a 5-hour MVP, using Sol for the entire intelligent portion is simpler.

---

## 9.6 AI orchestration

**Do not use LangChain for the MVP.**

Use the OpenAI Responses API directly.

Reason:

- less abstraction,
- easier debugging,
- smaller dependency surface,
- explicit control over the repair loop,
- the workflow is naturally a deterministic state machine with AI decisions inside it.

Architecture:

```text
deterministic orchestrator
        ↓
      inspect
        ↓
      model
        ↓
choose action
        ↓
Daytona tool
        ↓
result
        ↓
      model
        ↓
...
```

The LLM is **inside the loop**, not the loop itself.

---

## 9.7 Database

### MVP

Prefer **Supabase Postgres** only if persistence is needed.

Store:

- resurrection runs
- repository URL
- detected stack
- status
- sandbox ID
- preview URL
- repair summary
- timestamps

Do not block core implementation on auth.

A hackathon demo can run without user accounts.

If time is extremely limited, use an in-memory run store first and add Supabase after the end-to-end flow works.

---

## 9.8 Authentication

**No authentication for initial MVP.**

Public GitHub repositories only.

If adding auth later:

- Supabase Auth
- GitHub OAuth

Do not spend the first hours implementing accounts.

---

## 9.9 GitHub integration

For MVP:

- parse public GitHub repository URL,
- clone repository directly inside Daytona using `git clone`.

Use GitHub REST API only for lightweight metadata if useful:

- repo name
- description
- stars
- last commit date
- default branch

Do not download repository contents through the Next.js server.

---

## 9.10 Deployment

For the hackathon:

### Best reliability

Run the Next.js app locally for the judging demo if remote deployment creates unnecessary risk.

### If a public deployment is required

Use a platform that permits the orchestration request model you implement.

Important:

Resurrection can take minutes, so do **not** architect the entire workflow around one fragile browser HTTP request.

Preferred pattern:

```text
POST /api/runs
    ↓
create run ID
    ↓
background resurrection process
    ↓
browser polls GET /api/runs/:id
```

If using only Next.js during the hackathon, a process-local job runner is acceptable for demo purposes.

For production, move orchestration into a durable job system.

---

## 9.11 Nosana

**Nosana is optional, not core MVP.**

Use it only if a repository genuinely requires GPU compute.

Possible later flow:

```text
repo inspection
   ↓
detect CUDA / PyTorch / GPU requirement
   ↓
construct container workload
   ↓
Nosana deployment
```

Do not force Nosana into ordinary web repository resurrection.

A clean architecture should leave a future `ComputeProvider` abstraction:

```ts
interface ComputeProvider {
  createEnvironment(...): Promise<Environment>;
}
```

MVP implementation:

```text
DaytonaComputeProvider
```

Future:

```text
NosanaGpuProvider
```

---

# 10. High-level architecture

```text
┌────────────────────────────────────────────┐
│                 Next.js UI                 │
│                                            │
│ repo URL → repair race → preview → summary │
└─────────────────────┬──────────────────────┘
                      │
                      ↓
┌────────────────────────────────────────────┐
│          Resurrection Orchestrator         │
│                                            │
│ deterministic state machine               │
│ + AI strategy generation                  │
└──────────────┬─────────────────────────────┘
               │
       ┌───────┴────────┐
       ↓                ↓
┌───────────────┐  ┌────────────────────────┐
│ OpenAI        │  │ Daytona                │
│ GPT-5.6 Sol   │  │ clean clone snapshot  │
└───────────────┘  └───────────┬────────────┘
                               │
                      ┌────────┼────────┐
                      ↓        ↓        ↓
                   fork A   fork B   fork C
                      │        │        │
                   repair   repair   repair
                      │        │        │
                   verify   verify   verify
                               │
                          winning fork
                               │
                               ↓
                        Daytona Preview
```

Optional persistence:

```text
Resurrection Orchestrator
          ↓
      Supabase
```

---

# 11. Core domain model

```ts
type RunStatus =
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

interface ResurrectionRun {
  id: string;
  repoUrl: string;
  repoOwner: string;
  repoName: string;

  status: RunStatus;

  sandboxId?: string;
  previewUrl?: string;
  previewPort?: number;

  detected?: ProjectProfile;

  attempts: ResurrectionAttempt[];

  startedAt: string;
  completedAt?: string;

  failureReason?: string;
}

interface ProjectProfile {
  language?: string;
  framework?: string;
  packageManager?: "npm" | "pnpm" | "yarn" | "bun" | "pip" | "poetry" | "unknown";
  runtime?: string;
  installCommand?: string;
  buildCommand?: string;
  startCommand?: string;
  likelyPorts: number[];
  evidence: string[];
}

interface ResurrectionAttempt {
  attemptNumber: number;
  action: string;
  command?: string;
  exitCode?: number;
  summary: string;
  changedFiles?: string[];
  timestamp: string;
}
```

---

# 12. Resurrection state machine

Use an explicit state machine rather than allowing the model to wander indefinitely.

```text
QUEUED
  ↓
CREATE_SANDBOX
  ↓
CLONE
  ↓
SNAPSHOT_CLEAN_STATE
  ↓
INSPECT
  ↓
PLAN
  ↓
BASELINE_INSTALL/START
  ↓
VERIFY
  ├──────────────────────── SUCCESS
  │
  └── failure
       ↓
   GENERATE_REPAIR_STRATEGIES
       ↓
     FORK S0 × N
       ↓
 PARALLEL_REPAIR_SEARCH
   ┌──────┼──────┐
   ↓      ↓      ↓
 fork A fork B fork C
   │      │      │
 verify verify verify
   └──────┼──────┘
          ↓
   SELECT_WINNER
      /       \
 success     none
    ↓          ↓
VISUAL_VERIFY  FAILED
(if GUI)
    ↓
 SUCCESS
```

Hard limits:

```text
parallel repair forks: 3 by default
max strategy generation rounds: 1
max command runtime: configurable, e.g. 120 seconds
max total wall-clock time: 8 minutes
```

Do not recursively fork failed repair forks in the MVP.

The clean snapshot `S0` is the canonical repair origin. Every strategy starts from `S0`.

---

# 13. Inspection strategy

Before calling the AI, gather deterministic evidence.

Inspect root and a limited set of high-value files.

Examples:

```text
package.json
package-lock.json
pnpm-lock.yaml
yarn.lock
bun.lockb

requirements.txt
pyproject.toml
Pipfile
poetry.lock

Dockerfile
docker-compose.yml
compose.yml

README.md
README

.nvmrc
.node-version
.python-version
.tool-versions

next.config.*
vite.config.*
webpack.config.*

vercel.json
Procfile

.env.example
.env.sample

src/
app/
pages/
```

Do not dump the entire repository into the model.

Generate a compact `RepoEvidence` object.

---

# 14. Deterministic project detection

Use code before AI wherever possible.

Examples:

## Node

If `package.json` exists:

- inspect `engines`
- inspect scripts
- inspect dependencies
- detect lockfile

Framework clues:

```text
next      → Next.js
vite      → Vite
react     → React
vue       → Vue
express   → Express
```

Start command priority:

```text
npm run dev
npm start
npm run start
```

respect actual scripts.

## Python

If:

```text
requirements.txt
pyproject.toml
Pipfile
```

then detect:

```text
fastapi
flask
streamlit
gradio
django
```

The model should refine ambiguous cases, not rediscover obvious facts.

---

# 15. AI agent contract

The model is an **environment reconstruction and minimal repair agent**.

System behavior:

```text
Your goal is to make the submitted repository run while preserving its
original behavior as much as possible.

Prefer reconstructing the expected environment over changing source code.

Never claim success yourself. The orchestrator independently verifies success.

You may:
- inspect files,
- execute commands inside the isolated sandbox,
- edit configuration,
- make minimal source changes when necessary.

You may not:
- access the host machine,
- access secrets not explicitly provided,
- make external destructive changes,
- perform broad modernization or refactoring.

When choosing an action, provide concise structured output.
```

Use structured outputs.

Example repair-plan schema:

```ts
interface RepairStrategy {
  id: string;
  title: string;
  hypothesis: string;
  invasiveness: "environment" | "dependency" | "source";
  actions: AgentAction[];
}

interface ParallelRepairPlan {
  diagnosis: string;
  strategies: [RepairStrategy, RepairStrategy, RepairStrategy];
}
```

Example action schema:

```ts
type AgentAction =
  | {
      type: "run_command";
      command: string;
      reason: string;
    }
  | {
      type: "write_file";
      path: string;
      content: string;
      reason: string;
    }
  | {
      type: "patch_file";
      path: string;
      patch: string;
      reason: string;
    }
  | {
      type: "inspect_file";
      path: string;
      reason: string;
    }
  | {
      type: "try_start";
      command: string;
      expectedPorts: number[];
      reason: string;
    }
  | {
      type: "give_up";
      reason: string;
    };
```

---

# 16. Tool surface

Expose the smallest possible tool surface.

## Sandbox lifecycle

```ts
createSandbox()
deleteSandbox()
```

## Files

```ts
listFiles(path)
readFile(path)
writeFile(path, content)
patchFile(path, patch)
```

## Process

```ts
runCommand(command, timeout)
startProcess(command)
getProcessOutput(...)
```

## Network / verification

```ts
checkPort(port)
httpCheck(port, path)
getPreviewUrl(port)
```

Do not expose arbitrary host tools.

---

# 17. Repair philosophy

Example:

Old React application fails because `node-sass` does not support current Node.

Bad repair:

```text
upgrade React
replace Sass stack
rewrite Webpack
migrate application
```

Preferred repair:

```text
detect expected Node generation
switch sandbox runtime / environment
retry
```

If environment reconstruction cannot solve it:

```text
minimal dependency/config patch
```

The UI should distinguish:

```text
ENVIRONMENT RECONSTRUCTED
```

from:

```text
CODE REPAIRED
```

This reinforces the preservation story.

---

# 18. Verification

Success is determined by the orchestrator.

## Minimum verification

For a web app:

1. start command remains alive,
2. one candidate port responds,
3. HTTP request returns an acceptable status.

Accept:

```text
200–399
```

Potential candidate ports:

```text
3000
3001
4173
5000
5173
8000
8080
8501
7860
```

Prefer extracting the actual port from process output when possible.

## Visual verification for GUI projects

If the selected demo repository has a visible GUI, add a second verification layer after HTTP/process verification.

Preferred behavior:

```text
process verification
      ↓
HTTP verification
      ↓
Computer Use / browser opens preview
      ↓
screenshot
      ↓
confirm meaningful UI rendered
```

Visual verification should answer:

> Did the application actually render something usable?

It should detect obvious false positives such as:

- blank white page,
- framework error overlay,
- server error screen,
- missing root application,
- visibly failed render.

For a web frontend, browser screenshot inspection is enough.

For a desktop GUI such as Tkinter, use Computer Use only if the execution environment exposes the GUI reliably.

### Conditional requirement

If the demo repo is:

- web GUI → **use visual verification if feasible**
- desktop GUI → use only if Daytona/Computer Use setup is already reliable
- CLI/API → **skip visual verification**

Do not add Computer Use merely to increase technical complexity.

For non-GUI projects, process/API assertions remain the correct verification method.

---

# 19. Preservation output

When successful, generate a reconstruction manifest:

```json
{
  "repository": "owner/repo",
  "commit": "abc123",
  "detectedFramework": "Next.js",
  "runtime": "Node 16",
  "packageManager": "npm",
  "installCommand": "npm ci",
  "startCommand": "npm run dev",
  "port": 3000,
  "repairs": [
    {
      "file": "...",
      "summary": "..."
    }
  ]
}
```

Call it something like:

```text
resurrection.json
```

For the MVP this can simply be stored in the database and shown in the UI.

If Daytona snapshot creation fits within the available time, optionally snapshot the successful environment.

---

# 20. UI specification

## Screen 1 — Hero

Headline concept:

```text
Bring software back to life.
```

Supporting copy:

```text
Paste a dormant GitHub project. We safely reconstruct its environment,
repair what is necessary, and turn it back into something you can experience.
```

Input:

```text
https://github.com/owner/repository
```

CTA:

```text
Resurrect project
```

A strong secondary statement:

> We preserve software as software — not screenshots and dead links.

---

## Screen 2 — Resurrection in progress

Main visual:

```text
RESURRECTING
```

Timeline:

```text
✓ Repository cloned
✓ Clean state snapshotted

✓ Detected React 16 + Webpack 4

✕ Baseline startup failed
  node-sass incompatible

✓ Generated 3 repair hypotheses

  A  Node 10 environment      ● running
  B  Legacy dependency mode   ● running
  C  Minimal Sass patch       ● running

  A  ✓ BOOTED
  B  ✕ failed
  C  ✕ failed

✓ Promoted repair A
● Verifying rendered application...
```

Do not show raw terminal spam by default.

Each event should be human-readable.

Expandable "technical logs" can show raw stdout/stderr.

---

## Screen 3 — Success

Hero status:

```text
PROJECT RESURRECTED
```

Summary:

```text
React 16
Node 10
npm 6

2 attempts
1 environment adjustment
0 source files modified
```

Then:

```text
[ Open live project ]
```

Prefer embedding the Daytona preview directly if embedding works reliably.

Otherwise open it in a new tab.

Below:

```text
What we reconstructed
What we repaired
Environment
Verification
```

---


# 20.1 Nice-to-have — execution trace / repair replay

This is **polish, not core MVP**.

If the core resurrection flow is stable, preserve a structured event trace for every attempt:

```ts
interface RepairTraceEvent {
  timestamp: string;
  forkId?: string;
  type:
    | "inspection"
    | "hypothesis"
    | "command"
    | "failure"
    | "patch"
    | "verification"
    | "winner";
  summary: string;
  diff?: string;
  reason?: string;
}
```

Use this to create a replayable **repair timeline**.

Example:

```text
00:00  repository cloned
00:06  clean snapshot created
00:13  baseline startup failed
00:18  three repair hypotheses created

FORK A
00:24  switched Node 22 → Node 10
00:41  dependency install succeeded
00:49  application booted

FORK B
00:24  enabled legacy peer dependency resolution
00:38  install failed

FORK C
00:25  patched deprecated Sass API
00:46  build failed elsewhere

00:52  fork A selected
00:58  visual verification passed
```

The replay should show:

- what was tried,
- why it was tried,
- what changed,
- which path won.

Do not build full video recording unless it comes essentially for free.

Structured traces + diffs are enough for the hackathon.

---

# 21. Visual identity

Avoid generic "AI gradient dashboard."

Direction:

```text
digital archive × museum exhibit × developer terminal
```

Possible motifs:

- archival accession numbers
- "last active" timestamp
- old repo metadata
- resurrection pulse/status
- timeline
- specimen-card treatment
- clean monochrome/off-white base
- restrained green only for successful revival if desired

The live project itself should provide most of the visual color.

---

# 22. API routes

Suggested MVP API:

```text
POST /api/runs
GET  /api/runs/:id
GET  /api/runs/:id/events
POST /api/runs/:id/cancel
```

### POST /api/runs

Input:

```json
{
  "repoUrl": "https://github.com/owner/repo"
}
```

Output:

```json
{
  "id": "run_..."
}
```

### GET /api/runs/:id

Output:

```json
{
  "id": "...",
  "status": "installing",
  "events": [...],
  "previewUrl": null
}
```

Polling every 1–2 seconds is sufficient for MVP.

Do not waste time implementing WebSockets unless already trivial.

---

# 23. Suggested folder structure

```text
app/
├── page.tsx
├── run/
│   └── [id]/
│       └── page.tsx
└── api/
    └── runs/
        ├── route.ts
        └── [id]/
            └── route.ts

components/
├── repo-input.tsx
├── resurrection-timeline.tsx
├── run-event.tsx
├── project-preview.tsx
└── resurrection-summary.tsx

lib/
├── daytona/
│   ├── client.ts
│   ├── sandbox.ts
│   └── preview.ts
├── openai/
│   ├── client.ts
│   ├── prompts.ts
│   └── schemas.ts
├── github/
│   ├── parse-url.ts
│   └── metadata.ts
├── resurrection/
│   ├── orchestrator.ts
│   ├── inspect.ts
│   ├── detect.ts
│   ├── install.ts
│   ├── start.ts
│   ├── diagnose.ts
│   ├── strategies.ts
│   ├── fork-repair.ts
│   ├── select-winner.ts
│   ├── verify.ts
│   ├── visual-verify.ts
│   └── types.ts
└── store/
    └── runs.ts
```

Keep files focused.

Do not introduce unnecessary architecture layers.

---

# 24. Environment variables

```bash
DAYTONA_API_KEY=
OPENAI_API_KEY=

# Optional
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GITHUB_TOKEN=
```

Never inject `OPENAI_API_KEY`, `DAYTONA_API_KEY`, or Supabase service keys into the submitted repository sandbox.

---

# 25. Safety controls

## Required

- public GitHub URLs only
- repository commands run only inside Daytona
- sandbox resource limits
- command timeouts
- total run timeout
- maximum repair count
- no arbitrary host shell
- sanitize URL parsing
- never interpolate untrusted user input directly into shell strings when avoidable
- do not expose system environment secrets
- destroy or stop sandbox after configured idle period

## Demo disclaimer

This is **safe isolation**, not a malware certification product.

Do not claim the platform can prove repositories are harmless.

The claim is:

> untrusted project execution is isolated from the application host.

---

# 26. Failure states

The product must fail gracefully.

Examples:

### Unsupported repository

```text
We couldn't identify a runnable application in this repository.
```

### Install failure after repair limit

```text
We reconstructed the likely environment, but the project still could not
be started after 3 repair attempts.
```

### Missing secrets

```text
The application requires environment variables that are not present.
```

### External service dependency

```text
The project starts, but requires an external database/service that could
not be reconstructed automatically.
```

Do not fabricate success.

---

# 27. Demo repository selection

This is critical.

Do not demonstrate on a random repo for the first time in front of judges.

Before judging:

1. find 3–5 visually interesting dormant public web projects,
2. test each through the full pipeline,
3. select one primary demo repo,
4. keep one backup repo,
5. pre-identify expected runtime characteristics.

Ideal demo repository:

- 3–7 years old
- web UI
- public
- no proprietary API key dependency
- no complex database
- currently has a dead deployment or no deployment
- recognizable visual result
- slightly outdated environment so the agent visibly does useful work
- resurrects in under ~2 minutes

---

# 28. Demo script

## 0–10 seconds

Show archived/dormant project:

```text
Last active: 2021
Live link: dead
Repository: still exists
```

Say:

> We archive software with screenshots and dead links, even though software is meant to be experienced.

## 10–20 seconds

Paste GitHub URL.

Click:

```text
Resurrect project
```

## 20–50 seconds

Show live timeline:

```text
Detected React 16
Created clean sandbox snapshot
Baseline launch failed

Trying 3 repairs in parallel:
A → historical Node runtime
B → legacy dependency resolution
C → minimal compatibility patch

A → BOOTED
B → failed
C → failed
```

Explain:

> The repository never runs on our server. We clone it into an isolated Daytona computer, snapshot the untouched project, then fork that exact state into several repair worlds and race different strategies. We keep only the one that actually boots.

## 50–70 seconds

Status changes:

```text
PROJECT RESURRECTED
```

If the demo project has a GUI, briefly show:

```text
HTTP verification     ✓
Visual render check   ✓
```

Click live preview.

The old application works.

## 70–90 seconds

Show preservation summary.

Close:

> Instead of preserving what software looked like, we preserve the ability to experience it.

---

# 29. Five-hour implementation plan

## Hour 0:00–0:30 — Skeleton

Build:

- Next.js project
- repo URL input
- run page
- Daytona connectivity test
- OpenAI connectivity test

Success condition:

```text
button → creates sandbox
```

Nothing else matters until this works.

---

## Hour 0:30–1:20 — Deterministic resurrection

Implement:

- clone
- clean snapshot immediately after clone
- file inspection
- Node project detection
- install
- start process
- port check
- Daytona preview URL

Target a known compatible repo.

Success condition:

```text
GitHub URL → live Daytona preview
```

No AI repair yet.

---

## Hour 1:20–2:25 — Parallel repair search

Implement:

- compact repo evidence
- baseline failure capture
- GPT-5.6 Sol repair-plan generation
- exactly 3 distinct repair strategies
- fork clean snapshot three ways
- concurrent execution
- independent verification per fork
- winner selection
- losing-fork cleanup

Success condition:

A deliberately outdated repo fails baseline startup, three strategies visibly race, and one fork successfully boots.

This is the most important technical feature after basic resurrection.

---

## Hour 2:25–3:00 — Product UI

Implement:

- human-readable timeline
- parallel repair race visualization
- project metadata
- success screen
- preview link/embed
- repair summary

---

## Hour 3:00–3:30 — Verification

Implement robust:

- process verification
- HTTP verification

If the demo repo has a visible GUI and browser verification is reliable:

- screenshot / Computer Use visual check

Otherwise skip visual verification.

---

## Hour 3:30–4:00 — Hardening

Test:

- invalid URL
- repo without package.json
- failed install
- command timeout
- missing env
- successful repo
- target dormant repo
- cleanup of losing forks

---

## Hour 4:00–4:30 — Demo polish

- choose exact demo repo
- shorten slow operations
- improve copy
- ensure parallel repair race reads clearly
- add structured repair trace/diff replay only if core is stable
- capture backup video/screenshots if allowed

---

## Hour 4:30–5:00 — Freeze

No major feature work.

Only:

- bug fixes
- demo rehearsal
- backup repo test
- pitch preparation

---

# 30. Agent implementation rules

When an AI coding agent receives this spec:

## Do

- inspect existing code before editing,
- implement the simplest working architecture,
- reuse existing dependencies,
- work end-to-end,
- run typecheck/lint after meaningful changes,
- fix errors introduced,
- prefer direct SDK/API usage,
- preserve clear module boundaries.

## Do not

- invoke heavyweight planning workflows,
- stop for minor implementation approval,
- add speculative abstraction,
- add features outside MVP,
- refactor unrelated code,
- introduce LangChain unless required by an actual blocker,
- introduce Kubernetes,
- build a separate microservice architecture,
- force Nosana into non-GPU workloads.

Priority:

```text
working resurrection
> reliable demo
> clear UI
> additional features
> architectural elegance
```

---

# 31. Success metrics for the MVP

The MVP is successful if:

```text
1. User pastes a public GitHub URL.
2. Repository is cloned into an isolated Daytona sandbox.
3. The clean post-clone state is snapshotted.
4. Stack/environment is identified.
5. Baseline startup is attempted.
6. If baseline fails, 3 distinct repair strategies run in parallel from identical forks.
7. At least one successful fork can be objectively selected and promoted.
8. The system independently verifies the application responds.
9. User receives a real live preview.
10. The product explains which repairs were attempted, which won, and what changed.
```

Conditional:

```text
11. If the demo repository has a GUI, visual verification confirms meaningful rendering.
```

Bonus:

```text
12. Successful environment is snapshot/preserved.
13. Repair trace can be replayed as a timeline.
```

---

# 32. Product expansion after the hackathon

Do not build these now, but the product can naturally expand into:

## Interactive software archive

A browsable gallery where historical/hackathon/open-source projects are revived on demand.

```text
project card
   ↓ click
warm/resurrect sandbox
   ↓
interactive software
```

## One-click project preservation

Developer submits a repo and receives a verified resurrection manifest/snapshot.

## Hackathon archive integration

Import projects from hackathon platforms and revive linked repositories.

## Agent benchmark

Use real dormant repositories as an objective coding-agent benchmark:

```text
Agent A → 68% resurrection success
Agent B → 81%
Agent C → 74%
```

Measure:

- successful startup
- time
- cost
- number of changes
- test preservation
- environment reconstruction quality

## Research-code preservation

Recover old ML/research repositories and route GPU-dependent workloads to GPU infrastructure such as Nosana.

## GitHub integration

```text
/resurrect
```

on an old repo could trigger automatic environment reconstruction.

---

# 33. Why Daytona is essential rather than decorative

Daytona provides the exact primitive needed:

> **A disposable, isolated, programmable computer where untrusted and potentially outdated software can safely be executed and modified.**

The product needs to repeatedly:

- create environments,
- execute arbitrary repo commands,
- snapshot a pristine repair origin,
- fork that state into parallel candidate environments,
- alter runtimes/dependencies independently,
- race repair hypotheses,
- start web servers,
- inspect results,
- expose previews,
- discard losing forks,
- optionally persist successful state.

That is the product's execution foundation.

---

# 34. Why Nosana is optional but strategically relevant

Some dormant software, especially older AI/research projects, requires:

- CUDA
- large model weights
- GPU inference
- GPU compilation
- ML workloads

Nosana can later become the GPU execution backend.

Potential future decision:

```text
repo
 ↓
analyze requirements
 ↓
CPU/web workload ─────→ Daytona
GPU workload ─────────→ Nosana
```

This is a credible extension.

It should not be built merely to mention Nosana.

---

# 35. Main product risk

The biggest risk is not technical.

It is scope.

"Run any GitHub repository" is impossible as a 5-hour promise because repositories may require:

- databases
- proprietary APIs
- secrets
- complex distributed services
- unavailable dependencies
- unsupported operating systems
- licensed software
- hardware

Therefore the MVP positioning should be:

> **Resurrect dormant web projects automatically.**

The broader vision can remain:

> **Preserve software as something people can still experience.**

---

# 36. Final pitch

## <20 second version

> We archive software with screenshots and dead links, even though software is meant to be experienced. **Project Resurrection safely brings dormant projects back to life** — it reconstructs a repo in isolation, forks multiple repair strategies in parallel if needed, verifies the winner actually works, and turns it back into a real interactive prototype.

## Short tagline options

```text
Bring software back to life.
```

```text
Software deserves more than a screenshot.
```

```text
Preserve software as software.
```

```text
Dead link. Live project.
```

---

# 37. Final decision

**BUILD candidate.**

Current rubric assessment:

| Dimension | Score |
|---|---:|
| MVP feasibility | 8/10 |
| Creativity | 9/10 |
| Product-market fit | 7/10 |
| Problem / gap | 8/10 |
| Demo potential | 10/10 |

The concept should be dropped or pivoted if testing shows that modern coding agents already turn arbitrary dormant repositories into verified, publicly interactive environments with negligible setup and no meaningful differentiation.

Until then, the strongest wedge is:

> **A living archive for software: safely resurrect dormant repositories into real interactive experiences.**
