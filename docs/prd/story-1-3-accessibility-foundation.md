# Story 1.3 Accessibility Foundation

As an accessibility champion,
I want global focus-visible styles, keyboard order, and Dynamic Type mechanics set up,
so that every flow meets WCAG 2.1 AA from the start.

## Acceptance Criteria
1: Implement focus-visible outlines that satisfy 4.5:1 contrast and appear on all interactive elements, including drag handles.
2: Configure typography scaling to support Dynamic Type up to 130%, verifying layout resilience on key screens (compose, template studio, calendar).
3: Add automated axe scans to CI (per-page or Storybook) with baseline thresholds and documentation on remediation workflow.
4: Provide aria-live regions for autosave, queue updates, and error toasts as global utilities ready for reuse.

## Integration Verification
- IV1: Keyboard-only walkthrough on create and queue pages completes without traps; documented screencast or notes.
- IV2: axe CI job visible in pipeline, failing on introduced violations.
- IV3: Manual Dynamic Type test on mobile emulator shows no content clipping or overlaps.

## Notes
- Coordinate with UX to confirm tone/messaging for live-region announcements.
- Document accessibility checklist for future stories.
