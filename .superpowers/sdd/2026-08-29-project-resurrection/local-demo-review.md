# Local Demo Path Review

Status: APPROVED

Confidence: [CONFIRMED] by static source review; no runtime command, test, typecheck, lint, boot, network, installation, or git operation was performed.

## Load-bearing findings

- `getDemoRunService()` returns dependencies only when `PROJECT_RESURRECTION_DEMO_MODE` is exactly `"true"`; otherwise the exported POST handler receives no dependencies and returns the existing `503` before parsing or writing a run.
- In demo mode, POST creates the queued record, starts `StartRunJob` without awaiting it, and returns `{ id }` with `202`. The orchestrator, POST writer, and polling GET route use the same configured run directory; GET reads atomically renamed JSON snapshots and sends `Cache-Control: no-store`.
- The deterministic adapters supply Next.js/npm evidence and make create, clone, inspect, install, start, verify, and cleanup succeed without real repository, command, credential, or HTTP activity. With the 20 ms adapter delays, the normal baseline path should reach `success` well inside the UI's one-second poll interval.
- POST still passes the submitted URL through the existing public-HTTPS-GitHub parser before persisting or launching a job. The demo adapter never consumes that URL for external access.
- The adapters structurally satisfy the directly consumed TypeScript interfaces under the strict project configuration. Execution evidence remains unavailable by instruction.

## Review Notes

- Changed: added this read-only review record.
- Not changed: the existing focused ESLint result of 20 unused-parameter warnings, per controller ownership; it is not a demo-path correctness blocker.
- Limitation: this is static plausibility only. It does not establish Next runtime module/environment behavior or actual lifecycle timing.
- Human review: confirm the deployment operator sets `PROJECT_RESURRECTION_DEMO_MODE=true` only for the intended local demo process; the route composition is selected when the module is initialized.
