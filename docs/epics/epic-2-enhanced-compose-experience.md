# Epic 2: Enhanced Compose Experience

## Goal
Deliver a production-ready compose tray that unifies drafting, template selection, scheduling, and coin toggles with offline resilience and real-time validation.

## Outcome
- Creators draft and schedule in <=45 seconds with autosave and conflict handling.
- Template previews, scheduling drawer, and ticker availability integrate seamlessly with backend APIs and WebSocket signals.
- Previews/success flows surface accurate chain, sponsorship, and coin data.

## Stories
- Story 2.1 – `docs/prd/story-2-1-compose-structure-autosave.md`
- Story 2.2 – `docs/prd/story-2-2-template-selector-bridge.md`
- Story 2.3 – `docs/prd/story-2-3-scheduling-drawer.md`
- Story 2.4 – `docs/prd/story-2-4-ticker-validation-feedback.md`
- Story 2.5 – `docs/prd/story-2-5-offline-draft-conflict.md`

## Dependencies
- Epic 1 components and accessibility infrastructure.
- Backend autosave endpoints, template APIs, ticker availability service.

## Acceptance
- Compose tray E2E tests green (autosave, preview, send, offline replay).
- Performance and accessibility budgets met.
