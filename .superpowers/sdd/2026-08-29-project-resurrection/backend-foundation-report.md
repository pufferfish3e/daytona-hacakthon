# Backend Foundation Report

Status: DONE_WITH_CONCERNS

## Scope completed

- Added dependency-free strict runtime validators with `parse` and `safeParse` results.
- Published run, repair, API, and compute-provider contracts.
- Added safe public GitHub URL canonicalization.
- Added an atomic, per-run JSON file store with serialized updates and typed failures.
- Added queued-run creation and a background-job failure boundary.
- Added Node API polling routes for `POST /api/runs` and `GET /api/runs/[id]`.
- Added focused parser, store, and run-service tests without executing them.

## Files changed

- `src/lib/contracts/validation.ts`
- `src/lib/contracts/run.ts`
- `src/lib/contracts/api.ts`
- `src/lib/contracts/repair.ts`
- `src/lib/github/parse-url.ts`
- `src/lib/github/parse-url.test.ts`
- `src/lib/compute/provider.ts`
- `src/lib/store/run-store.ts`
- `src/lib/store/file-run-store.ts`
- `src/lib/store/file-run-store.test.ts`
- `src/lib/jobs/start-run.ts`
- `src/lib/jobs/start-run.test.ts`
- `src/app/api/runs/route.ts`
- `src/app/api/runs/[id]/route.ts`

## Concerns

- Verification was explicitly deferred; no tests, type checks, linters, builds, package installs, or application boot commands were run.
- Zod and Vitest are not declared project dependencies. The runtime validators intentionally provide compatible `safeParse` behavior without adding dependencies. The test files require Vitest once the owning integration lane adds the approved test tooling.
- The route uses an explicit unconfigured job seam. It persists a queued run and starts a background failure-handling job; the orchestration owner must replace that seam with the real orchestrator before the endpoint represents a usable resurrection service.
- API routes only enable when `DAYTONA_API_KEY` and `OPENAI_API_KEY` are present. No secret is returned or passed into a sandbox by this foundation.

## Review Notes

Changed only the assigned backend foundation paths and report; no package manifests, adapters, frontend files, documentation plan, or Git state were modified. Human review should verify TypeScript compatibility after the approved Vitest/Zod integration and replace the temporary orchestration seam.

## Round 1 fix report

Status: DONE

- Removed the always-throwing default job composition. The default `POST` now returns `503` before parsing, persisting, or starting work when no explicitly composed dependencies exist.
- Added `composeRunService`, a stateless dependency-injection seam accepting a store and real orchestrator. A later composition root can construct one `FileRunStore`, compose the job with its orchestrator, and pass the dependencies to `createPostRunHandler` without mutable module configuration.
- Kept `400` solely for malformed request bodies and `InvalidRepositoryUrlError`; unexpected create/store failures now log narrowed server-side detail and return a generic `500`.
- `GET` now returns `404` only for invalid IDs or a missing valid record; store/read faults log server-side and return a generic `500`.
- Reused one module-scoped `FileRunStore` for polling requests in the current Node process.

No test, typecheck, lint, build, install, boot, network, or Git command was run per the explicit verification deferral. The deferred Zod finding was intentionally not changed.
