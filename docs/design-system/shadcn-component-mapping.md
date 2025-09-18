# shadcn/ui Component Mapping

This document defines the complete migration plan from the current custom UI library to shadcn/ui for all eleven user journeys captured in `docs/full_frontend_research_ux_design_plan_onchain_mini_app_final_merged_compose_v_3.md`. Follow each section closely—these specifications replace the prior high-level notes and establish the design system contract for web and mobile surfaces.

## Component Patterns vs. Primitives
Not every UI requirement maps to an official shadcn-generated component. The following items are considered patterns that combine shadcn primitives and supporting libraries; do not expect the shadcn CLI to scaffold them automatically.
- `DataTable`: use the shadcn table primitives composed with TanStack Table v8 for sorting, filtering, and pagination.
- `Toolbar`: compose shadcn `Toggle`/`ToggleGroup`, `Separator`, and flex layouts to emulate a toolbar surface.
- `AvatarGroup`: layer shadcn `Avatar` components with `Tooltip` for overflow counts and presence indicators.
- `Timeline`: implement with shadcn list primitives (e.g., `List`, `Stepper` pattern) plus iconography to communicate progression.

## Enhanced Component Migration Specifications
- `web/components/ui/Card.tsx`
  - Replace with shadcn `Card`, `CardHeader`, `CardContent`, and `CardFooter` to standardize structure.
  - Provide variants for queue items (status chip + metrics row), coin cards (price trend, supply, participation), template previews (thumbnail, edit controls), and success sheets (checkmark header, action footer).
  - Support interactive states: hover elevation, drag handle affordances, calendar drag-drop focus rings, and keyboard reordering with accessible handle controls.
  - Accept slot props for secondary metadata (time, ticker availability) and inline action menus via `DropdownMenu`.
- `web/components/ui/Button.tsx`
  - Replace with shadcn `Button` wired to the centralized variant system (`variant` + `size`). Required variants: `primary`, `secondary`, `ghost`, `destructive`, `outline`, `link`.
  - Required sizes: `sm` 32px height, `md` 40px, `lg` 44px, `icon` 40x40px square with centered glyph.
  - Include visual + ARIA loading states (spinner, `aria-busy`), success confirmations (inline checkmark), error retry states (shake animation gated by `prefers-reduced-motion`).
  - Map Neynar actions (cast, follow, queue) to `primary`/`secondary`; destructive coin/ticker removals to `destructive`.
- `web/components/ui/Input.tsx`
  - Migrate to shadcn form primitives: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `FormDescription`, and `Input`/`Textarea`.
  - Implement specialized variants: TitleCast auto-expanding textarea (min 3 lines, max 10 with scroll), Ticker input with debounced real-time validation badge, media upload field with drag-drop + thumbnail preview, schedule picker hooking into calendar slots.
  - Provide prefix/suffix icon slots plus inline helper text and error callouts aligned with research accessibility guidelines.
- `web/components/ui/EmptyState.tsx`
  - Rebuild using shadcn `Alert`. Compose `AlertTitle`, `AlertDescription`, optional call-to-action buttons, and illustration slots.
  - Variants: no drafts, no coins, no scheduled posts, offline mode (include reconnect button + status badge). Each variant supplies recommended iconography and voice tone derived from research document.

## New Component Requirements from Research Document
- **Calendar Scheduling Suite**
  - Use shadcn `Calendar` + custom drag-drop layer powered by `@dnd-kit/core` sortable utilities for slot manipulation, collision detection, and auto-queue visualization. Provide accessible drag handles, keyboard reordering, and live-region announcements for schedule changes.
  - Include heatmap overlay to surface best post times, plus backlog indicator chips for overbooked days.
  - Provide day, week, agenda views; keyboard navigation (arrow keys), and `Escape` to cancel drag. Store canonical schedule timestamps in UTC, render according to the viewer’s current timezone, and generate slots with DST-aware logic that respects forward/backward shifts. Support user preference for 12-hour or 24-hour display.
  - **Virtualization for large lists**
    - Use `@tanstack/react-virtual` for agenda and timeline views; enable `measureElement` for variable heights and normalize into 48/72/96px buckets when possible.
    - Maintain keyboard focusability, aria-rowindex, and tab order for virtualized agenda rows; announce major window changes via polite `aria-live`.
    - Keep virtualization enabled on mobile with overscan 6 to balance memory and scroll performance.
  - Agenda virtualization example:
