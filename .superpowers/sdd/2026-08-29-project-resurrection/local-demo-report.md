# Local Demo Path Report

Status: DONE_WITH_CONCERNS

## Scope completed

- Added an isolated `src/lib/demo/` composition root gated by `PROJECT_RESURRECTION_DEMO_MODE=true`.
- The composed service uses one `FileRunStore` instance for POST creation and the background `StartRunJob`/`ResurrectionOrchestrator`.
- Added deterministic fake `ComputeProvider`, `RepairPlanner`, and `WebVerifier` implementations that make the existing baseline path progress through queued, sandbox creation, cloning, inspection, installation, startup, verification, and success.
- The fake repository supplies bounded `package.json` and `package-lock.json` evidence for a Next.js npm project; it does not clone, execute a host command, call a network service, or access credentials.
- Updated only `POST /api/runs` to use the demo composition root. Non-demo mode still returns the existing 503 response.
- Added focused route and demo-adapter tests without changing test configuration or package manifests.

## Verification boundary

- No tests, build, typecheck, lint, boot, network operation, package installation, or git command was run, per controller instruction.
- TDD RED/GREEN execution evidence is therefore intentionally unavailable.

## Concerns for controller review

- The existing GET route was intentionally untouched. It separately constructs a `FileRunStore` for the same configured run directory, so polling reads the JSON files written by the demo root but does not share the same JavaScript object instance.
- The fake planner is deliberately unreachable on the normal demo success path; it exists only to satisfy the orchestrator dependency contract if an unexpected baseline failure occurs.

## Focused correction

- Eliminated unused-parameter warnings in the demo adapters with explicit `void` uses and added the required `type: "try_start"` discriminant to each fallback repair action.
- No commands were run for this correction, per controller instruction.
- Normalized `CreateRunRequestSchema.safeParse` validation failures through `errorMessage`, preserving the route's 400 response with a string-safe error payload.
