# Epic 5: Calendar & Advanced Scheduling

## Goal
Deliver agenda/week/month calendar views with drag-and-drop rescheduling, auto-queue management, and real-time updates that keep creators informed and confident.

## Outcome
- Calendar UI performs within 150ms interaction budget and supports keyboard-only control.
- Auto-queue slots, heatmaps, and conflict resolution guide scheduling decisions.
- Queue management surfaces worker health, bulk actions, and social discovery cues.

## Stories
- Story 5.1 – `docs/prd/story-5-1-calendar-views-virtualization.md`
- Story 5.2 – `docs/prd/story-5-2-drag-drop-conflict-resolution.md`
- Story 5.3 – `docs/prd/story-5-3-auto-queue-heatmap.md`
- Story 5.4 – `docs/prd/story-5-4-queue-operations-realtime.md`

## Dependencies
- Compose scheduling metadata.
- WebSocket infrastructure from backend.

## Acceptance
- End-to-end tests cover scheduling flows; WebSocket fallbacks verified.
- Accessibility review passes (keyboard, screen reader, announcements).