```tsx
const agendaVirtualizer = useVirtualizer({
  count: agendaItems.length,
  getScrollElement: () => agendaRef.current,
  estimateSize: () => 64,
  measureElement: (el) => el.getBoundingClientRect().height,
  overscan: isMobile ? 6 : 8,
});
```
  - Render rows inside shadcn `ScrollArea` using `agendaVirtualizer.getVirtualItems()`, memoize row components, and avoid forced reflow during scroll.
- **Template Studio**
  - Compose with shadcn `Dialog` (desktop) and `Sheet` (mobile). Nested tabs for Layout, Styling, Metadata.
  - Include color picker (`Popover` + custom palette), font selector (Command menu), spacing controls (Slider), real-time preview canvas with 300ms render budget.
  - Provide action bar with `Button` variants for Save Draft, Publish, Preview, Duplicate.
- **TUI Image Editor Integration**
  - Wrap editor inside shadcn `Dialog` with large canvas. Tool palette uses shadcn `Toolbar` with toggle groups and layout primitives.
  - Include progress indicators (`Progress`, `Skeleton`) during asset processing, plus `Toast` feedback for save/export.
- **Enhanced Queue Management**
  - Build around shadcn `Table`, `Checkbox`, `DropdownMenu`, and TanStack Table v8 (`DataTable` pattern) for bulk actions, filtering, sorting. Leverage `@dnd-kit/core` sortable helpers for reordering queue items with keyboard-accessible handles and live updates.
  - Integrate status badges, optimistic updates, and inline schedule editing via `Popover`.
  - **Virtualization for large lists**
    - Use `@tanstack/react-virtual` with shadcn `ScrollArea` as the scroll container. Default queue row height 56px, sticky header/footer, overscan 8 on desktop and 6 below 768px.
    - Memoize cell renderers and keep aria-rowindex/tab order intact so keyboard navigation and screen readers stay reliable.
    - Announce significant window changes via a polite `aria-live` region when virtualized content shifts.
    - Avoid expensive recalculations in scroll handlers; precompute sizing and keep per-row layout static.
  - Queue virtualization example:
```tsx
const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 56,
  overscan: isMobile ? 6 : 8,
});
```
  - Render rows inside `ScrollArea.Viewport` using `rowVirtualizer.getVirtualItems()` and apply sticky header/footer classes.
- **Social Proof & Discovery**
  - Avatar groups (shadcn `Avatar`, tooltip pattern), friend discovery cards, streak badges (shadcn `Badge` + `Tooltip`), challenge participation progress tracker (`Progress`, `Timeline` pattern).
- **Real-time Feedback Components**
  - System-wide `Toast` notifications, `AlertDialog` for irreversible actions, live status badges with WebSocket updates, and `Progress` bars for uploads + template renders.

## Design Tokens from Research Document
- **Color Palette**
  - Primary `#2563EB`, Secondary `#9333EA`, Accent `#F97316`, Success `#22C55E`, Warning `#F59E0B`, Destructive `#DC2626`.
  - Neutral ramp: `#F9FAFB` (50), `#F3F4F6` (100), `#E5E7EB` (200), `#D1D5DB` (300), `#9CA3AF` (400), `#6B7280` (500), `#4B5563` (600), `#374151` (700), `#1F2937` (800), `#111827` (900), `#030712` (950).
  - Map to CSS variables via shadcn theme generator; ensure semantic tokens (`--primary`, `--primary-foreground`, etc.) respect 4.5:1 contrast.
- **Typography**
  - Font family: Inter across weights 400–700 with fallback system stack.
  - Scale: Display 28/32px, Title 20/24px, Body 16/22px, Caption 13/18px. Provide clamp-based responsive sizing for large screens.
  - Configure letter-spacing and line-height tokens in `tailwind.config.js` typography plugin.
