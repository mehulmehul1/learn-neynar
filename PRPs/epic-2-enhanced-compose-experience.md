name: "Epic 2 - Enhanced Compose Experience PRP"
description: |
  Comprehensive implementation plan for rebuilding the compose tray with autosave, template bridge,
  scheduling, ticker validation, and offline resilience aligned to Epic 2 requirements.

---

## Goal
Deliver a modular, autosaving compose tray that unifies drafting, template selection, scheduling, ticker validation,
analytics, and offline conflict recovery so creators can move from idea to scheduled coin or cast in under 45 seconds
with resilient UX across connectivity states.

## Why
- Fulfills Epic 2 objectives for a production-ready compose workflow with autosave, scheduling, and validation (docs/epics/epic-2-enhanced-compose-experience.md).
- Aligns with detailed story requirements (Story 2.1-2.5) for autosave, template bridge, scheduling drawer, ticker feedback, and offline conflict resolution (docs/prd/story-2-1-compose-structure-autosave.md, docs/prd/story-2-2-template-selector-bridge.md, docs/prd/story-2-3-scheduling-drawer.md, docs/prd/story-2-4-ticker-validation-feedback.md, docs/prd/story-2-5-offline-draft-conflict.md).
- Supports Journey 2 UX blueprint, spacing, and accessibility patterns (docs/user-journeys/journey-specifications.md lines 77-218).
- Leverages existing backend orchestration for drafts, scheduling, and tickers while extending required endpoints (src/index.ts, docs/technical-specifications/api-contracts.md).

## What
- Replace legacy ComposeForm with a shadcn-based layout: mode tabs, content editor, template preview, scheduling drawer trigger, analytics hooks.
- Autosave drafts to IndexedDB with optimistic backend sync, queueing offline mutations, and live status badges.
- Integrate template selector (Command palette plus Dialog) with inline preview, metadata persistence, and offline caching of thumbnails.
- Implement scheduling drawer (Sheet) with timezone-safe calendar, auto-slot suggestions, real-time conflict warnings, and queue summary updates.
- Provide ticker validation hook with debounced REST calls, WebSocket or SSE fallback, sponsorship insight, and analytics logging.
- Surface conflict resolution modal that compares local versus server drafts, offers merge or overwrite, and links to support docs.
- Instrument analytics events (compose_autosave, template_picker.open, template_picker.select, ticker_check, draft_conflict) and ensure accessibility announcements for each state.

### Success Criteria
- [ ] Autosave persists to IndexedDB and /api/sync/drafts with status badge transitions (idle -> saving -> saved or error).
- [ ] Template selector Command palette supports search, favorites, previews, offline fallback, and analytics.
- [ ] Scheduling drawer surfaces timezone-aware picker, auto-slot suggestions, conflict resolution, and persists metadata.
- [ ] Ticker validation throttles to <=30 per minute, renders status badges, sponsorship info, and emits analytics with latency.
- [ ] Offline conflicts trigger modal with merge or overwrite, diff summary, and successful replay after reconnect.
- [ ] Compose flow passes accessibility scan (focus order, aria-live announcements) and autoplay tests.

