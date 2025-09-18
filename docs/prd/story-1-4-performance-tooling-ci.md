# Story 1.4 Performance Tooling & CI Guardrails

As a performance engineer,
I want automated telemetry and CI gates in place,
so that regressions in bundle size, Lighthouse metrics, or vitals are caught immediately.

## Acceptance Criteria
1: Add bundle analyzer script with budget thresholds for main/page chunks (document targets per design doc).
2: Integrate Lighthouse CI (or equivalent) for create/queue routes with TTI <3s mobile budget and guard-rail thresholds.
3: Configure Web Vitals logging (CLS, LCP, INP) with reporting hooks to analytics pipeline.
4: Document runbooks in `docs/` covering how to investigate and remediate budget breaches.

## Integration Verification
- IV1: CI pipeline shows new jobs (bundle, Lighthouse) and fails when budgets breached (tested with intentional regression and rollback).
- IV2: Production build artifacts include updated analysis reports stored in repo or artifact store.
- IV3: Analytics dashboard entry created (even placeholder) to receive Web Vitals events.

## Notes
- Coordinate with analytics team on event schema and PostHog/Segment ingestion.
- Ensure budgets map to device matrix defined in comprehensive design doc.
