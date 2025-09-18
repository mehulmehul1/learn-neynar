# Story 1.1 shadcn/ui Foundation Setup

As a frontend engineer,
I want the shadcn/ui toolchain and design tokens wired into our Next.js app,
so that downstream feature work can rely on a consistent component system.

## Acceptance Criteria
1: Install shadcn/ui CLI, configure base components directory, and document generation workflow.
2: Define CSS variables and Tailwind theme tokens (colors, typography, spacing, radii, shadows) per design-system spec.
3: Seed Storybook with a "Tokens" showcase, verifying dark/light modes and Dynamic Type scaling up to 130%.
4: Update `README.md` (or docs) with commands for regenerating components and running Storybook.

## Integration Verification
- IV1: `npm run lint` / `npm run typecheck` / `npm run storybook` succeed with no new warnings.
- IV2: Global styles import the token CSS without layout regressions on existing pages.
- IV3: Visual spot-check on create queue pages shows tokens applied (no fallback colors/spacing).

## Notes
- Reference `docs/design-system/shadcn-component-mapping.md` for token names.
- Ensure tokens remain compatible with Tailwind JIT (use CSS variables via `rgb(var(--token) / <alpha-value>)`).