## All Needed Context
```yaml
# MUST READ - Include these in your context window
- file: docs/epics/epic-2-enhanced-compose-experience.md
  why: Epic scope, dependencies, and acceptance gates for the compose revamp.

- file: docs/prd/story-2-1-compose-structure-autosave.md
  why: Autosave and tab layout requirements, analytics event names, offline expectations.

- file: docs/prd/story-2-2-template-selector-bridge.md
  why: Template selector UX, API usage, analytics, offline degradation modes.

- file: docs/prd/story-2-3-scheduling-drawer.md
  why: Drawer behavior, timezone handling, auto-slot expectations, API contracts.

- file: docs/prd/story-2-4-ticker-validation-feedback.md
  why: Validation cadence, status taxonomy, rate limits, analytics payloads.

- file: docs/prd/story-2-5-offline-draft-conflict.md
  why: Conflict detection model, modal behavior, analytics, support linkage.

- file: docs/user-journeys/journey-specifications.md
  why: Layout grids, responsive breakpoints, accessibility cues for Journey 2 compose flow.

- file: docs/design-system/shadcn-component-mapping.md
  why: Required shadcn patterns (Tabs, Command, Sheet, Calendar) and React Query caching defaults.

- file: docs/technical-specifications/api-contracts.md
  why: REST contracts for drafts, templates, scheduling, ticker availability, autosave sync, idempotency.

- file: docs/integration-guides/tui-image-editor-integration.md
  why: Offline caching expectations for template thumbnails or media edits referenced by compose.

- file: web/components/compose-form.tsx
  why: Current compose baseline, API usage, wallet handling, upload flows to migrate.

- file: web/components/providers.tsx
  why: QueryClient instantiation to enhance with offline persistence and global retry policies.

- file: src/index.ts
  why: Express routes for uploads, drafts, scheduling, ticker management scaffold to extend.

- doc: https://ui.shadcn.com/docs/components/tabs
  section: Component usage and accessibility
  critical: Ensures mode tabs preserve keyboard navigation and roving focus.

- doc: https://ui.shadcn.com/docs/components/command
  section: Command palette patterns
  critical: Guides template selector search, favorites, and keyboard behavior.

- doc: https://ui.shadcn.com/docs/components/sheet
  section: Sheet usage
  critical: Provides focus trapping and responsive behavior for scheduling drawer.

- doc: https://blog.openreplay.com/powering-an-offline-ready-application-with-react-query-tips-and-best-practices/
  why: Best practices for combining React Query with offline caching, mutation queues, and sync loops.

- doc: https://tanstack.com/query/latest/docs/framework/react/guides/network-mode
  section: networkMode and offline retries
  critical: Configure React Query to use offlineFirst mutations and background sync for autosave.

- doc: https://tanstack.com/query/latest/docs/framework/react/guides/window-focus-refetching
  section: focusManager integration
  critical: Resume validations and scheduling refresh when window regains focus without spamming APIs.

- doc: https://github.com/jakearchibald/idb-keyval#readme
  section: Usage examples
  critical: Simple IndexedDB helpers for autosave persistence and cached thumbnails.

- doc: https://github.com/TanStack/query/tree/main/packages/query-sync-storage-persister
  section: createSyncStoragePersister
  critical: Persist query cache (drafts, templates, schedule) to IndexedDB for offline resume.

- doc: https://moment.github.io/luxon/#/math?id=handling-invalid-datetimes
  section: Handling invalid datetimes
  critical: Manage DST transitions and invalid wall times for scheduling drawer.
```

### Current Codebase tree (partial focus areas)
```bash
$ tree /A /F web\components
Folder PATH listing for volume Acer
Volume serial number is 362D-57DE
C:\USERS\MEHUL\ONEDRIVE\DESKTOP\DAILY-CODE\LEARN-NEYNAR\WEB\COMPONENTS
|   compose-form.tsx
|   header-wallet.tsx
|   Layout.tsx
|   providers.tsx
|   siwn-button.tsx
|   siwn-status.tsx
|   wallet-status.tsx
|
\---ui
        Button.tsx
        Card.tsx
        EmptyState.tsx
        Input.tsx

$ tree /A /F src
Folder PATH listing for volume Acer
Volume serial number is 362D-57DE
C:\USERS\MEHUL\ONEDRIVE\DESKTOP\DAILY-CODE\LEARN-NEYNAR\SRC
    index.ts
    neynarClient.ts
    zoraService.ts
```

