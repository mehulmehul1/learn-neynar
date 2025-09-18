# Implementation Roadmap

This roadmap outlines a 14-week delivery plan aligned with the comprehensive research document. Each phase includes key deliverables, accessibility/performance targets, and integration milestones.

## Phase 1: Foundation & Design System (Weeks 1-2)
- Install shadcn/ui CLI, scaffold baseline components, and configure `@/components/ui` barrel exports.
- Define design tokens (colors, typography, spacing, radii, shadows) and propagate CSS variables + Tailwind extensions.
- Migrate Card, Button, Input, EmptyState to shadcn primitives with documented variants/states.
- Establish accessibility foundation: Dynamic Type up to 130% scaling, focus-visible styles, 4.5:1 contrast validation, screen reader label system.
- Stand up performance tooling: bundle analyzer, Web Vitals alerts, mobile TTI budget (<3s) dashboards.
- Deliverable: documented component library, accessible tokens, CI checks for lint, type, storybook smoke.

## Phase 2: Enhanced Compose Experience (Weeks 3-4)
- Refactor `web/components/compose-form.tsx` to shadcn structures with mode toggle (cast vs coin) and autosave drafts.
- Integrate template selector with live previews sourced from Template Studio APIs.
- Implement real-time ticker validation (<200ms) using React Query and optimistic UI.
- Build scheduling drawer with timezone detection, DST-safe conflict detection, and auto-queue slot suggestions.
- Surface Farcaster/Zora validation feedback through shadcn Toast + Alert patterns.
- Deliverable: unified compose tray supporting draft -> preview -> send with real-time validation.

## Phase 3: Template Studio (Weeks 5-6)
- Ship template library CRUD flows, including search, favorites, and default template settings.
- Implement canvas editor with layer controls, color themes, typography selection, avatar masks, watermark placement.
- Enforce performance targets (<300ms preview, <1s final render) with caching by `{styleId, titleHash}`.
- Ensure accessibility: contrast checking, smart line breaks, tooltip fallbacks for truncation.
- Capture template version history and allow rollback/branching.
- Deliverable: production-ready Template Studio with live preview bridge to compose tray.

## Phase 4: Image Editor Integration (Weeks 7-8)
- Integrate TUI Image Editor per updated guide: crop, text, sticker, draw, filters, undo/redo.
- Connect editor outputs to compose tray, Template Studio background layers, queue revisions.
- Optimize mobile gestures (pinch zoom, two-finger rotate, swipe tool change) with optional haptics.
- Handle large image performance (downscale >4096px, progressive loading) and offline editing workflow.
- Deliverable: Instagram-style editor embedded across product surfaces with analytics instrumentation.

## Phase 5: Calendar & Advanced Scheduling (Weeks 9-10)
- Build weekly/monthly calendar with drag-drop rescheduling via `@dnd-kit/core` sortable contexts.
- Implement auto-queue slot management, performance heatmap overlays, and collision detection feedback.
- Expand queue management with bulk actions, filtering, worker health indicators, and real-time WebSocket updates.
- Introduce social discovery within scheduling (friend availability, recommended co-post windows).
- Deliverable: scheduling suite meeting <150ms drag feedback and social proof integration targets.

## Phase 6: Portfolio & Analytics (Weeks 11-12)
- Launch coins portfolio (Created vs Holdings) with Zora metrics, trading shortcuts, and success triggers.
- Build analytics dashboards (performance charts, ROI, streak tracking) and export options (CSV, API token).
- Surface social proof modules ("Friends using Kamo", streak badges, challenge prompts) across dashboard and success sheets.
- Ensure share flows capture post-launch metrics for growth loops.
- Deliverable: analytics-rich portfolio experience driving retention and social engagement.

## Phase 7: Polish & Optimization (Weeks 13-14)
- Ship streaks, challenges, and reminder systems (calendar notifications, streak-save alerts, challenge nudges).
- Complete drafts management UI with offline awareness, bulk operations, and conflict resolution.
- Execute bundle optimizations (code splitting heavy editors, prefetch strategy) and meet TTI <3s mobile target.
- Conduct comprehensive accessibility (WCAG 2.1 AA) and usability testing (SUS >= 80), remediate issues.
- Deliverable: launch-ready release with growth hooks, performance compliance, and accessibility sign-off.

## Enhanced Dependencies & Prerequisites
- Prisma schema covering templates, queue, drafts, preferences, streaks, challenges, analytics snapshots.
- SIWN authentication pipeline with session tokens, refresh handling, and bearer auth for APIs.
- Real-time infrastructure (WebSocket/SSE) for queue updates, calendar sync, ticker validation, social proof events.
- External integrations ready: Pinata credentials/Gateway, Neynar API keys, Zora service access.
- Analytics stack (PostHog/Segment) with event taxonomy, feature flag service, and experimentation tooling.
- QA device matrix including iPhone, Pixel, iPad, and mid-tier Android for performance profiling.

## Detailed Success Criteria
- Performance: template preview <300ms, final render <1s, ticker availability <200ms, calendar drag feedback <150ms, mobile TTI <3s.
- UX Outcomes: median draft-to-schedule time <=45s, share card adoption >=40%, calendar drag success >=95% without manual conflict resolution.
- Accessibility: WCAG 2.1 AA compliance, Dynamic Type 130% support, keyboard coverage for all interactive zones, SUS score >=80.
- Adoption Metrics: queue engagement rate, streak completion %, social proof click-through, portfolio repeat visits.

## Comprehensive Risk Mitigation
- **TUI Mobile Performance**: Prototype in Phase 4 sprint 1, profile low-end Android memory, implement downscaling + worker offload.
- **Template Rendering Load**: Pre-render popular templates, utilize worker queue, cache by `{styleId, titleHash}`, monitor render latency.
- **Calendar Scalability**: Virtualize heavy schedules, paginate API results, throttle worker updates, monitor WebSocket backpressure.
- **Ticker Collision Management**: Reserve-on-schedule with TTL, suggestion engine, optimistic conflict resolution messaging.
- **Social Graph Privacy**: Implement consent-first friend discovery, data minimization, and transparent opt-out controls.
- **External API Quotas**: Track Neynar/Zora usage, implement exponential backoff, and surface quota warnings in admin tools.

## Enhanced Milestone Reviews
- End-of-phase demos with stakeholder sign-off, capturing qualitative feedback and updating backlog.
- Performance & accessibility validation checklist per phase; log results in shared QA tracker.
- Usability sessions (8-10 creators) after Phases 2, 4, 6 with >=80% task completion and time-on-task reporting.
- Final launch readiness review post Phase 7 covering security, performance, analytics, and documentation.

## Social Proof & Growth Features
- Friend discovery surfaces using Neynar following graph, privacy controls, and contextual CTAs.
- Streak system with daily/weekly milestones, badge rewards, and success sheet celebrations.
- Challenge framework featuring themed prompts, leaderboards, participation dashboards, and reminder flows.
- Reminder + notification system for calendar slots, streak at-risk alerts, and challenge deadlines via email/push.

## Performance & Analytics Integration
- Real-time monitoring dashboards for render times, queue latency, WebSocket health, bundle size trends.
- Event dictionary covering compose, template, editor, calendar, social proof, and growth loops; ensure funnel tracking.
- A/B testing harness for social proof variants, reminder copy, and UI experiments using feature flags.
- User feedback pipeline (in-app surveys, feedback widget, support triage) feeding continuous improvement backlog.

This roadmap serves as the implementation contract for the social media planner mini app, aligning engineering execution with research-backed user journeys, accessibility standards, and growth objectives.




