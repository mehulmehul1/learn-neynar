# Epic 4: Image Editor Integration

## Goal
Embed the Toast UI image editor across compose, Template Studio, and queue revision flows with advanced tools, mobile gestures, and export pipeline tied to Pinata.

## Outcome
- Creators edit media inline with professional-grade tools on mobile and desktop.
- Exports respect performance/privacy constraints and feed directly into templates and casts.
- Analytics track tool usage for future optimization.

## Stories
- Story 4.1 – `docs/prd/story-4-1-tui-wrapper-integration.md`
- Story 4.2 – `docs/prd/story-4-2-advanced-tools-mobile-gestures.md`
- Story 4.3 – `docs/prd/story-4-3-export-upload-pipeline.md`
- Story 4.4 – `docs/prd/story-4-4-editor-analytics-instrumentation.md`

## Dependencies
- Template APIs (for overlays) and Pinata upload pipeline.
- Device gesture guidelines from integration guide.

## Acceptance
- Editor passes device matrix tests (iPhone, Pixel, iPad, mid-tier Android).
- Export/render times within budget (<1s final render).
