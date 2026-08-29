# Backend Orchestration Report

Status: DONE_WITH_CONCERNS

Confidence: [CONFIRMED] by static source inspection only; execution verification was explicitly deferred.

## Scope completed

- Added repository-relative path confinement with traversal, absolute-path, drive-path, and NUL rejection.
- Added bounded depth-two evidence collection using a fixed high-value allowlist, 32 KiB per-file cap, and 128 KiB aggregate cap.
- Added deterministic Node and Python profile detection without AI or SDK dependencies.
- Added process-plus-HTTP verification that checks process liveness before and after an HTTP 200-399 response.
- Added a baseline flow that forks the pristine seed before installation or startup.
- Added a deterministic executor capped at six ordered actions, 64 KiB file writes, 2,000-character commands, 120-second commands, exact single replacements, and one final `try_start`.
- Added exactly three concurrent pristine-seed fork allocations through `Promise.allSettled` and concurrent isolated repair execution.
- Added deterministic winner ranking by environment, config, dependency, source, changed-file count, boot time, and strategy ID.
- Added cleanup for losing and failed repairs, baseline children, snapshots, and seeds with explicit cleanup events and narrowed logging.
- Added an injected state-machine orchestrator over `RunStore`, `ComputeProvider`, `RepairPlanner`, `WebVerifier`, and clock seams.
- Added focused unexecuted tests for confinement, detection, baseline isolation, action execution, verification, ranking, three-fork concurrency, cleanup, and baseline orchestration.

## Files changed

- `src/lib/daytona/path-policy.ts`
- `src/lib/daytona/path-policy.test.ts`
- `src/lib/resurrection/limits.ts`
- `src/lib/resurrection/errors.ts`
- `src/lib/resurrection/inspect.ts`
- `src/lib/resurrection/detect.ts`
- `src/lib/resurrection/detect.test.ts`
- `src/lib/resurrection/verify.ts`
- `src/lib/resurrection/verify.test.ts`
- `src/lib/resurrection/baseline.ts`
- `src/lib/resurrection/baseline.test.ts`
- `src/lib/resurrection/repair-planner.ts`
- `src/lib/resurrection/execute-actions.ts`
- `src/lib/resurrection/execute-actions.test.ts`
- `src/lib/resurrection/select-winner.ts`
- `src/lib/resurrection/select-winner.test.ts`
- `src/lib/resurrection/fork-repair.ts`
- `src/lib/resurrection/fork-repair.test.ts`
- `src/lib/resurrection/run-reporter.ts`
- `src/lib/resurrection/orchestrator.ts`
- `src/lib/resurrection/orchestrator.test.ts`
- `.superpowers/sdd/2026-08-29-project-resurrection/backend-orchestration-report.md`

## Static acceptance evidence

- [CONFIRMED] All submitted repository commands call `ComputeProvider.runCommand` or `ComputeProvider.startProcess`; none execute on the host.
- [CONFIRMED] Repair allocations are exactly the three tuple strategies and all call `provider.fork(seed, ...)` in one `Promise.allSettled`.
- [CONFIRMED] Baseline installation and startup receive only the returned baseline child reference, never the seed.
- [CONFIRMED] Only verifier-confirmed live process plus HTTP 200-399 outcomes enter winner selection.
- [CONFIRMED] Ranking is stable and does not mutate its input.
- [CONFIRMED] No OpenAI, Nosana, Daytona SDK, package, network-client, or other third-party import was added.
- [CONFIRMED] Static searches found no `any`, TypeScript suppression directive, TODO, or placeholder in the owned production paths.

## Concerns and deferred verification

- Tests, typecheck, lint, build, boot, installs, Git operations, and network calls were not run by explicit instruction; no RED/GREEN execution evidence exists.
- Vitest is not currently declared in `package.json`, so the focused test files require the package-owning lane to add the approved harness before execution.
- [UNCERTAIN] The frozen `ComputeProvider` and `RepairPlanner` interfaces expose no abort signal for fork, planning, or asynchronous process-start calls. The implementation prevents new actions after the eight-minute deadline and bounds commands/HTTP probes, but cannot forcibly cancel an already in-flight provider or planner promise.
- [UNCERTAIN] `readTextFile` has no byte-range parameter. Evidence retained by orchestration is bounded, and files with declared sizes over 32 KiB are skipped, but a provider that omits `sizeBytes` may still transfer a larger file before truncation.
- [UNCERTAIN] The Daytona adapter was not present during this lane. Integration must confirm whether listed paths are repository-relative or destination-prefixed and that `writeTextFile` accepts the already-confined full repository path.
- The application route composition remains outside this lane; the previously reported always-503 exported `POST` route must be wired by its owner before the orchestrator is reachable.

