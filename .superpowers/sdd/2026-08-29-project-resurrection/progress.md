# SDD ledger — plan: docs/superpowers/plans/2026-08-29-project-resurrection.md

## Execution rulings

- Ruling: Work in the existing workspace without a git worktree — all git operations require explicit approval and none was given — cost if wrong: concurrent edits may conflict, so ownership must remain disjoint.
- Ruling: Do not boot the app, call live SDKs, run E2E, or execute per-task verification — the user explicitly deferred testing — cost if wrong: integration defects remain for the later verification session.
- Ruling: Do not install or alter package dependencies — package approval was not explicit — cost if wrong: SDK-backed adapters cannot be typechecked or completed beyond confirmed seams.
- Ruling: Do not implement frontend — the user explicitly assigned this session to backend — cost if wrong: API output will exist without the final live dashboard wiring.

## Preflight overlap scan

| Work packages | Shared interface/files | Ruling |
|---|---|---|
| Contracts/parser and store/API | `ResurrectionRun`, request schemas | Contracts land first; API consumes without renaming. |
| Store/API and orchestrator | `RunStore`, background job seam | Store owns persistence; orchestrator receives it by injection. |
| Orchestrator and Daytona adapter | `ComputeProvider` | Frozen provider contract isolates SDK code. |
| Orchestrator and OpenAI planner | `RepairPlanner`, `RepairPlan` | Planner makes one bounded call; orchestrator validates exactly three strategies. |
| Orchestrator and Nosana | `VisualProofVerifier` | Post-success GUI proof only; no repair control. |
| All packages and tests | Package manifest | Deferred because dependency modification/install requires approval. |

## Work log

- Foundation implementation: complete with concerns; static review pending. Report: `backend-foundation-report.md`.
- Foundation review: changes required — unconfigured accepted jobs and route error translation are load-bearing; fix round 1 dispatched.
- Ruling: Actual Zod schemas remain deferred until explicit package approval — a dependency-free validator is temporary, not plan-equivalent — cost if wrong: later schema replacement may require integration edits.
- Foundation fix round 1: 2 Important findings addressed; shared-store/composition root remains open.
- Ruling: Carry the exported-POST composition root and shared-store issue into the orchestrator/adapters integration package — the real dependencies do not exist yet, and pretending they do would reintroduce guaranteed-failure jobs — cost if wrong: the API stays 503 until the final backend wiring task.
- Orchestration review: one Critical deadline finding and six Important findings; fix round 1 dispatched.
- Ruling: Retain the successful run's stopped pristine seed until TTL instead of deleting it — the plan records Daytona parent/active-child lineage as a deletion constraint — cost if wrong: one stopped seed consumes quota for up to 15 minutes.
- Ruling: User replaced the full-provider objective with an isolated local demo path; real Daytona/OpenAI/Nosana adapters and remaining orchestration review findings are deferred — cost if wrong: demo behavior proves UI polling only, not real resurrection.
- Local demo implementation: complete; static review approved.
- Focused checks: demo/POST ESLint exit 0; focused production TypeScript exit 0; direct route smoke returned non-demo 503, unsafe URL 400, valid POST 202, and terminal success.
