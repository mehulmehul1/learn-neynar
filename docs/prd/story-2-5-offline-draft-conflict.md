# Story 2.5 Offline Draft Conflict Resolution

As a frequent traveler,
I want clear conflict handling when drafts change offline,
so that I never lose work or overwrite team edits.

## Acceptance Criteria
1: Detect divergence between local IndexedDB state and server draft version using version stamps/requestId.
2: Present conflict resolution modal offering merge (preserve both), overwrite, or cancel options with diff summary.
3: Sync queued uploads once connectivity restores, emitting progress toasts and analytics (`draft_conflict` events).
4: Document recovery steps in support runbook; include links from modal to help docs.

## Integration Verification
- IV1: Integration test simulating offline edit + remote update shows expected modal and chosen outcome.
- IV2: Telemetry captures conflict occurrences with resolution path.
- IV3: Accessibility review ensures modal is keyboard operable and screen-reader friendly.

## Notes
- Coordinate with backend to ensure conflict metadata (lastUpdated) returned in draft payloads.
- Provide instrumentation to flag frequent conflicts for future collaboration features.
