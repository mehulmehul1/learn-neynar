# Story 5.3 Auto-Queue & Heatmap Overlay

As a growth-minded creator,
I want auto-queue suggestions and heatmaps,
so that I can post at the best times with minimal effort.

## Acceptance Criteria
1: Render heatmap overlay using performance data (API) with color scale legend and accessible text descriptions.
2: Highlight recommended auto-queue slots, allowing one-click scheduling with confirmation.
3: Provide tooltip insights (expected reach, conflict notes) and allow dismissal.
4: Update analytics (`auto_queue.accept`, `auto_queue.dismiss`) with context.

## Integration Verification
- IV1: API integration fetches heatmap/slot data, caching responses and handling stale data.
- IV2: Visual tests confirm color contrast meets AA; accessible table alternative provided.
- IV3: Auto-queue selection updates queue/calendar immediately.

## Notes
- Provide preference toggle for heatmap visibility.
- Align copy with marketing/growth messaging.
