# Remember

Remember brings dormant public GitHub applications back to life. Submit a repository, inspect its structure in an isolated environment, establish a clean baseline, repair the smallest viable set of issues, verify the running result, and return a preview that people can open.

The application is designed as a complete product with two execution modes:

- **Demo mode** is deterministic, local, credential-free, and suitable for rehearsals.
- **Live mode** uses Daytona for isolated execution and OpenAI for structured repair planning. Nosana visual proof is an optional post-verification capability for GUI projects.

The same API and frontend flow are used in both modes.

## Product workflow

1. The user submits a public HTTPS GitHub URL.
2. The server validates and canonicalizes the URL.
3. A run is persisted with a stable run ID.
4. A clean sandbox is created and the repository is cloned.
5. The project is inspected using bounded, high-value evidence collection.
6. The runtime profile identifies the language, framework, package manager, install command, start command, and likely ports.
7. The pristine seed is preserved before installation or startup.
8. The baseline is started and verified with process liveness plus HTTP readiness.
9. If the baseline fails, exactly three isolated repair candidates are created and evaluated in parallel.
10. Repair actions are bounded, ordered, and restricted to the repository workspace.
11. Successful candidates are ranked deterministically by preservation and runtime quality.
12. Losing resources are cleaned up, and the run is updated with events, attempts, evidence, and the selected preview.
13. For GUI projects, an optional Nosana visual-proof stage can classify one screenshot after objective verification.

## Architecture

The application is a Next.js App Router project. The server-side domain is intentionally separated from provider-specific SDKs.

```text
Browser
  │
  ├── POST /api/runs
  └── GET  /api/runs/:id  ← polling
       │
       ├── runtime composition
       │    ├── demo mode
       │    │    └── deterministic local adapters
       │    └── live mode
       │         ├── DaytonaProvider
       │         ├── OpenAIRepairPlanner
       │         └── optional Nosana visual proof
       │
       ├── FileRunStore
       └── ResurrectionOrchestrator
            ├── inspect and detect
            ├── baseline verification
            ├── parallel repair race
            ├── winner selection
            └── cleanup and reporting
```

### Core boundaries

- `src/lib/contracts/` contains the run, repair, API, and runtime validation contracts.
- `src/lib/resurrection/` contains orchestration, inspection, baseline execution, repair execution, verification, ranking, and cleanup.
- `src/lib/compute/provider.ts` is the provider-neutral sandbox interface.
- `src/lib/daytona/` translates the provider interface to the Daytona SDK.
- `src/lib/openai/` contains the structured repair-planning adapter.
- `src/lib/nosana/` contains the optional visual-proof/status adapter.
- `src/lib/store/` persists run state as atomically replaced JSON files.
- `src/lib/server/` selects demo or live composition from environment configuration.
- `src/remember-frontend/` contains the landing, progress, repair-race, preview, and result UI.

## Requirements

- Node.js compatible with the installed Next.js toolchain.
- npm.
- For live mode: Daytona and OpenAI credentials.
- For optional GUI visual proof: a configured Nosana visual-proof endpoint and API key.

No credential is required for demo mode.

## Installation

Install the locked project dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Never commit `.env`, API keys, wallet files, signed preview URLs, or provider tokens.

## Run the complete local demo

Use two terminals.

Terminal 1 — start the static resurrected preview app:

```bash
npm run demo:preview
```

Terminal 2 — start Next.js in deterministic demo mode:

