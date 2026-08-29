# Backend adapters implementation brief

Implement the non-live backend integration layer from Tasks 3, 6, and 10.

## Owned paths

- `src/lib/daytona/**` except existing `path-policy.ts`
- `src/lib/openai/**`
- `src/lib/nosana/**`
- Tests in those paths
- `src/lib/server/runtime.ts`
- `src/app/api/runs/route.ts` only for final composition

## Required behavior

1. Daytona provider translates the frozen `ComputeProvider` contract through a narrow typed facade and adds resource/TTL/secret-free configuration.
2. OpenAI repair planner makes exactly one structured request through an injected typed Responses facade and validates exactly three strategies using the existing runtime schema.
3. Nosana visual proof uses an injected client seam and maps `meaningful_ui` to passed, blank/error to failed, and faults to unavailable; it never affects repair selection.
4. A server runtime composition root owns one shared `FileRunStore`, creates the real orchestrator dependencies, and supplies the exported POST route.

## Current blocker

External packages are not approved or installed. Do not invent imports/signatures. Implement application-owned facades and concrete composition only where existing types make it honest. If a truly concrete SDK adapter cannot be written, leave one explicit typed `ServiceNotConfiguredError` boundary and report the exact package/signature blocker.

## Constraints

- No install, boot, network, live SDK, tests, typecheck, build, git, frontend, or subagents.
- Never leak host secrets into a sandbox/client response.
- Use apply_patch only.

