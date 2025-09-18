# Story 2.2 Template Selector Bridge

As a creator,
I want to browse and insert templates directly from compose,
so that I can reuse branded layouts without leaving the flow.

## Acceptance Criteria
1: Build template selector using shadcn Command + Dialog with search, favorites, and preview thumbnails.
2: Display live preview inline within compose using Template Studio render API (progress indicator <300ms updates).
3: Persist selected template metadata with the draft and expose quick actions (edit in studio, swap template).
4: Emit analytics events (`template_picker.open`, `template_picker.select`) with templateId and durationMs.

## Integration Verification
- IV1: Integration test ensures selecting template updates preview and payload sent to backend.
- IV2: Offline mode gracefully degrades (shows cached thumbnail, disables edit CTA).
- IV3: Accessibility check ensures template list keyboard navigation and announcements.

## Notes
- Use optimistic updates for preview while render job completes; fallback to skeleton.
- Respect permission scopes (owner/editor/viewer) when listing templates.
