# Story 2.1 Compose Structure & Autosave

As a creator-focused engineer,
I want the compose tray rebuilt with shadcn tabs, sections, and autosave logic,
so that drafting feels cohesive and resilient.

## Acceptance Criteria
1: Implement cast/coin mode toggle using shadcn Tabs with preserved field state per mode.
2: Refactor form layout into content, template, scheduling panels using migrated components.
3: Add autosave to IndexedDB and backend; show status (idle/saving/saved/error) via live-region friendly badge.
4: Provide optimistic UI with React Query, handling offline mode by queueing saves and replaying when connection restored.

## Integration Verification
- IV1: Cypress (or Playwright) test demonstrating autosave recovery after page refresh/offline period.
- IV2: Websocket/SSE not required yet; ensure no regressions in existing backend calls.
- IV3: Accessibility scan confirms focus order aligns with new layout.

## Notes
- Lean on `docs/user-journeys/journey-specifications.md` compose flow for required states.
- Emit analytics event `compose_autosave` with latency and status properties.