```bash
PROJECT_RESURRECTION_DEMO_MODE=true npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Submit any valid public GitHub URL. Demo mode does not clone the URL, execute host commands, call a network service, or use credentials. It supplies deterministic repository evidence and drives the full visible lifecycle to success.

The demo preview is served at [http://localhost:3000/preview/live](http://localhost:3000/preview/live), proxied to the standalone preview server. Change `DEMO_PREVIEW_PORT` if port `5174` is unavailable.

## Runtime modes

### Demo mode

Set:

```dotenv
PROJECT_RESURRECTION_DEMO_MODE=true
```

Demo mode is the recommended path for local development, UI work, and a repeatable presentation. It is not evidence that a real repository was repaired.

### Live mode

Set demo mode to `false` or leave it unset, then provide the required server-only credentials:

```dotenv
DAYTONA_API_KEY=replace-me
OPENAI_API_KEY=replace-me
OPENAI_REPAIR_MODEL=gpt-5.6-sol
```

Optional Daytona configuration:

```dotenv
DAYTONA_API_URL=
DAYTONA_TARGET=
```

Live mode composes a `FileRunStore`, `DaytonaProvider`, `OpenAIRepairPlanner`, and the objective web verifier. If either required live key is missing, the API remains unavailable instead of guessing or falling back to external services.

### Nosana visual proof

Nosana is an optional post-verification stage for GUI projects. Configure the server-side integration only when its endpoint contract has been verified:

```dotenv
NOSANA_API_KEY=replace-me
NOSANA_MARKET=
NOSANA_VISUAL_ENDPOINT_URL=https://verified-nosana-endpoint.example/proof
```

The visual-proof adapter sends only the bounded screenshot reference required by the configured endpoint. It must never receive repository source, secrets, logs containing credentials, or signed preview tokens. If visual proof is unavailable, the core resurrection result remains distinct from the visual-proof result.

## Environment variables

| Variable | Purpose | Required |
|---|---|---|
| `PROJECT_RESURRECTION_DEMO_MODE` | Force deterministic local demo mode when `true` | Demo only |
| `PROJECT_RESURRECTION_RUN_DIR` | Directory for per-run JSON state | No; OS temp directory is used |
| `PROJECT_RESURRECTION_PREVIEW_URL` | Preview URL returned after success | No |
| `NEXT_PUBLIC_PROJECT_RESURRECTION_PREVIEW_URL` | Browser iframe preview target | No |
| `DEMO_PREVIEW_PORT` | Port for `demo-preview-server.mjs` | No; defaults to `5174` |
| `DAYTONA_API_KEY` | Daytona server credential | Live required |
| `DAYTONA_API_URL` | Optional Daytona API URL override | No |
| `DAYTONA_TARGET` | Optional Daytona target/region | No |
| `OPENAI_API_KEY` | OpenAI server credential for repair planning | Live required |
| `OPENAI_REPAIR_MODEL` | OpenAI model used for repair planning | No; defaults to `gpt-5.6-sol` |
| `NOSANA_API_KEY` | Nosana server credential | Visual proof only |
| `NOSANA_MARKET` | Optional Nosana market selection | Visual proof only |
| `NOSANA_VISUAL_ENDPOINT_URL` | Verified visual-proof endpoint | Visual proof only |
| `GITHUB_TOKEN` | Optional GitHub helper credential | No |

## API

### `POST /api/runs`

Creates a run and starts background processing.

Request:

```json
{
  "repoUrl": "https://github.com/owner/repository"
}
```

Responses:

- `202` — `{ "id": "run_<uuid>" }`
- `400` — malformed JSON, invalid fields, or unsupported repository URL
- `500` — unexpected server or persistence failure
- `503` — no valid runtime composition is configured

### `GET /api/runs/:id`

Returns the atomically persisted run snapshot.

Responses:

- `200` — run state and progress data
- `404` — invalid or unknown run ID
- `500` — persistence failure

The response is sent with `Cache-Control: no-store` because the frontend polls it while work progresses.

## Safety model

- Only public HTTPS GitHub repository URLs are accepted.
- Sandbox paths are resolved under the repository root and reject traversal, absolute paths, drive paths, and NUL bytes.
- Repository evidence is allowlisted and bounded by file and aggregate byte limits.
- Commands, writes, replacements, action counts, command lengths, and command timeouts are bounded.
- Repair work runs in isolated forks of a pristine seed.
- The browser receives run state and safe preview links, never provider credentials.
- OpenAI and Nosana adapters are server-only.
- External evidence URLs are accepted only when they pass the adapter’s HTTPS safety checks.
- Provider commands are submitted through `ComputeProvider`; the host is not used as the repository execution environment.

## Verification commands

Run the available project checks:

```bash
npm run lint
npm run build
```

For the deterministic route lifecycle, run:

```bash
node --experimental-loader ./.superpowers/sdd/2026-08-29-project-resurrection/ts-loader.mjs \
  ./.superpowers/sdd/2026-08-29-project-resurrection/demo-route-smoke.mjs
```

The smoke check exercises the unsafe-URL rejection, non-demo `503` boundary, demo `202` creation, polling, and terminal success path.

Before a live release, also run the focused tests, strict TypeScript checks, a browser smoke test, real Daytona cases, and independent cleanup verification. A passing local demo is not a substitute for those live checks.

## Troubleshooting

### The API returns `503`

Set `PROJECT_RESURRECTION_DEMO_MODE=true` for the local demo, or provide both `DAYTONA_API_KEY` and `OPENAI_API_KEY` for live mode. Restart the Next.js process after changing `.env`.

### The preview is unavailable

Start `npm run demo:preview`, confirm `DEMO_PREVIEW_PORT`, and ensure the Next.js rewrite points to the same port. A successful core run may intentionally have no preview URL.

### A run appears stuck

Inspect the JSON file under `PROJECT_RESURRECTION_RUN_DIR` or the OS temporary run directory. In live mode, check provider credentials, sandbox availability, process logs, and configured ports without printing secrets or signed URLs.

### Build fails on test imports

The test files use Vitest. Install the project’s approved test dependency before treating a typecheck failure from missing Vitest declarations as an application-runtime failure.

## Current delivery boundary

The local product flow is complete and repeatable in demo mode. The live provider boundaries are implemented behind explicit server-side configuration, while credentials-backed Daytona/OpenAI/Nosana execution, full integration coverage, and final independent cleanup/demo sign-off remain release gates rather than assumptions.

## License and contribution

Keep changes narrowly scoped to the owning layer. Preserve the provider interfaces, safety limits, API contract, and server-only secret boundary. Add focused tests for new behavior, run the relevant checks, and document any deferred live verification in the handoff before merging.
