# PRP: Epic 1 – Foundation & Design System

## Objective
Stand up the shadcn/ui-driven design system foundation in the Next.js 'web/' app so downstream epics can rely on consistent tokens, primitives, accessibility, and performance guardrails. Epic 1 maps to stories 1.1–1.4 covering tooling setup, core component migration, accessibility scaffolding, and performance CI gates.

## Must-Read Context
- `docs/epics/epic-1-foundation-and-design-system.md` – epic scope, deliverables, dependencies.
- Story files `docs/prd/story-1-1-shadcn-foundation.md` through `docs/prd/story-1-4-performance-tooling-ci.md` – acceptance criteria & integration verification.
- Design system mapping `docs/design-system/shadcn-component-mapping.md` – required variants, tokens, accessibility notes.
- Architecture baseline `docs/architecture.md` – confirms web/ Next.js app is the unified frontend/backend surface.
- Current UI scaffolding for reference:
  - `web/app/globals.css` – minimal global styles to replace with token CSS.
  - `web/tailwind.config.js` – current theme stub.
  - `web/components/ui/Button.tsx`, `Card.tsx`, `EmptyState.tsx`, `Layout.tsx` – legacy primitives to migrate.
  - `web/app/{page.tsx,create/page.tsx,queue/page.tsx}` – screens consuming the primitives.
- README baseline (`README.md`) – currently backend-focused; needs design-system instructions added.

## External References (include in agent context)
- shadcn/ui installation for Next.js App Router: https://ui.shadcn.com/docs/installation/next
- shadcn component CLI usage & theming: https://ui.shadcn.com/docs/components
- Tailwind CSS with design tokens (CSS variables + alpha): https://tailwindcss.com/docs/customizing-colors#using-css-variables
- Storybook for Next.js 15 App Router: https://storybook.js.org/docs/next
- Axe accessibility testing in Storybook: https://storybook.js.org/addons/@storybook/addon-a11y
- Lighthouse CI setup: https://github.com/GoogleChrome/lighthouse-ci
- Next.js Web Vitals reporting: https://nextjs.org/docs/app/building-your-application/optimizing/analytics#reporting-web-vitals

## Existing Patterns to Mirror
- Legacy components already centralize UI under `web/components/ui/*`; keep same import ergonomics (barrel exports) after migration.
- `web/lib/api.ts` demonstrates environment-aware utilities—use similar approach for any new helpers (e.g., `lib/a11y.ts`).
- Backend repo root already uses npm scripts (`package.json`). Add Storybook/Lighthouse/bundle analyzer commands next to existing ones for consistency.

## Gotchas / Constraints
- Tailwind JIT requires RGB CSS variable syntax (`rgb(var(--token) / <alpha-value>)`) per design doc.
- shadcn CLI defaults to `/components`; configure to output under `web/components/ui` to avoid path churn.
- Dynamic Type requirement: support up to 130% font scaling; test with browser dev tools and Storybook viewport scaling.
- Accessibility live regions must avoid duplicate announcements—centralize in a hook/utility rather than inline spans.
- Lighthouse CI on Next 15 requires running against built output (`next build` + `next start`); ensure workflows spin up server before `lhci autorun`.

## Implementation Blueprint (ordered)

### 1. Story 1.1 – shadcn/ui Foundation Setup
1. **Install CLI & dependencies**
   ```bash
   cd web
   npx shadcn@latest init --path components/ui
   npm install -D tailwindcss-animate class-variance-authority tailwind-merge @storybook/nextjs @storybook/addon-essentials @storybook/addon-a11y @storybook/addon-interactions @storybook/test @storybook/addon-styling
   npm install lucide-react classnames
   ```
   - Configure CLI for TypeScript, App Router, alias `@/components/ui`.
2. **Token stylesheet**
   - Create `web/styles/tokens.css` with variables from design doc (foreground/background, primary/secondary, accent, success/warning/destructive, spacing, radii, shadows, typography).
   - Update `web/app/globals.css` to import tokens and apply base typography + body sizing.
3. **Tailwind config**
   - Replace `web/tailwind.config.js` with config extending colors/spacing/fonts via CSS variables and add Storybook directories to `content` array.
4. **Storybook baseline**
   - `npx storybook@latest init --builder @storybook/nextjs --type react --use-npm`.
   - Configure `storybook/main.ts` for addons (`essentials`, `a11y`, `interactions`, `styling`) and global CSS import.
   - Add `stories/Tokens.stories.tsx` showcasing tokens (light/dark + dynamic type controls).
5. **Docs & scripts**
   - Update `web/package.json` scripts: `storybook`, `storybook:build`, `storybook:test` (if using Test Runner).
   - Update `README.md` with shadcn generation workflow, Storybook commands, token overview.

### 2. Story 1.2 – Core Component Migration
1. **Generate base components**
   - `npx shadcn@latest add button card input textarea form alert separator dropdown-menu` targeting `components/ui`.
   - Create barrel `web/components/ui/index.ts` exporting primitives + custom variants.
2. **Button variants**
   - Extend `cva` config with variants `primary|secondary|ghost|destructive|outline|link` and sizes `sm|md|lg|icon`.
   - Add `loading`/`success`/`error` state props (spinner via `Loader2` icon, `aria-busy`, motion guard).
