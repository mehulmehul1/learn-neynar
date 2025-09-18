# Story 1.2 Core Component Migration

As a frontend engineer,
I want Card, Button, Input/Form, and EmptyState primitives migrated to shadcn variants,
so that feature teams can compose consistent UI blocks with documented states.

## Acceptance Criteria
1: Replace existing `web/components/ui/*` implementations with shadcn structures and variant props defined in the mapping doc.
2: Cover required variants (queue card, coin card, template preview, success sheet, button sizes/variants, ticker input, offline empty states) in Storybook with controls.
3: Implement loading, error, success, drag, and keyboard-reorder states per accessibility guidance.
4: Update consuming pages (`app/create`, `app/queue`, etc.) to use the new components with no UI regressions.

## Integration Verification
- IV1: Visual regression spot-check across create, queue, success screens passes; screenshots attached to PR.
- IV2: Axe accessibility scan on updated pages shows no new violations.
- IV3: Storybook stories include docs tab describing usage and props.

## Notes
- Ensure icon-only buttons set `aria-label` and honor `prefers-reduced-motion`.
- Provide barrel exports for components to keep import ergonomics stable.
