# Epic 3: Template Studio

## Goal
Empower creators to manage reusable visual templates with live previews, safe zones, version control, and access controls that feed the compose tray.

## Outcome
- Full template CRUD with search, favorites, permissions, and audit trail.
- Template editor respects accessibility guardrails and render SLAs (<300ms preview).
- Compose tray and preview flows consume Template Studio outputs seamlessly.

## Stories
- Story 3.1 – `docs/prd/story-3-1-template-library-crud.md`
- Story 3.2 – `docs/prd/story-3-2-template-editor-safe-zones.md`
- Story 3.3 – `docs/prd/story-3-3-template-version-history.md`
- Story 3.4 – `docs/prd/story-3-4-template-permissions-audit.md`

## Dependencies
- Template APIs and render worker from backend.
- shadcn components from Epic 1.

## Acceptance
- QA checklist for Template Studio passes on device matrix.
- Render jobs meet latency targets and expose progress via WebSocket.
