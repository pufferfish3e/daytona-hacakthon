# Graph Report - daytona  (2026-08-29)

## Corpus Check
- 63 files · ~415,639 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 523 nodes · 1189 edges · 26 communities (18 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24

## God Nodes (most connected - your core abstractions)
1. `SandboxRef` - 55 edges
2. `ComputeProvider` - 38 edges
3. `ResurrectionRun` - 27 edges
4. `RunReporter` - 25 edges
5. `ProcessRef` - 19 edges
6. `ResurrectionOrchestrator` - 19 edges
7. `ActionProvider` - 18 edges
8. `VerificationProvider` - 18 edges
9. `requireString()` - 17 edges
10. `BaselineProvider` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Editorial landing-page concept` --conceptually_related_to--> `Project Resurrection`  [INFERRED]
  public/project-resurrection-layout-d-landing-editorial.png → project-resurrection-spec.md
- `Repair-race UI` --conceptually_related_to--> `Parallel forked repair search`  [INFERRED]
  public/project-resurrection-layout-b-repair-race.png → project-resurrection-spec.md
- `Project-detail UI` --conceptually_related_to--> `Parallel forked repair search`  [INFERRED]
  public/project-resurrection-layout-e-project-detail.png → project-resurrection-spec.md
- `Success-state UI` --conceptually_related_to--> `Objective verification`  [INFERRED]
  public/project-resurrection-layout-c-success.png → project-resurrection-spec.md
- `No-preview failure UI` --conceptually_related_to--> `Objective verification`  [INFERRED]
  public/project-resurrection-layout-f-no-preview.png → project-resurrection-spec.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Backend runtime composition** — docs_superpowers_plans_2026_08_29_project_resurrection_run_api, docs_superpowers_plans_2026_08_29_project_resurrection_file_run_store, docs_superpowers_plans_2026_08_29_project_resurrection_deterministic_orchestrator [EXTRACTED 1.00]
- **Parallel repair lifecycle** — project_resurrection_spec_isolated_daytona_sandbox, project_resurrection_spec_parallel_forked_repair_search, project_resurrection_spec_objective_verification [EXTRACTED 1.00]

## Communities (26 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (26): GET(), RUN_STORE, createPostRunHandler(), logRouteFailure(), parseRequestBody(), POST, CreateRunRequestSchema, createQueuedRun() (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (40): failure(), installBaseline(), runBaseline(), startAndVerify(), verifyBaseline(), assertBeforeDeadline(), errorMessage(), RepairExecutorError (+32 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (39): CreateRunRequest, CreateRunResponse, CreateRunResponseSchema, RunResponseSchema, validateCreateRunRequest(), validateCreateRunResponse(), INVASIVENESS, RepairAction (+31 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (23): ComputeProvider, RepairPlan, ProjectProfile, ResurrectionManifest, RunStatus, BaselineFailure, BaselineInput, BaselineResult (+15 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (26): RepairStrategy, Invasiveness, ResurrectionAttempt, AllocatedRepair, allocateForks(), AttemptOutcome, attemptResult(), cleanupRepairs() (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (32): eslint, eslint-config-next, next, dependencies, next, react, react-dom, devDependencies (+24 more)

### Community 6 - "Community 6"
Cohesion: 0.16
Nodes (4): RunEvent, requiredSeed(), ResurrectionOrchestrator, RunReporter

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (20): detectNode(), detectProject(), detectPython(), EMPTY_MANIFEST, hasPythonEvidence(), isRecord(), nodeEvidence(), nodeFramework() (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (4): ProcessLogs, processRef, sandbox, VerificationProvider

### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (17): assertSafePath(), isEmptySegment(), normalizeSegments(), resolveRepositoryPath(), UnsafeSandboxPathError, CollectEvidenceInput, collectRepoEvidence(), encoder (+9 more)

### Community 11 - "Community 11"
Cohesion: 0.19
Nodes (4): SandboxRef, SnapshotRef, RunResources, OrchestratorProvider

### Community 12 - "Community 12"
Cohesion: 0.16
Nodes (14): Project Resurrection Implementation Plan, Isolated Daytona sandbox, Minimal repair, Nosana visual proof, Objective verification, OpenAI Responses API, Parallel forked repair search, Project Resurrection (+6 more)

### Community 13 - "Community 13"
Cohesion: 0.24
Nodes (7): CloneInput, CloneResult, CreateSeedInput, ProcessRef, StartProcessInput, profile, VerificationInput

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (13): ComputeProvider, Deterministic orchestrator, FileRunStore, Repair planner, Run API, VisualProofVerifier, Backend adapters, Backend foundation (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (3): ProcessState, reporter, strategies

### Community 21 - "Community 21"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

## Knowledge Gaps
- **91 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+86 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ComputeProvider` connect `Community 3` to `Community 1`, `Community 4`, `Community 9`, `Community 10`, `Community 11`, `Community 13`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 19`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `SandboxRef` connect `Community 11` to `Community 1`, `Community 3`, `Community 4`, `Community 6`, `Community 9`, `Community 10`, `Community 13`, `Community 15`, `Community 16`, `Community 17`, `Community 18`, `Community 19`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `ResurrectionRun` connect `Community 0` to `Community 2`, `Community 3`, `Community 13`, `Community 6`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _91 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06656426011264721 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08673469387755102 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1072463768115942 - nodes in this community are weakly interconnected._