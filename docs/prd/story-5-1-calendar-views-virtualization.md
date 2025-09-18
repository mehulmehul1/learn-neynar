# Story 5.1 Calendar Views & Virtualization

As a scheduler,
I want agenda, week, and month views that render smoothly with large data sets,
so that I can plan without lag.

## Acceptance Criteria
1: Build calendar views using shadcn Calendar + `@tanstack/react-virtual` for agenda lists, supporting overscan and measureElement.
2: Support responsive layouts (mobile stacked, desktop split) with keyboard navigation (arrow keys, page jumps).
3: Provide sticky timeline headers, date pickers, and quick filters (channel, status).
4: Ensure virtualization maintains accessibility roles and aria-rowindex values.

## Integration Verification
- IV1: Performance profile shows <150ms interaction even with 500 scheduled items.
- IV2: Keyboard traversal demo video recorded as evidence.
- IV3: Accessibility scan confirms roles/labels present.

## Notes
- Cache scheduling data per view to reduce API load.
- Provide placeholders for empty days and offline messaging.
