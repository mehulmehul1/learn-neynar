# Epic 1: Foundation & Design System

## Goal
Establish the shadcn/ui design system, shared tokens, accessibility guardrails, and performance tooling so every subsequent phase ships on a stable, accessible, and measurable frontend base.

## Outcome
- Component primitives align with the comprehensive design doc and shadcn mapping.
- Dynamic Type, contrast, and focus-visible requirements are enforced globally.
- Tooling (Storybook, lint/type/test, Lighthouse, bundle analyzer) catches regressions automatically.

## Key Deliverables
1. shadcn CLI installation, token definitions, Tailwind + CSS variable wiring, Storybook baseline.
2. Core primitives (Card, Button, Input/Form, EmptyState/Alert) migrated with documented variants and stories.
3. Accessibility scaffolding (focus rings, keyboard order, Dynamic Type support, axe pipeline) live.
4. Performance and CI guardrails (bundle budgets, Lighthouse thresholds, automated checks) operational.

## Stories
- Story 1.1 – `docs/prd/story-1-1-shadcn-foundation.md`
- Story 1.2 – `docs/prd/story-1-2-core-component-migration.md`
- Story 1.3 – `docs/prd/story-1-3-accessibility-foundation.md`
- Story 1.4 – `docs/prd/story-1-4-performance-tooling-ci.md`

## Dependencies
- Existing Next.js app under `web/`.
- Token specs from `docs/design-system/shadcn-component-mapping.md`.
- Accessibility/performance targets from comprehensive design doc.

## Acceptance
- All stories marked done with automated checks green.
- Storybook showcases variants referenced in later phases.
- Axe/Lighthouse budgets enforced in CI.
