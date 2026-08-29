# Backend orchestration implementation brief

Implement the dependency-free core of Tasks 3, 4, 6, and 7 from `docs/superpowers/plans/2026-08-29-project-resurrection.md`.

## Owned paths

- `src/lib/resurrection/**`
- `src/lib/daytona/path-policy.ts` and its test only
- Tests within those paths

Do not modify contracts, compute provider, store, jobs, API routes, package files, frontend, SDK adapters, docs, or git state.

## Required MVP

1. Repository path confinement.
2. Bounded evidence collection and deterministic Node/Python project detection.
3. Process-plus-HTTP verification through `ComputeProvider`.
4. Baseline flow that installs/starts only on a baseline child fork.
5. Deterministic bounded repair-action executor.
6. Exactly three concurrent repair forks from the pristine seed via `Promise.allSettled`.
7. Deterministic winner ranking: environment, config, dependency, source; then changed files; boot time; strategy ID.
8. Cleanup of losing/failed forks and explicit failure results.
9. Orchestrator state machine using injected `RunStore`, `ComputeProvider`, `RepairPlanner`, verifier, and clock.

## Execution constraints

- Do not boot, install, call a network, run tests, or run git.
- Write focused tests but leave them unexecuted for the later verification session.
- Use strict TypeScript, no `any`, maximum 40-line functions, typed errors, and no swallowed failures.
- Submitted repository commands execute only through `ComputeProvider`.
- Keep all timeouts bounded by 120 seconds per command and 8 minutes total.
- No OpenAI or Nosana SDK imports; define application seams only.
- Use `apply_patch` for edits.

