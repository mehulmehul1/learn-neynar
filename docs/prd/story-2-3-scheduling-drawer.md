# Story 2.3 Scheduling Drawer

As a power scheduler,
I want a rich scheduling drawer with timezone awareness and auto-queue suggestions,
so that I can plan posts confidently.

## Acceptance Criteria
1: Implement shadcn Sheet with calendar picker, timezone selector (default to detected zone), and DST-safe datetime handling.
2: Surface auto-queue slot suggestions with heatmap scoring, allowing quick apply/ignore actions.
3: Validate conflicts in real time (based on queue data) and present resolution guidance.
4: Persist scheduling metadata with the draft and update preview/summary cards.

## Integration Verification
- IV1: API requests to scheduling endpoints include timezone offset and auto-queue selection data.
- IV2: Real-time updates (phase 5) stubbed with placeholder messaging but fails safe.
- IV3: Unit tests cover DST transitions (spring forward/back) edge cases.

## Notes
- Use React Query to prefetch queue data when drawer opens.
- Keep drawer accessible with focus trapping and keyboard shortcuts.
