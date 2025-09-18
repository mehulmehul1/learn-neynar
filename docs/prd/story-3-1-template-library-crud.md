# Story 3.1 Template Library CRUD

As a template manager,
I want to create, duplicate, search, and delete templates with ease,
so that I can maintain a reusable catalog.

## Acceptance Criteria
1: Implement Template Studio library page with search, filters, sort, favorites, and pagination using shadcn components.
2: Support create, duplicate, archive, and delete actions with confirmation dialogs and optimistic updates.
3: Persist metadata (title, category, tags, accessibility flags) via template APIs; validate inputs.
4: Emit analytics events (`template.create`, `template.duplicate`, `template.delete`) with relevant properties.

## Integration Verification
- IV1: API contract tests cover CRUD operations and error handling.
- IV2: Library respects permission scopes (owner/editor/viewer) when showing actions.
- IV3: Accessibility scan ensures cards and menus accessible.

## Notes
- Provide empty states for no templates, offline mode, and permission-restricted views.
- Hook into React Query cache invalidation shared with compose tray.
