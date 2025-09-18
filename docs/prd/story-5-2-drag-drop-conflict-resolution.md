# Story 5.2 Drag & Drop with Conflict Resolution

As a planner,
I want to drag posts between slots with immediate feedback,
so that I can resolve conflicts quickly.

## Acceptance Criteria
1: Implement drag/drop using `@dnd-kit/core` with collision detection, keyboard handles, and accessible announcements.
2: Detect conflicts (overlapping slots, expired windows) and surface inline warnings with resolution CTA (reschedule, auto-queue).
3: Persist changes via bulk schedule API with optimistic updates and rollback on failure.
4: Support undo/redo for recent moves within session.

## Integration Verification
- IV1: E2E tests cover drag/drop via mouse and keyboard, verifying persisted state.
- IV2: WebSocket updates reflect changes on other clients; SSE fallback tested.
- IV3: Analytics emits `calendar_drag` with from/to timestamps and conflict resolution result.

## Notes
- Provide screen-reader-friendly announcements via polite aria-live.
- Guard against dragging locked items (published, in-flight).
