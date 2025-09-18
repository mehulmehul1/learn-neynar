# Story 3.3 Template Version History & Rollback

As a content lead,
I want version history for templates with rollback and branching,
so that I can experiment without losing the best-performing layouts.

## Acceptance Criteria
1: Record version metadata (author, createdAt, change summary, accessibility flags) on save.
2: Provide history panel with compare view, rollback, and branch actions.
3: Ensure rollback triggers render job, updates compose tray references, and logs analytics (`template.rollback`).
4: Preserve audit trail and notify collaborators of new versions via in-app toast.

## Integration Verification
- IV1: Database migration/schema supports version history per API contracts.
- IV2: Tests cover branching + rollback flow, ensuring no orphaned assets.
- IV3: Compose tray shows latest version and alerts when default template updated.

## Notes
- Coordinate with analytics to attribute template performance by version.
- Limit retained versions per template (configurable) to manage storage.
