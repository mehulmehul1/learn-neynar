# Story 3.4 Template Permissions & Audit

As a team admin,
I want granular permissions and audit logging on templates,
so that collaboration stays safe and traceable.

## Acceptance Criteria
1: Implement role-based controls (owner/editor/viewer) for templates with UI badges and action gating.
2: Provide sharing dialog to invite collaborators, set permissions, and revoke access.
3: Capture audit log entries (share, permission change, edit) visible in template activity feed.
4: Ensure API enforces scope on all read/write operations, returning meaningful errors.

## Integration Verification
- IV1: Authorization tests cover all endpoints (positive/negative cases).
- IV2: Activity feed renders chronological entries with filters.
- IV3: Compose tray respects viewer-only access (no editing) when template shared.

## Notes
- Align error messaging with UX content guidelines.
- Consider webhook/event for notifying collaborators (future enhancement).
