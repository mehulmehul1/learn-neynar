# Neynar Planner Product Requirements Document (PRD)

Version: 5.0 - Date: 2025-09-17 - Owner: PM (John)

## Goals and Background Context
### Goals
- Provide a mobile-first compose -> preview -> send -> share workflow that lets creators publish Farcaster casts and optionally mint Zora coins in a single, guided flow.
- Equip creators with reusable templates, Instagram-style editing, scheduling, and analytics surfaces that align with the eleven documented end-to-end journeys.
- Achieve the speed, accessibility, and reliability targets needed to make weekly scheduling rituals effortless (draft-to-schedule <=45s, template rendering SLAs, responsive calendar interactions).
- Lay the groundwork for future visual polish and growth experiments by delivering stable infrastructure, instrumentation, and feature-flagged expansion points.

### Background Context
The brownfield MVP delivered persistent Express + worker-backed scheduling for casts and coins, but the current Next.js frontend under `web/` is a thin scaffold. September 2025 research, design, and technical specification updates (comprehensive design document, shadcn/ui migration plan, journey specifications, API contracts, integration guides, and implementation roadmap) define the production surface expected for launch.

This PRD re-baselines the project around that guidance so product, engineering, design, and growth teams share a single source of truth before executing the seven-phase delivery roadmap.

### Change Log
| Date       | Version | Description                                                     | Author |
|------------|---------|-----------------------------------------------------------------|--------|
| 2025-09-17 | 5.0     | Re-baselined PRD to cover full Neynar planner scope and roadmap | John   |
| 2025-09-09 | 1.0     | Initial MVP PRD for cast and coin scheduler                     | John   |

## Personas & Target Users
- **Creator Pro (primary)**: Farcaster-native builders and artists who publish daily and are comfortable with wallets. They need fast drafting, reliable scheduling, template reuse, and clear coin impact previews to sustain streaks.
- **Coin-Curious Follower (secondary)**: Followers who occasionally mint or trade creator coins. They need transparent coin metadata, low-friction buy/share actions, and reassurances about gas sponsorship and safety.
- **New Onchain Poster (expansion)**: Emerging Farcaster users with low wallet tolerance. They need smart-wallet onboarding, plain-language guidance, and guardrails that help them ship their first cast and share card in minutes.

## Success Metrics & KPIs
- Median draft-to-schedule time <=45 seconds on mobile, with 70% of success screens triggering at least one downstream action (share, queue next, open portfolio).
- Template preview render <300ms, final template render <1s, ticker availability responses <200ms, and calendar drag feedback <150ms.
- Mobile time-to-interactive <3s on iPhone 15 Pro, Pixel 8, iPad Air, and mid-tier Android reference devices.
- Share card adoption >=40%, streak success rate >=65%, challenge participation >=35%, and weekly active creator retention uplift vs. MVP baseline.
- Post-launch SUS score >=80 and full WCAG 2.1 AA compliance across core flows, including Dynamic Type up to 130%.
- Queue health SLAs: worker backlog <5 minutes, publish failure rate <2%, real-time channel uptime >=99%.
- Analytics completeness: 100% of events listed in Appendix C emitted with coherent properties and available in dashboards prior to GA.

## Scope Overview
### In Scope (v1 launch)
- Unified compose tray with autosave, offline drafts, template selection, scheduling drawer, and coin toggle.
- Template Studio including search, favorites, version history, default template management, live preview, and safe-zone overlays.
- Toast UI image editor integration with advanced crop, sticker, draw, filter, undo/redo, and mobile gestures.
- Queue management, agenda, and calendar suite featuring heatmap overlays, drag-and-drop rescheduling, bulk actions, auto-queue slots, and WebSocket-powered updates.
- Success screens with dynamic share cards, Neynar share integrations, and downstream CTAs.
- Coins portfolio (Created vs Holdings), analytics dashboards, and export/download options.
- Streaks, challenges, reminders, social discovery modules, and notification preferences powering growth loops.
- Real-time infrastructure (WebSocket + SSE), worker orchestration, optimistic UI with React Query, offline caching via IndexedDB, and idempotent REST contracts.
- Instrumentation, feature flagging, and QA device matrix aligned with roadmap milestones.