- **Spacing**
  - Adopt 8px baseline grid with tokens at 8, 12, 16, 20, 24, 32, 40, 48px.
  - Use spacing tokens for padding/gap utilities in `tailwind.config.js` (`spacing.{token}`) to drive Template Studio layout consistency.
- **Border Radius**
  - Use Tailwind’s `rounded-2xl` for cards & primary buttons, `rounded-lg` for inputs/dialog footers, `rounded-md` for chips and badges. Extend the theme if additional custom radii are required.
- **Shadow Tokens**
  - `shadow-sm` subtle ambient for cards; `shadow-md` for interactive hover; `shadow-lg` for dialogs/sheets with tinted brand shadow.
- **Motion**
  - Prefer Tailwind utilities `duration-150`, `duration-200`, `duration-250` with `ease-out` or custom cubic-bezier per interaction. Respect `prefers-reduced-motion`.

## Accessibility Requirements
- Dynamic Type support up to 130%: ensure layout wraps gracefully, especially TitleCast fields and coin metrics. Provide text truncation fallbacks with tooltips for tickers.
- Maintain minimum contrast ratio 4.5:1 for text and interactive elements; pair color coding with iconography or text labels.
- Provide explicit screen reader labels: camera upload button “Add media”, template picker “Choose template”, ticker state announcements (symbol + availability result), remove image button with index context.
- Enforce focus order: Text → Camera → Template → Create coin → Ticker → Schedule → Preview. Document in component props and Storybook.
- Guarantee full keyboard navigation: tab order, `Enter`/`Space` activation, escape to dismiss modals, arrow key navigation in calendar and Template Studio lists.
- Implement ARIA attributes for composite widgets (calendar `grid`, template preview `region`, image editor controls with `aria-pressed`).

## Performance Considerations
- Template preview renders must resolve in <300ms; final publish render <1s. Defer heavy image filters until after initial draw.
- Ticker availability checks must return <200ms with debounced validation + optimistic badge state.
- Calendar drag-drop feedback loops within 150ms, caching availability computations client-side.
- Social proof components load within 150ms after profile fetch via prioritized data prefetching.
- Lazy load heavy modules (TUI editor, Template Studio advanced controls) with dynamic imports and suspense fallbacks.
- Cache template previews by `{styleId, titleHash}` using service worker storage; invalidate on template change events.

## State Management Patterns
- Use React Query for Neynar, Zora, and Pinata integrations with staleTime tuned per endpoint; enable optimistic updates for queue operations and ticker reservations.
- Integrate `react-hook-form` across shadcn form components for validation, submission states, and error propagation.
- Maintain WebSocket channels for queue status, calendar sync, ticker availability; emit updates to shadcn `Badge`/`Toast` components.
- Provide offline support: store drafts in IndexedDB, show offline `Alert` variant, retry failed mutations automatically when connectivity returns.

### React Query conventions
- **Canonical query keys**:
  - `['profile', fid]`
  - `['friendGraph', fid]`
  - `['tickerAvailability', symbol]`
  - `['queue', { fid }]`
  - `['queueItem', id]`
  - `['templates']`, `['template', styleId]`
  - `['templatePreview', { styleId, titleHash }]`
  - `['calendarSlots', { fid, weekStartUtc }]`
  - `['portfolio', fid]`
  - `['uploads', draftId]`
- **Query defaults**:
  - Profiles/friendGraph: `staleTime: 5 * 60_000`, `gcTime: 30 * 60_000`, `refetchOnWindowFocus: false`, `retry: 2`.
  - Ticker availability: `staleTime: 5_000`, `gcTime: 5 * 60_000`, `refetchInterval: 5_000` while focused/active input, `retry: 0` for 4xx, `retry: 3` for network/5xx.
  - Queue: `staleTime: 15_000`, `gcTime: 30 * 60_000`, `refetchOnWindowFocus: true`.
  - Templates/templatePreview: `staleTime: 60_000`, `gcTime: 60 * 60_000`.
  - Calendar slots: `staleTime: 30_000`, `gcTime: 30 * 60_000`, `refetchOnWindowFocus: true`.