3. **Card variants**
   - Compose wrappers for queue card, coin card, template preview, success sheet using `CardHeader`, `CardContent`, `CardFooter` and status chips.
   - Provide drag handle slot with keyboard instructions.
4. **Form/Input suite**
   - Implement `TickerInput`, `TitleTextarea`, `MediaUploadField` leveraging shadcn `Form` primitives.
   - Ensure helper text + error states align with accessibility guidelines.
5. **EmptyState/Alert**
   - Rebuild `EmptyState` via `Alert` with variants `noDrafts|noCoins|noSchedules|offline` and CTA slot.
6. **Update consumers**
   - Refactor `web/app/page.tsx`, `app/create/page.tsx`, `app/queue/page.tsx`, `components/compose-form.tsx` to use new primitives.
7. **Storybook coverage**
   - Add stories for each component/variant with docs tab describing props, keyboard behavior, and theming tokens.
   - Include screenshot baseline (attach to PR or configure Chromatic later).

### 3. Story 1.3 – Accessibility Foundation
1. **Focus-visible + reduced motion**
   - Add global focus ring styles using token colors; ensure drag handles/FAB/links receive ring.
   - Introduce `VisuallyHidden` helper and `SkipToContent` link in layout.
2. **Dynamic Type support**
   - Use `clamp` typography scale and ensure components expressed in `rem`. Add Storybook decorator to simulate 130% font size.
3. **Accessibility tooling**
   - Configure Storybook addon-a11y, add npm script `storybook:test` running `storybook test --coverage` (or `test-storybook`).
   - Optionally add `@axe-core/react` hook in dev mode for runtime alerts.
4. **Live regions & announcements**
   - Create `web/components/a11y/LiveAnnouncer.tsx` + hook `useAnnounce`. Wire sample usage in compose form (autosave stub) and queue page (status updates placeholder).
5. **Documentation**
   - Create `docs/accessibility-checklist.md` capturing keyboard walkthrough, dynamic type QA, tone guidelines for announcements.

### 4. Story 1.4 – Performance Tooling & CI Guardrails
1. **Bundle analyzer**
   - Install `@next/bundle-analyzer`; update `web/next.config.js` to wrap config with analyzer plugin and enforce budgets via `ANALYZE=true` builds.
   - Document budget targets (e.g., main < 220kb gz, compose < 250kb gz) in new runbook.
2. **Lighthouse CI**
   - Add `lighthouserc.json` with mobile budgets aligning to PRD (TTI <3s, LCP <2.5s, CLS <0.1).
   - Create `.github/workflows/perf.yml` running `npm ci`, `npm run build`, `npm run start` (background), `npx @lhci/cli autorun` against `/create` & `/queue` routes.
3. **Web Vitals reporting**
   - Implement `reportWebVitals` export in `web/app/layout.tsx` or dedicated `reportWebVitals.ts` posting metrics to `/api/analytics/web-vitals` (stub route logging payloads).
4. **Runbooks**
   - Add `docs/performance/runbook.md` covering analyzer & Lighthouse usage, budgets, triage steps.
   - Update README link to runbook.

## Pseudocode / Snippets Reference
```tsx
// web/components/ui/button.tsx
const buttonVariants = cva(\n  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none',\n  {\n    variants: {\n      variant: {\n        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',\n        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',\n        ghost: 'bg-transparent hover:bg-muted',\n        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',\n        outline: 'border border-border hover:bg-muted',\n        link: 'underline-offset-4 hover:underline text-primary',\n      },\n      size: {\n        sm: 'h-8 px-3 text-sm',\n        md: 'h-10 px-4 text-sm',\n        lg: 'h-11 px-5 text-base',\n        icon: 'h-10 w-10 p-0',\n      },\n    },\n    defaultVariants: { variant: 'primary', size: 'md' },\n  }\n);
```

```ts
// web/reportWebVitals.ts
import type { NextWebVitalsMetric } from "next/app";

export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (typeof window === "undefined") return;
  navigator.sendBeacon?.(
    "/api/analytics/web-vitals",
    JSON.stringify({ metric, timestamp: Date.now() })
  );
}
```

## Validation Gates
```bash
npm install

cd web
npm run lint
npm run typecheck
npm run storybook:build
npm run analyze
# Lighthouse (run after `npm run build && npm run start` in another shell)
npx @lhci/cli autorun --collect.url=http://localhost:3001/create --collect.url=http://localhost:3001/queue
```
- Accessibility CI: `npm run storybook:test` (Storybook Test Runner with addon-a11y).
- Manual QA: keyboard walkthrough + dynamic type checklist documented in accessibility file.

## Deliverables
- Updated `web/` project with shadcn tokens, primitives, Storybook scaffolding, accessibility utilities, performance tooling.
- Documentation: README updates, `docs/accessibility-checklist.md`, `docs/performance/runbook.md`.
- CI artifacts: Lighthouse workflow, analyzer script, Storybook test command.
- Storybook stories demonstrating component variants and token usage.

## Confidence Score
7 / 10 – Moderate risk from integrating multiple tooling pieces (Storybook, Lighthouse CI) and complex variant requirements, but mitigated through documented steps and reference material.