### Out of Scope (post v1)
- Experimental visual themes, bespoke animations, and advanced art direction for share cards.
- Farcaster Frames or external embed support beyond success-card generation.
- Advanced account abstraction options (user-paid AA, session keys) and multi-tenant RBAC hardening.
- Localization beyond English, currency localization, and time zone overrides beyond the documented settings.
- Deep collaborative editing (multi-cursor, synchronous co-edit) beyond queued roadmap consideration.
- Marketplace, monetization extensions, or L2/chain expansion beyond Base.

## Functional Requirements
### Compose & Drafting
- **FR1:** Provide a unified compose tray with text, media, coin toggle, template selector, real-time ticker validation (<200ms), and mode persistence across sessions.
- **FR2:** Autosave drafts locally (IndexedDB) and in the backend with optimistic updates, offline resilience, conflict resolution prompts, and cross-device restoration.
- **FR3:** Deliver a preview -> confirmation -> send flow that surfaces SIWN status, sponsorship eligibility, gas estimates, and success sheets with dynamic share imagery.

### Template Studio & Assets
- **FR4:** Allow creators to browse, search, filter, favorite, clone, and delete templates with permission controls (owner/editor/viewer) and audit trail.
- **FR5:** Support live template editing with safe zones, typography controls, color tokens, watermark placement, and live preview bridging back to compose tray.
- **FR6:** Maintain template version history with rollback, branching, render job tracking, caching by {styleId, titleHash}, and progress indicators.

### Image Editor
- **FR7:** Embed TUI Image Editor with advanced crop ratios, perspective tools (stretch goal), text styles, sticker packs, brush presets, filter presets, and haptic-enhanced mobile gestures; export sanitized assets to Pinata via existing upload pipeline.

### Queue & Calendar
- **FR8:** Expose queue list, filters, status chips, run-now actions, error handling, worker health indicators, and real-time updates through WebSocket/SSE envelopes.
- **FR9:** Provide weekly/monthly/agenda calendar views with drag/drop, collision detection, auto-queue slot management, heatmap overlay, keyboard accessibility, and virtualization for large schedules.

### Portfolio & Analytics
- **FR10:** Display Created vs Holdings coin tabs with price, supply, volume, sparklines, transaction history, and contextual actions (share, mint more, trade link).
- **FR11:** Offer analytics dashboards (performance, ROI, streak tracking), CSV export, API tokens, A/B test hooks, and insights surfaced in success sheets.

### Social & Growth Systems
- **FR12:** Implement streak tracking, challenges, reminder flows, badges, and leaderboard prompts with configurable cadence and opt-out controls.
- **FR13:** Surface friend discovery, social proof modules, recommended co-post windows, and contextual CTAs across compose, queue, and portfolio experiences.

### Real-Time & Operational Controls
- **FR14:** Maintain real-time channels for queue, calendar, ticker availability, template rendering, image editor progress, and social events with backoff/retry guidance.
- **FR15:** Provide admin/operational tooling: worker status dashboards, quota alerts (Neynar/Zora), and observability endpoints for support escalation.