- **Global retry/backoff**:
```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry(failureCount, error) {
        if (error?.status >= 400 && error?.status < 500 && ![409, 429].includes(error.status)) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: ({ attemptIndex }) => Math.min(30_000, (2 ** attemptIndex) * 500 + Math.random() * 300),
    },
  },
});
```
- **Mutation examples**:
```ts
const useReorderQueue = (fid: string) => {
  const queryClient = useQueryClient();
  return useMutation(reorderQueue, {
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['queue', { fid }] });
      const previous = queryClient.getQueryData(['queue', { fid }]);
      queryClient.setQueryData(['queue', { fid }], updater => applyReorder(updater, input));
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['queue', { fid }], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      queryClient.invalidateQueries({ queryKey: ['calendarSlots'] });
    },
  });
};
```
```ts
const useReserveTicker = (symbol: string) => {
  const queryClient = useQueryClient();
  return useMutation(reserveTicker, {
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['tickerAvailability', symbol] });
      const previous = queryClient.getQueryData(['tickerAvailability', symbol]);
      queryClient.setQueryData(['tickerAvailability', symbol], () => ({ status: 'checking' }));
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['tickerAvailability', symbol], context.previous);
      }
      if (error?.status === 409) {
        queryClient.setQueryData(['tickerAvailability', symbol], () => ({ status: 'conflict' }));
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['tickerAvailability', symbol], data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tickerAvailability', symbol] });
    },
  });
};
```
- **Refetch triggers**: WebSocket messages should call `queryClient.invalidateQueries` for impacted keys (queue status changes, calendar slot updates, ticker reservations) to keep UI in sync.
## Mobile-First Responsive Enhancements
- Touch target minimum 44x44px across buttons, icons, and drag handles; enforce via utility classes and component props.
- Gestures: swipe to reorder Template Studio layers, pinch-zoom inside image editor, long-press to open calendar context menu, drag-drop via touch-friendly handles built with `@dnd-kit/sortable`.
- Adaptive layouts: use shadcn `Sheet` for compose overlays on <768px, responsive CSS grid for queue cards, collapsible navigation rails.
- Optimize performance for mobile: reduce motion when `prefers-reduced-motion`, defer non-critical animations, monitor memory usage when TUI editor loads.
- Provide responsive typography via CSS clamps to maintain readability across device sizes.

## Component Variants and States
- **Input Variants**: TitleCast (auto-expand, word count), Ticker (live validation states: idle, checking, available, conflict), Media (drag-drop zone with progress), Schedule (datetime picker with disabled past slots).
- **Card Variants**: Queue item (status badge, countdown), Coin card (performance sparkline, followers), Template preview (editable overlays), Success sheet (celebratory animation, share CTA).
- **Button States**: Loading (spinner + `aria-live`), Success (inline checkmark, optional auto-dismiss), Error (retry + tooltip guidance), Disabled (explain via tooltip or helper text).
- **Badge Variants**: Status (`draft`, `scheduled`, `sending`, `success`, `failed`), Priority (`P0`, `P1`), Channel (`cast`, `coin`), Time (relative timestamp chips).

## Integration Specifications
- **Neynar Client**: Surface profile + friend graph data, cast creation flows, and activity feeds. Ensure rate limits handled via React Query retries and fallbacks.
- **Zora Service**: Manage coin creation, portfolio tracking, transaction status updates. Reflect progress within queue cards and toasts.
- **Pinata Integration**: Handle media uploads, template asset storage, and IPFS pin status indicators. Provide upload progress and retry controls.
- **Worker Processes**: Coordinate scheduled operations, handle retries, and emit status messages for queue/calendar components.

## Error Handling and Edge Cases
- Handle partial successes: e.g., Farcaster cast succeeds but Zora transaction fails—surface via `AlertDialog` with retry on the failed service while preserving success state.
- Provide robust network resilience: offline mode alerts, queued actions, exponential backoff for retries, and conflict resolution prompts when reconnecting.
- Deliver real-time validation errors with actionable suggestions (e.g., ticker collisions propose alternatives).
- Render fallbacks: when template render service fails, display simplified text-only template with guidance to retry or adjust content.

