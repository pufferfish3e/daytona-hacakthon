# Backend Foundation Static Review

## Verdict: CHANGES_REQUIRED

No Critical findings.

## Important findings

1. **The configured `POST /api/runs` path cannot start a resurrection.** `route.ts:15` always injects `createUnconfiguredRunDependencies`; its orchestrator at `start-run.ts:42` always throws. `StartRunJob` then persists `failed` (`start-run.ts:25-36`). Thus a `202` response merely creates a run that promptly fails, violating Task 2's polling-API and background-job acceptance criteria. Wire the route to the real orchestrator dependencies before treating this endpoint as complete; do not expose it behind valid credentials until then.

2. **Both routes misclassify host/store failures.** `POST` converts every `createRun` failure to a client-visible `400` (`route.ts:14-19`), including filesystem errors whose wrapped message can contain host paths (`file-run-store.ts:51-63`). `GET` converts every `RunStoreError`, including corrupt JSON and permission/I/O failures wrapped by `FileRunStore.get` (`file-run-store.ts:20-28`), into `404` (`[id]/route.ts:13-17`). Return `400` only for request/URL validation, `404` only for absent/invalid IDs, and a generic `500` for persistence faults while logging the original error server-side.

3. **The frozen Zod contract was replaced with independently maintained custom validators.** Tasks 1-2 explicitly require Zod schemas with inferred types, but `validation.ts:1-32` defines a non-Zod `RuntimeSchema`, while `run.ts:3-80` and `repair.ts:4-11` manually duplicate every domain type. This is not Zod-compatible at the integration boundary (notably error shape/API and schema operations), and it violates the plan's no-duplicated schema/type acceptance criterion. Once dependency approval is granted, replace this compatibility layer with actual Zod schemas and `z.infer` exports; do not describe the current layer as compatible.

## Minors

- `FileRunStore` serializes updates only per `FileRunStore` instance (`file-run-store.ts:11-48`). The current routes construct new instances, so a future second writer can lose updates despite the atomic rename. Keep a shared store per process or add inter-process locking if multiple writers are introduced.
- Focused tests cover only happy-path parser/store/service ordering; they do not statically demonstrate the error-status mapping or the intentionally failing route seam.

## Verification limitations

This was a read-only static review. Per the stated approval boundary, no test, typecheck, lint, build, install, boot, network, or Git command was run. Those deferred checks are not themselves implementation defects.

## Review Notes

Reviewed only the requested implementation paths, the Tasks 1-2 plan, and the supplied backend-foundation report. No implementation files, dependencies, CI, or Git state were changed. The safe GitHub URL boundary and same-instance atomic-write approach are directionally sound; the findings above prevent approval of the exposed foundation API.

---

# Round 1 Static Re-review

## Verdict: CHANGES_REQUIRED

No Critical findings.

## Prior-finding disposition

1. **Configured `POST` immediately starts an always-throwing job: ADDRESSED.** The default exported handler now returns `503` without persisting or launching a job when dependencies have not been composed (`src/app/api/runs/route.ts:7-8`), and `composeRunService` accepts a real orchestrator instead of constructing a throwing one (`src/lib/jobs/start-run.ts:40-47`).

2. **Route error translation: ADDRESSED.** `POST` returns request/URL validation failures as `400`, logs unexpected failures, and returns a generic `500` (`route.ts:9-18`). `GET` validates IDs before store access, returns `404` only for invalid/missing records, and returns a logged generic `500` for read faults (`src/app/api/runs/[id]/route.ts:11-23`).

3. **Shared-store minor: NOT_ADDRESSED.** `GET` reuses one module-scoped store (`[id]/route.ts:8-9`), but `FileRunStore` remains instance-local (`file-run-store.ts:11-48`) and the default `POST` has no writer composition. A future composed writer can still receive a distinct store instance and lose concurrent read-modify-write updates.

## Important breakage introduced or remaining in the fix

1. **The application’s exported `POST` endpoint is permanently unavailable.** `POST` is bound as `createPostRunHandler()` with no dependencies (`route.ts:21`), while the only composition helper is exported but never invoked by this route (`start-run.ts:40-47`). Consequently, the live route always returns `503`, even when the service is otherwise configured. Add an explicit server-side composition root that builds one shared store plus the real orchestrator and supplies it to the exported route handler; until then Task 2's `202` API acceptance criterion is unmet.

## Verification limitation

This was a read-only static re-review. No tests, typecheck, lint, build, install, boot, network, or Git command was run, as directed. The controller-deferred Zod finding was not re-adjudicated.

## Review Notes

Only the requested foundation files and the appended implementation report were inspected. No source implementation was changed; this review append is the sole write.