### Desired Codebase tree with files to be added and responsibility of file
```bash
web/
  components/
    compose/
      ComposeTray.tsx              # Main tray orchestrator, replaces ComposeForm layout
      ModeTabs.tsx                 # Shadcn Tabs with per-mode form state preservation
      ContentEditor.tsx            # Rich text and media editor with autosave status indicator
      TemplateSelector.tsx         # Command palette plus dialog for templates
      TemplatePreview.tsx          # Inline preview rendering plus skeleton fallback
      SchedulingDrawer.tsx         # Sheet with calendar, timezone selector, auto-slot list
      TickerStatus.tsx             # Badge plus sponsorship summary tied to validation hook
      OfflineConflictModal.tsx     # Merge or overwrite modal with diff summary
      AnalyticsHooks.ts            # Helper to emit analytics events consistently
    ui/
      CalendarHeatmap.tsx          # Wrapper around shadcn calendar with heatmap overlay
      Toast.tsx                    # Unified toast notifications (validation, autosave errors)
  hooks/
    useDraftAutosave.ts            # Autosave and IndexedDB persistence plus mutation queue
    useTemplateBridge.ts           # Queries templates and handles optimistic metadata persistence
    useScheduling.ts               # React Query hooks for calendar view, auto-slots, conflicts
    useTickerValidation.ts         # Debounced availability checks plus SSE subscription
  lib/
    query-client.ts                # QueryClient factory with offline persistence and retry policy
    drafts-storage.ts              # IndexedDB helpers (idb-keyval wrappers) for draft payloads
    templates-api.ts               # Client for templates endpoints and render API
    scheduling-api.ts              # Client wrappers for calendar endpoints
    ticker-api.ts                  # Client wrappers for ticker endpoints
    analytics.ts                   # Event dispatcher plus payload schemas
    offline-queue.ts               # Mutation queue and replay helpers for autosave and scheduling
  state/
    compose-machine.ts             # Optional state machine for compose status transitions
  tests/
    compose/
      useDraftAutosave.test.ts     # Unit tests for autosave hook (vitest)
      useScheduling.test.ts        # DST and conflict handling tests
      useTickerValidation.test.ts  # Debounce and rate-limit tests

scripts/
  setup-shadcn-components.ts       # Optional helper script to batch add shadcn primitives

Context-Engineering-Intro/PRPs/
  epic-2-enhanced-compose-experience.md  # This PRP
```

### Known Gotchas of our codebase & Library Quirks
```python
# CRITICAL: Wagmi Base network - compose must guard against wrong chain states (web/components/compose-form.tsx).
# CRITICAL: Backend scheduling APIs currently in-memory (src/index.ts); ensure idempotency keys when extending.
# CRITICAL: React Query QueryClient is global in providers.tsx - re-instantiating per render will drop cache; use singleton.
# CRITICAL: File uploads rely on /uploads/pinata/sign with fallbacks; preserve retry cascade.
# CRITICAL: Rate-limit ticker validation to <=30/minute; throttle and cancel stale requests.
# CRITICAL: Offline drafts require revision plus updatedAt for conflict detection (docs/prd/story-2-5 and api-contracts).
# CRITICAL: Zora coin preview requires metadataUri starting with ipfs://; keep validation before send.
```

## Implementation Blueprint

### Data models and structure
- Define ComposeDraft (mode, content, templateId, scheduling metadata, ticker, autosaveStatus, revision, updatedAt).
- Create TemplateSummary (id, name, previewUrl, favorite, permissions) matching templates API.
- Represent ScheduleMetadata (scheduledFor, timezone, autoSlotId, queueCollisions[]).
- Model TickerState (status: idle|checking|available|conflict|sponsored|error, latencyMs, sponsorship).
- Persist autosave payload { draftId?, tempId, mode, fields, templateMeta, scheduleMeta, tickerMeta, revision, updatedAt } in IndexedDB via drafts-storage.ts.
- Extend analytics schema in analytics.ts for event payload validation (zod).