## Non-Functional Requirements
- **NFR1 Performance:** Meet the latency budgets outlined above; ensure reusable components render within 16ms average and interactions avoid layout shift.
- **NFR2 Accessibility:** Achieve WCAG 2.1 AA, Dynamic Type up to 130%, keyboard-only parity, ARIA live regions for async updates, and contrast ratios >=4.5:1.
- **NFR3 Reliability:** Persist queues in the database, provide retries with exponential backoff, maintain idempotency keys (24h window), and ensure worker recovery after failures.
- **NFR4 Security & Privacy:** Enforce SIWN-derived bearer tokens, scope-based permissions for template sharing, sanitized uploads (strip EXIF), and opt-in social discovery.
- **NFR5 Scalability & Resilience:** Support 10k/day ticker checks, WebSocket backpressure safeguards, SSE fallback, caching (Redis) for Neynar responses, and worker autoscaling hooks.
- **NFR6 Offline & Sync:** Provide offline draft editing, queued uploads with resume, and clear status indicators when connection is lost or data is stale.
- **NFR7 Observability & Telemetry:** Emit structured logs with requestId, maintain PostHog/Segment event pipelines, provide dashboards for render latency, queue depth, and WebSocket health.
- **NFR8 Quality & Testing:** Enforce lint/type/test gates, Storybook smoke tests for shadcn components, automated axe accessibility checks, and device-matrix manual validation pre-launch.

## User Journeys
1. **Onboarding & Wallet Connect:** Welcome screens, wallet selection, SIWN challenge, sponsorship education, profile confirmation.
2. **Unified Compose Tray:** Mode toggle, draft editor, template picker, media upload, validations, scheduling entry point.
3. **Template Studio:** Library navigation, editing, version control, safe zones, collaborative safeguards.
4. **Instagram-Style Image Editor:** Canvas tools, filters, stickers, gestures, undo/redo, export.
5. **Preview & Send:** Chain/ticker confirmation, gas clarity, coin summary, publish actions.
6. **Success & Share:** Share cards, prefilled casts, downstream CTAs, milestone celebrations.
7. **Queue & Activity Management:** Job statuses, error recovery, worker insights, bulk actions.
8. **Calendar View:** Agenda, week, month views, heatmap, drag/drop rescheduling, conflict resolution.
9. **Drafts Management:** Offline awareness, conflict handling, bulk cleanup, revision history.
10. **Coins Portfolio:** Created vs Holdings tabs, coin detail, trade shortcuts, analytics overlays.
11. **Settings & Notifications:** Preference categories, notification cadence, API keys, integration management.

## Phase Plan & Delivery Milestones
### Phase 1: Foundation & Design System (Weeks 1-2)
- Install shadcn/ui, configure tokens, migrate Card/Button/Input/EmptyState, establish Dynamic Type and contrast foundations, set up performance tooling.
- Exit criteria: shadcn component variants shipped, Storybook coverage, CI enforcing lint/type/accessibility.

### Phase 2: Enhanced Compose Experience (Weeks 3-4)
- Refactor compose-form with shadcn primitives, autosave drafts, integrate template selector, scheduling drawer, real-time ticker validation, toast feedback.
- Exit criteria: Compose tray completes create->preview->send loop with autosave/offline coverage and performance budgets met.

### Phase 3: Template Studio (Weeks 5-6)
- Ship template CRUD, live preview, safe zones, accessibility checks, version history, caching strategy.
- Exit criteria: Templates selectable from compose, render times within SLA, rollback/version management operational.

### Phase 4: Image Editor Integration (Weeks 7-8)
- Embed TUI editor across entry points, optimize gestures, handle large files, offline workflows, analytics events.
- Exit criteria: Editor stable on device matrix, export pipeline integrated, latency targets achieved.

### Phase 5: Calendar & Advanced Scheduling (Weeks 9-10)
- Build calendar suite, heatmaps, drag/drop, auto-queue slots, queue enhancements, social discovery alignments.
- Exit criteria: Calendar interactions within 150ms, conflict handling validated, WebSocket updates resilient.

### Phase 6: Portfolio & Analytics (Weeks 11-12)
- Launch coins portfolio, analytics dashboards, share triggers, success hooks, export flows.
- Exit criteria: Portfolio metrics accurate, dashboards populated, share loop instrumentation live.

### Phase 7: Polish & Optimization (Weeks 13-14)
- Complete streaks, challenges, reminders, drafts management, bundle optimizations, accessibility/usability testing, launch readiness review.
- Exit criteria: SUS >=80 in usability tests, accessibility issues resolved, performance budgets maintained, launch go/no-go artifacts approved.