## Implementation Roadmap Integration
1. **Phase 1 – Foundation**: Initialize shadcn/ui CLI, configure design tokens, migrate Card/Button/Input/EmptyState, and establish Storybook coverage.
2. **Phase 2 – Compose Enhancements**: Implement queue + compose flows with new form patterns, integrate React Query + optimistic UX, deliver refined empty states.
3. **Phase 3 – Template Studio**: Launch dialog/sheet workflows, color/font controls, real-time preview performance targets, and TUI editor wrapper.
4. **Phase 4 – Scheduling**: Deliver calendar drag-drop suite, performance heatmap overlays, timezone/DST-aware scheduling, and mobile scheduling experiences.
5. **Phase 5 – Social & Real-time**: Activate social proof components, WebSocket-driven status badges, and complete responsive polish across all journeys.

## Token Implementation
```css
:root {
  --background: 255 255 255;
  --foreground: 17 24 39;
  --primary: 37 99 235;
  --primary-foreground: 255 255 255;
  --secondary: 147 51 234;
  --secondary-foreground: 255 255 255;
  --accent: 249 115 22;
  --accent-foreground: 23 23 23;
  --success: 34 197 94;
  --success-foreground: 255 255 255;
  --warning: 245 158 11;
  --warning-foreground: 17 24 39;
  --destructive: 220 38 38;
  --destructive-foreground: 255 255 255;
  --muted: 243 244 246;
  --muted-foreground: 107 114 128;
}
```

```ts
// web/tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--success) / <alpha-value>)",
          foreground: "rgb(var(--success-foreground) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--warning) / <alpha-value>)",
          foreground: "rgb(var(--warning-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
      },
      spacing: {
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
      },
      borderRadius: {
        md: "8px",
        lg: "12px",
        '2xl': "16px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(15 23 42 / 0.08)",
        md: "0 4px 12px -2px rgb(15 23 42 / 0.12)",
        lg: "0 20px 45px -12px rgb(37 99 235 / 0.35)",
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
        250: "250ms",
      },
      transitionTimingFunction: {
        ease: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['28px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
        title: ['20px', { lineHeight: '24px', letterSpacing: '-0.005em' }],
        body: ['16px', { lineHeight: '22px' }],
        caption: ['13px', { lineHeight: '18px', letterSpacing: '0em' }],
      },
    },
  },
};
```





## Acceptance checklist
### Card
- Uses `CardHeader`/`CardContent`/`CardFooter` structure
- Implements variants: queue item, coin, template preview, success sheet
- Supports keyboard reorder via accessible drag handle; focus outlines meet contrast requirements
- Hover and drag states implemented; Storybook stories cover all variants
- Performance: renders in under 16ms on average with no hover-induced layout shift

### Button
- Variants: primary, secondary, ghost, destructive, outline, link; sizes: sm, md, lg, icon (44x44 target)
- Loading state shows spinner, sets `aria-busy`, and disabled buttons use `aria-disabled` to block clicks
- Icon-only buttons provide `aria-label` and honor `prefers-reduced-motion`
- Performance: click feedback under 100ms with visible focus ring on dark and light themes

### Input/Form
- `FormLabel`, `FormDescription`, and `FormMessage` wired; inputs and textareas have matching `id`/label linkage
- TitleCast auto-expands (min 3, max 10 lines) with character counter; validation errors announced via live region
- Ticker input debounced with idle/checking/available/conflict states reflected in `['tickerAvailability', symbol]`; screen readers hear updates
- Media upload drag-drop works with keyboard; thumbnails have alt text; remove buttons labeled with index context

### EmptyState/Alert
- Uses `AlertTitle` and `AlertDescription`; optional actions rendered where provided
- Variants cover no drafts, no coins, no scheduled posts, and offline state with reconnect button
- Meets 4.5:1 contrast; decorative icons marked `aria-hidden` with supporting text
- Performance: renders in under 100ms and avoids blocking font loads