### list of tasks to be completed to fullfill the PRP in the order they should be completed
```yaml
Task 1:
  UPDATE web/package.json:
    - Add lint and test tooling (eslint, @typescript-eslint, vitest, @testing-library/react) and real scripts.
  UPDATE package.json (root):
    - Add shared lint or test scripts where backend coverage is needed.
  ADD scripts/setup-shadcn-components.ts (optional helper) or document manual shadcn CLI commands.

Task 2:
  UPDATE web/components/providers.tsx:
    - Use factory from new lib/query-client.ts.
    - Configure QueryClient with retry and backoff per docs/design-system/shadcn-component-mapping.md.
    - Add React Query persistence via createSyncStoragePersister (IndexedDB) plus network and focus handlers.
  ADD web/lib/query-client.ts.

Task 3:
  ADD web/lib/drafts-storage.ts:
    - Wrap idb-keyval to store or retrieve drafts by tempId or draftId.
    - Provide change feed subscription for autosave status badges.
  ADD web/lib/offline-queue.ts for queued mutations and replay.

Task 4:
  ADD web/hooks/useDraftAutosave.ts:
    - Debounce form changes, persist to IndexedDB, enqueue optimistic mutation to /api/sync/drafts when online.
    - Expose status, error, lastSavedAt, triggerSync, resolveConflict helpers.
  ADD web/hooks/useNetworkStatus.ts if needed (navigator.onLine plus event listeners).

Task 5:
  ADD shadcn primitives (Tabs, Command, Sheet, Calendar, Dialog, Toast, Badge, Popover) via npx shadcn@latest add ....
  ADD web/components/ui/Toast.tsx for consistent notifications.

Task 6:
  CREATE web/components/compose/ directory with ComposeTray and subcomponents:
    - ModeTabs: wrappers for Tabs storing per-mode form state (React Hook Form or controlled state map).
    - ContentEditor: inputs, media upload pipeline reuse, autosave badge.
    - TemplateSelector and TemplatePreview: Command palette bridging to new templates hook.
    - SchedulingDrawer: Sheet containing calendar, timezone select (Luxon), auto-slot list, conflict callouts.
    - TickerStatus: input plus badge plus sponsorship details.
    - OfflineConflictModal: diff viewer with merge or overwrite actions (calls useDraftAutosave.resolveConflict).
    - AnalyticsHooks: central useComposeAnalytics() to emit events.
  UPDATE web/app/create/page.tsx to render new ComposeTray.

Task 7:
  ADD web/lib/templates-api.ts and web/hooks/useTemplateBridge.ts:
    - Query /api/templates and /api/templates/render, handle offline thumbnail cache.
    - Manage favorites, optimistic selection persistence, analytics triggers.

Task 8:
  ADD web/lib/scheduling-api.ts and web/hooks/useScheduling.ts:
    - Wrap /api/calendar/view, /api/calendar/auto-slots, /api/calendar/bulk-schedule, /api/calendar/drag-reschedule.
    - Normalize times with Luxon, handle DST invalid times, compute collision or resolution guidance.
    - Provide React Query caches keyed by fid plus weekStart.

Task 9:
  ADD web/lib/ticker-api.ts and web/hooks/useTickerValidation.ts:
    - Debounce POST /api/tickers/check-availability (abortable fetch).
    - Integrate SSE/WebSocket channel ticker:availability when online, fallback to polling.
    - Enforce rate limits (cooldown) and analytics emission.

Task 10:
  UPDATE src/index.ts:
    - Ensure endpoints for templates, scheduling, ticker exist or add stubs aligning to contracts.
    - Implement /api/sync/drafts conflict response if missing, plus ticker check or reserve bridging.
    - Add autosave analytics logging pipeline.

Task 11:
  ADD tests in web/tests/compose/ directory using vitest and @testing-library/react:
    - Autosave hook offline or online transitions.
    - Ticker validation debounce and 429 handling.
    - Scheduling DST logic and conflict resolution decisions.
  ADD backend tests (if feasible) for conflict endpoint (supertest) to new tests file.

Task 12:
  UPDATE docs:
    - Document compose workflow in README or docs (for example, docs/runbooks/compose.md).
    - Update support runbook references to new conflict modal link.
  ADD developer instructions for running lint, typecheck, tests.
```

### Per task pseudocode as needed added to each task
```python
# Task 4 and 6 - Autosave hook integration (TypeScript pseudocode)
def useDraftAutosave(draftId: Optional[str]):
    syncDraft = useSyncDraftMutation()
    status = useState('idle')
    def saveLocal(payload):
        status.set('saving')
        await draftsStorage.put(tempId, payload)
        status.set('saved')
    def queueSync(payload):
        if not navigator.onLine:
            offlineQueue.enqueue('draft', payload)
            return
        try:
            await syncDraft(payload, networkMode='always')
        except error:
            status.set('error')
            analytics.track('compose_autosave_failure', {'reason': error.code})
    useEffect(lambda: offlineQueue.onReconnect(lambda replay: syncDraft(replay)), [])
    return { 'status': status.value, 'saveLocal': saveLocal, 'queueSync': queueSync, 'resolveConflict': resolveConflict }

# Task 8 - Scheduling conflict handling
def handleScheduleSubmit(formState):
    payload = buildSchedulePayload(formState)
    result = await bulkScheduleMutation.mutateAsync(payload)
    if result.conflicts:
        setConflicts(result.conflicts)
        toast.warn('Conflicts detected')
    else:
        analytics.track('compose_schedule_success')

# Task 9 - Debounced ticker validation
debouncedValidate = debounce(async value => {
    if not value:
        setTickerState({'status': 'idle'})
        return
    setTickerState({'status': 'checking'})
    response = await tickerCheckMutation.mutateAsync({'ticker': value})
    setTickerState(mapResponseToState(response))
}, 400)

# Task 6 - ComposeTray orchestrator
function ComposeTray():
    autosave = useDraftAutosave(currentDraftId)
    template = useTemplateBridge(currentDraftId)
    scheduling = useScheduling(currentDraftId)
    ticker = useTickerValidation(form.ticker)
    return Layout(
        ModeTabs(...),
        ContentEditor(...),
        TemplateSelector(...),
        TemplatePreview(...),
        SchedulingDrawer(...),
        TickerStatus(...),
        OfflineConflictModal(...)
    )
```

