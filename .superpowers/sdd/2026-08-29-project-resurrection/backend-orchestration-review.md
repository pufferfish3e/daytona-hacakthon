# Backend Orchestration Review

Verdict: CHANGES_REQUIRED

Confidence: [CONFIRMED] by static inspection of the authorized files only. Tests, typecheck, lint, build, boot, network, package, and Git operations were not run.

## Critical findings

### C-01 — The eight-minute total deadline is not enforced

`orchestrator.ts:65-69,88-97,137-143`, `baseline.ts:34,62`, `fork-repair.ts:53,71-73,100-101`, and `verify.ts:44-47,68-71` await provider or planner promises without a deadline race or cancellation mechanism. Only `runCommand` receives a bounded timeout and the default HTTP fetch gets an abort timeout. A stalled seed creation, clone, snapshot, evidence read, fork, planner, process start, process lookup, log read, preview URL lookup, or cleanup can therefore exceed eight minutes indefinitely and prevent explicit failure/cleanup. This violates the hard bounded-time MVP requirement.

## Important findings

### I-01 — Winner ranking uses inaccurate preservation metrics

`fork-repair.ts:110-131` starts timing before all repair actions, so `bootDurationMs` includes command and file-edit time rather than process boot-to-verification time. `execute-actions.ts:49-63` records only `write_file` and `replace_text` paths; a `run_command` may change any number of files while reporting zero changed files. Invasiveness is also accepted from planner metadata without checking it against the actions. The sort in `select-winner.ts:18-22` is deterministic, but its inputs do not reliably represent the required changed-file and boot-time criteria.

### I-02 — HTTP verification is a one-shot readiness check

`verify.ts:54-63` probes each candidate port once with no bounded retry or readiness interval. A healthy process that is alive but still booting can fail immediately on connection refusal or HTTP 503, sending the run into unnecessary repairs or final failure. Add a deadline-bounded retry policy while preserving the pre- and post-probe liveness checks.

### I-03 — Successful cleanup retains the pristine seed

`orchestrator.ts:168-177` deletes the baseline loser and snapshot but only calls `stop(seed)` for the seed; failure cleanup deletes the same seed at `orchestrator.ts:179-186`. The successful path therefore leaves an unnecessary cloud resource until provider TTL behavior removes it. Delete the seed after all forks are allocated, or document and test why stopped retention is required.

### I-04 — Evidence collection does not guarantee its byte bound

`inspect.ts:43-46` reads the entire file before truncating it. `inspect.ts:54-55` permits files whose provider omits `sizeBytes`, and `ComputeProvider.readTextFile` has no range/maximum argument. A large unknown-size file can therefore consume unbounded transfer and memory despite the 32 KiB/128 KiB claim. Skip unknown-size files or extend the provider seam with a bounded read.

### I-05 — One focused test is not strict-TypeScript plausible

`select-winner.test.ts:8-16` declares a `SuccessfulRepair` but its `verification` object omits required `processAlive: true` from `VerifiedWebProcess` (`verify.ts:24-30`). A strict typecheck should reject this test.

### I-06 — Planner contract and executor action limits disagree

The frozen `RepairPlanSchema` accepts up to eight actions per strategy (`src/lib/contracts/repair.ts:27-34`), while `execute-actions.ts:99-104` rejects more than six. A plan that passes the application contract can allocate all three forks and then fail only at execution. Enforce the six-action constraint before allocation or align the shared contract in its owning lane.

## Minor findings

- `baseline.ts:69-85` discards process logs gathered by the verifier, leaving start/HTTP failures with empty diagnostic stdout/stderr for the repair planner.
- `inspect.ts:58-61` includes directory entries in `rootFiles`; a directory named like a lockfile can affect package-manager detection.
- No host process execution, direct secret access, SDK import, `any`, or TypeScript suppression directive was found in the authorized production paths. Repository commands are submitted through `ComputeProvider`; the injected planner remains a trusted command-authority boundary because arbitrary shell command strings are accepted.

## Review Notes

- Reviewed the orchestration brief/report, provider, run/repair contracts, run store, `src/lib/resurrection/**`, and `src/lib/daytona/path-policy*`.
- Added only this review report; no source or test file was changed.
- Objective liveness-plus-HTTP checks, baseline-child isolation, exactly three concurrent seed forks via `Promise.allSettled`, deterministic tuple sorting, lexical path rejection, and loser deletion attempts are present.
- Human review must resolve C-01 and the Important findings, then run the deferred focused tests and strict typecheck before approval.

## Round 1 Static Re-review

Verdict: CHANGES_REQUIRED

Confidence: [CONFIRMED] by current static source inspection only. No tests, typecheck, lint, build, install, boot, network, package, or Git operation was run.

### Finding dispositions

- **C-01: NOT_ADDRESSED.** Provider and planner operations are now raced by `withDeadline`, but the total workflow remains unbounded on `RunStore`/reporter awaits (`orchestrator.ts:49,67,73,91,98,103,130,138,143,150,166,170,172,211`; `fork-repair.ts:55,94,114,135,141,162`; `run-reporter.ts:27-36,99-103`). In addition, when an operation consumes the deadline, `safeCleanup` reuses that expired deadline (`orchestrator.ts:197-205`), so known sandboxes and snapshots are not even submitted for cleanup. The fix bounds many external waits but does not enforce an eight-minute end-to-end result with cleanup.
- **I-01: NOT_ADDRESSED.** Boot timing and ordinary changed-file measurement are improved, but invasiveness remains bypassable: `invasiveness.ts:47-51` classifies only a command prefix, so `npm install && <source mutation>` remains `dependency` and outranks a truthful `source` repair. The same unrestricted command can change or commit Git state before the status measurement at `execute-actions.ts:27,98-119`, making the reported changed-file set non-authoritative. Reject shell chaining for specially classified commands or derive preservation metrics from an immutable seed-side comparison.
- **I-02: ADDRESSED.** `verify.ts:66-124` performs four deadline-bounded readiness attempts per port and preserves pre/post-probe process-liveness checks, including after HTTP probe failure.
- **I-04: ADDRESSED.** `inspect.ts:56-61` excludes unknown-size and oversized evidence files before calling `readTextFile`.
- **I-05: ADDRESSED.** `select-winner.test.ts:8-16` now supplies `processAlive: true` for `VerifiedWebProcess`.
- **I-06: ADDRESSED.** `fork-repair.ts:50-57` validates all three strategies against the six-action executor limit before attempts are queued or fork promises are created.
- **Minor logs: ADDRESSED.** `verify.ts:22-30,52-60,145-147` retains logs, and `baseline.ts:73-99` transfers them into verification failures.
- **Minor directories: ADDRESSED.** `inspect.ts:63-67` removes directory entries before constructing `rootFiles`.

I-03 was excluded from re-adjudication under the controller ruling. No separate Critical or Important regression beyond the unresolved C-01 and I-01 issues was found in this fix round.

## Review Notes

- Appended only this Round 1 re-review; no source or test file was changed.
- Current source was reviewed after the appended implementation report.
- Deferred execution evidence remains required after the two unresolved findings are repaired.
