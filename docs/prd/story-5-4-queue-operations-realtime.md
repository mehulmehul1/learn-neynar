# Story 5.4 Queue Operations & Real-Time Updates

As an operator,
I want queue controls and real-time feedback,
so that I can manage publishing health proactively.

## Acceptance Criteria
1: Add bulk actions (run now, reschedule, cancel) with confirmation and progress tracking.
2: Display worker health indicators (last run, backlog, failure rate) sourced from monitoring endpoint.
3: Subscribe to WebSocket channels for queue updates; fallback to SSE with retry guidance.
4: Surface social discovery modules (friends scheduling, recommended co-post windows) within queue panel.

## Integration Verification
- IV1: Real-time events update queue without full refresh; offline fallback polls gracefully.
- IV2: Monitoring endpoint integrated with alerts if backlog > threshold.
- IV3: Analytics `queue_action` events captured with action type, selection size, outcome.

## Notes
- Coordinate with backend on event schema and rate limits.
- Provide operator documentation for interpreting health indicators.