### Integration Points
```yaml
BACKEND:
  - Ensure Express routes implement:
      POST /api/sync/drafts            # conflict-aware autosave sync
      GET /api/templates               # template listing with favorites
      POST /api/templates/render       # preview generation
      GET /api/calendar/view           # scheduling calendar with heatmap
      GET /api/calendar/auto-slots     # suggested slots
      POST /api/calendar/bulk-schedule # queue submission with idempotency keys
      POST /api/tickers/check-availability
      POST /api/tickers/reserve        # optional reservation flow
  - Add WebSocket or SSE channel ticker:availability if real-time push desired.

FRONTEND CONFIG:
  - Update shadcn CLI config to include new components.
  - Configure React Query persistence (IndexedDB) via query-client.ts.
  - Provide Luxon timezone helpers (DateTime.local().setZone(...)).

ANALYTICS:
  - Define analytics dispatcher (Segment or Amplitude placeholder) in web/lib/analytics.ts.
  - Map events: compose_autosave, compose_autosave_failure, template_picker.open, template_picker.select, schedule_drawer.open, schedule_drawer.apply, ticker_check, draft_conflict.

ACCESSIBILITY:
  - Use aria-live="polite" for autosave and ticker status badges.
  - Ensure Sheet and Dialog components manage focus trap; add aria-describedby for conflict modal diff summary.
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Frontend
cd web
npm install
npm run lint
npm run typecheck

# Backend
cd ..
npm install
npm run typecheck
```

### Level 2: Unit Tests each new feature/file/function use existing test patterns
```bash
cd web
npm run test -- --watch=false

cd ..
npx vitest run tests/backend --runInBand  # if backend tests added
```
- Compose autosave tests: simulate offline or online transitions, ensure queued mutations replay.
- Scheduling tests: mock calendar API to verify DST conflict handling.
- Ticker validation tests: ensure debounce and rate limiting logic.

### Level 3: Integration Test
```bash
# Start backend and frontend
npm run dev    # backend (port 3000)
cd web && npm run dev  # frontend (port 3001)

# Manual QA checklist
# 1. Draft in coin mode, disconnect network, confirm autosave badge shows "queued" and conflict modal on reconnect.
# 2. Select template from Command palette, verify preview updates and analytics event logs.
# 3. Schedule draft with auto-slot, ensure drawer shows conflict guidance when overlapping slot exists.
# 4. Type ticker rapidly (>30/min) confirm debounce prevents extra calls and sponsorship info surfaces.
# 5. Run accessibility scan (for example, Lighthouse CI or axe DevTools) focusing on compose tray.
```

## Final validation Checklist
- [ ] Frontend lint, typecheck, and test scripts pass (`npm run lint`, `npm run typecheck`, `npm run test`).
- [ ] Backend typecheck and tests pass (`npm run typecheck`, targeted integration tests).
- [ ] Manual offline and online autosave scenarios verified.
- [ ] Scheduling drawer handles DST edge cases and collisions gracefully.
- [ ] Ticker validation respects rate limits and announces status via aria-live.
- [ ] Analytics events fire with required payloads (validate via mock logger).
- [ ] Documentation and support runbook updated with new compose flow and conflict resolution link.

## Quality Checklist
- [x] All necessary context included
- [x] Validation gates are executable by AI
- [x] References existing patterns and backend contracts
- [x] Clear implementation path with ordered tasks
- [x] Error handling documented (autosave queue, ticker rate limits, conflict modal)

## Anti-Patterns to Avoid
- Do not bypass IndexedDB autosave when online; always persist locally first for resilience.
- Do not create bespoke API clients; reuse centralized libs (templates-api, scheduling-api, ticker-api).
- Do not ignore rate-limit responses; surface guidance and back off before retrying tickers.
- Do not mount new QueryClient instances per render; use singleton pattern.
- Do not swallow conflict responses; must trigger modal with actionable diff.
- Do not hardcode timezones; rely on Luxon and backend metadata.

Confidence Score: 7/10