## Integration & Technical Considerations
- Frontend: Next.js app directory under `web/`, shadcn/ui component system, Tailwind tokens, React Query for data synchronization, IndexedDB for offline state.
- Backend: Express API (`src/index.ts`) with SIWN-authenticated REST, WebSocket `/api/realtime`, SSE fallback, worker queues for renders/scheduling.
- Data models: Extend Prisma schema with streaks, challenges, social_connections, auto_queue_slots, ticker_reservations, analytics snapshots.
- Real-time envelopes: Standardized payloads (`id`, `type`, `payload`, `ts`, `scope`, `retry`) for queue, calendar, ticker, template, image editor, social events.
- External integrations: Neynar (graph, SIWN, casting), Zora (coin minting, analytics), Pinata (media storage), feature flag/analytics (PostHog/Segment), optional haptics APIs.
- DevOps: CI/CD with lint/type/test gates, bundle analyzer, lighthouse budgets, storybook QA, environment secrets management.

## Analytics & Instrumentation
- Event taxonomy: `compose_autosave`, `compose_publish`, `template_save_success`, `image_editor.tool_used`, `calendar_drag`, `streak_milestone`, `challenge_join`, `reminder_opt_in`, etc., with defined properties and success criteria.
- Dashboards for render latency, queue depth, worker health, share adoption, streak completion, challenge participation.
- A/B testing harness tied to feature flags for social proof cadence, reminder copy, template suggestions.
- Feedback loop: In-app surveys, support triage pipeline, instrumentation for error states.

## Dependencies & Assumptions
- Existing backend scheduler functionality, Prisma persistence, Neynar/Zora credentials, and worker infrastructure remain in place.
- shadcn/ui tokens and Tailwind theme propagate across new components; Storybook acts as reference library.
- Feature flag and analytics tooling (PostHog/Segment) available for instrumentation and experiments.
- Device lab access for iPhone 15 Pro, iPad Air, Pixel 8, mid-tier Android, macOS, Windows 11.
- Product copy, legal disclosures, and branding assets supplied by stakeholders before Phase 6.
- Archon MCP expected for task management once available; interim tracking through Codex workflows.

## Risks & Mitigations
- **TUI editor memory spikes on low-end Android:** Profile early, downscale large assets, release offscreen canvases, monitor memory pressure.
- **WebSocket saturation during peak scheduling:** Enforce backpressure, provide SSE fallback, monitor connection health, surface status indicators.
- **Accessibility regressions in rapid UI updates:** Automated axe checks per build, manual audits per milestone, regression checklist ownership.
- **Template render worker backlog:** Cache popular styles, scale workers horizontally, expose progress indicators to users.
- **External API quota exhaustion:** Track Neynar/Zora usage, implement exponential backoff, elevate admin alerts with actionable guidance.
- **Social proof fatigue:** Run experiments on reminder cadence, provide granular opt-outs, monitor engagement vs. opt-out rates.

## Open Questions & Future Considerations
- Introduce collaborative cursors and multi-user editing in Template Studio and Calendar after Phase 5 stability.
- Explore AI-assisted template suggestions and copy guidance leveraging performance analytics and social graph data.
- Plan localization (copy keys, date/time formats) ahead of global expansion, including RTL considerations.
- Evaluate Farcaster Frames integration for interactive share cards within the feed.
- Assess advanced account abstraction, session keys, and monetization features post-v1.

## Appendices & Reference Documents
- docs/comprehensive-design-document.md
- docs/design-system/shadcn-component-mapping.md
- docs/user-journeys/journey-specifications.md
- docs/technical-specifications/api-contracts.md
- docs/integration-guides/tui-image-editor-integration.md
- docs/implementation-roadmap.md
- docs/full_frontend_research_ux_design_plan_onchain_mini_app_final_merged_compose_v_3.md