## Recommended AGENTS.md rule proposals

1. Require long-running application seams to accept a shared deadline or abort signal when a total workflow timeout is an acceptance criterion.
2. Require file-provider read contracts to support byte ranges or maximum-byte arguments when evidence collection promises hard input bounds.
3. Require the composition-root owner to publish the concrete constructor/wiring point before parallel implementation lanes begin.

Awaiting approval before any AGENTS.md changes are made.

## Review Notes

Changed only the assigned orchestration, verification, path-policy, focused-test, and report paths. Intentionally did not modify packages, frontend, shared contracts, stores, jobs, API routes, adapters, SDK integrations, CI, docs, or Git state. Human review must run the deferred scoped tests and strict TypeScript/lint checks, then integrate the real provider and route composition before merge.

## Round 1 Fix Report

Status: DONE

Confidence: [CONFIRMED] by static source inspection; execution remains explicitly deferred.

### Finding dispositions

- C-01: Added reusable `withDeadline` promise racing and applied it to every provider, planner, verifier, executor, HTTP probe, readiness wait, and cleanup operation. A late external promise cannot block orchestration beyond the shared deadline; cleanup timeouts are logged and emitted.
- I-01: Changed-file counts now come from a fixed 30-second, 64-KiB-capped in-sandbox `git status --porcelain=v1 -z` command after repair actions. Boot duration now begins after `startProcess` returns and ends immediately after successful verification. Planner invasiveness is conservatively raised from command/path-derived evidence before attempts are queued and is independently re-derived during winner comparison.
- I-02: Added four deadline-bounded readiness attempts per candidate port with a 250 ms interval. Every attempt checks process liveness before and after HTTP probing.
- I-03: Per controller ruling, no change was made to delete the seed on success. The successful path retains the plan-required `stop(seed)` behavior because Daytona fork lineage may require the stopped parent while the winning child remains active.
- I-04: Evidence files without `sizeBytes` are no longer read; files over 32 KiB remain skipped.
- I-05: Added the required `processAlive: true` field to the strict `SuccessfulRepair` test fixture.
- I-06: One-to-six action validation now runs for all three strategies before attempts are persisted or any fork promise is created.
- Minor logs: Verification results retain collected stdout/stderr, and baseline verification failures pass those logs to the repair planner.
- Minor directories: `rootFiles` now excludes directory entries before package-manager and entrypoint detection.

### Additional focused tests added or strengthened

- Added deadline tests proving expired operations do not start and hanging promises settle at the deadline.
- Added evidence tests proving unknown-size files are not read and directory names do not enter root evidence.
- Added readiness retry coverage.
- Added pre-allocation rejection coverage for seven-action strategies.
- Added boot-duration boundary coverage and misleading-invasiveness ranking coverage.
- Added baseline failure-log preservation coverage.
- Existing successful orchestration coverage continues to require `stop:seed` and contains no successful-path seed deletion.

### Files added in Round 1

- `src/lib/resurrection/deadline.ts`
- `src/lib/resurrection/deadline.test.ts`
- `src/lib/resurrection/invasiveness.ts`
- `src/lib/resurrection/inspect.test.ts`

### Files modified in Round 1

- `src/lib/resurrection/errors.ts`
- `src/lib/resurrection/limits.ts`
- `src/lib/resurrection/inspect.ts`
- `src/lib/resurrection/verify.ts`
- `src/lib/resurrection/verify.test.ts`
- `src/lib/resurrection/baseline.ts`
- `src/lib/resurrection/baseline.test.ts`
- `src/lib/resurrection/execute-actions.ts`
- `src/lib/resurrection/execute-actions.test.ts`
- `src/lib/resurrection/fork-repair.ts`
- `src/lib/resurrection/fork-repair.test.ts`
- `src/lib/resurrection/select-winner.ts`
- `src/lib/resurrection/select-winner.test.ts`
- `src/lib/resurrection/orchestrator.ts`
- `.superpowers/sdd/2026-08-29-project-resurrection/backend-orchestration-report.md`

### Verification limitation

No test, typecheck, lint, build, boot, install, network, package, or Git command was run, exactly as directed. `withDeadline` bounds what orchestration awaits but cannot cancel the underlying SDK promise because the frozen provider interface has no abort parameter; late provider completion therefore relies on the configured sandbox TTL for resource safety.

## Review Notes

Round 1 changed only the assigned Daytona path policy, resurrection source/tests, and this report. Packages, contracts, API/routes, jobs, store, frontend, SDK adapters, CI, documentation, and Git state remain untouched. The stopped pristine seed is intentionally retained on success under the controller ruling.
