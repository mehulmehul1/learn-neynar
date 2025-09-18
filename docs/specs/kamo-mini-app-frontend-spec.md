# Kamo Mini App — Front-End Spec (v1.1)

Summary
- Build a Base Mini App (Farcaster) UI for Kamo focused on rapid, viral coin creation and sharing. v1 prioritizes MA‑2 (EOA “Create Now”) with preparation for scheduling and session keys. UX follows Base Mini Apps best practices and leverages shadcn/ui + OnchainKit.

Status
- v1.1 — Approved for implementation (styling polish pending)

Canonical References
- Base
  - Essential docs: https://docs.base.org/cookbook/essential-documentation-resources
  - AI‑assisted doc reading: https://docs.base.org/cookbook/ai-assisted-documentation-reading
  - Onboard any user: https://docs.base.org/cookbook/onboard-any-user
  - Base App Coins: https://docs.base.org/cookbook/base-app-coins
  - Mini Apps overview: https://docs.base.org/mini-apps/overview
  - Mini Apps quickstart (existing apps): https://docs.base.org/mini-apps/quickstart/existing-apps/install
  - Mini Apps LLM deep guide: https://docs.base.org/mini-apps/llms-full.txt
  - OnchainKit getting started: https://docs.base.org/onchainkit/getting-started
  - Mini Apps design best practices: https://docs.base.org/mini-apps/design-ux/best-practices
  - Mini Apps context: https://docs.base.org/mini-apps/features/context
- Zora Coins
  - Overview: https://docs.zora.co/coins
  - SDK: https://docs.zora.co/coins/sdk
- Demos & UI
  - Base demo (MiniKit + Zora): https://github.com/base/demos/tree/master/minikit/my-mini-zora
  - shadcn MCP: https://ui.shadcn.com/docs/mcp
- Internal
  - Mini app LLM notes: docs/doc-miniapp-llm.txt
  - Epic: docs/epics/mini-app-adaptation.md
  - Story (MA‑2): docs/stories/ma-2-eoa-create-now.md
  - PRP: docs/prp-mini-app-adaptation.md
  - Scheduler plan: docs/miniapp-scheduler-plan.md
  - Zora scheduler plan: docs/zora-coin-scheduler-plan.md
  - Zora notes: docs/notes-zora-coins.md
  - Services: src/zoraService.ts, src/neynarClient.ts

Product Overview
- One‑liner: Create and share coins in seconds, right inside Farcaster.
- Audience: Farcaster users and creators exploring Base/Zora social tokens.
- Context: Runs as a Base Mini App; mobile‑first; fast “create → share” loop.

Goals & Success (v1.1)
- Primary: User‑signed “Create Now” on Base completes in <30s and ends with a share action in‑app.
- Secondary: Maintain existing server‑paid scheduling; lay groundwork for session keys.
- KPIs (proposed):
  - Create conversion rate (preview → send tx → success)
  - Share rate (post‑success share CTA clicks)
  - Time‑to‑first‑value (open → coin created)
  - Error rate by step (preview/send/confirm)

Scope (v1.1)
- In: EOA “Create Now” (MA‑2), minimal queue read, status panels (env, chain, identity), simple share.
- Out: Session keys & paymaster (tracked in epic), advanced analytics, multi‑asset metadata builder UI.

Information Architecture
- Routes (Next.js App Router):
  - `/app` — Mini App home: Create Now flow + success share.
  - `/queue` — Read‑only upcoming/past jobs (server‑paid path), linkouts.
  - Optional `/zora` — Dev panel for profile/coins lookup.
- Global UI shell: `Layout.tsx` with top nav kept minimal in Mini App context.

Primary Flows
1) EOA “Create Now” (MA‑2)
   - Inputs: Title, Symbol (auto from title), Description, Media (optional), Creator Address (prefilled via identity mapping; editable).
   - Steps: Preview call → wallet `sendTransaction` → confirm → success share.
   - Errors: Input validation, chain mismatch, wallet cancel, tx failure.
2) Server‑paid Scheduled (existing)
   - Keep minimal visibility in `/queue`; do not regress.
3) Share / Viral Loop
   - After success: copyable link and “Share to Farcaster” CTA. Encourage lightweight brag with thumbnail/metadata.

Mini App UX Best Practices (applied)
- Defer prompts: No wallet prompt on open. Prompt only on Preview/Send.
- Use client context: Prefill name/avatar/address when available; treat as hints only.
- Short paths: 1 screen for inputs → 1 sheet for preview → native tx tray.
- Clear intent copy: “You’ll publish a coin on Base. You’ll pay gas.”
- Resilience: Handle declines gracefully; keep inputs; offer retry.
- Performance: Skeletons for metadata build and queue; optimistic UI where safe.

Component Inventory (shadcn/ui mapping)
- Form: `Input` (title, symbol), `Textarea` (description), `FileInput` or custom dropzone, date/time picker (future), `Button` (primary, outline), `Switch` (future AA toggle), `Select` (currency if needed).
- Feedback: `Toast` (success/error), `Alert` (inline form errors), `Skeleton` (loading), `Spinner`.
- Overlays: `Sheet` or `Dialog` for preview and confirmations.
- Identity: `WalletStatus` (existing), SIWN status (Neynar) panel.
- OnchainKit: ConnectButton/Account + chain guard; Base 8453 enforced.

State & Edge Cases
- Loading: Preview building call, metadata pinning.
- Errors: Validation (title required), network, chain mismatch, missing signer/wallet, tx revert.
- Empty: No jobs in `/queue` → show friendly empty state.
- Disabled: Actions disabled while pending; dedupe by idem.

Copy Guidelines (examples)
- Primary CTA: “Create coin on Base”
- Preview: “This prepares your transaction. You’ll review and confirm in your wallet.”
- Success: “Coin created! Share it with friends.” [Copy link] [Share on Farcaster]
- Errors: Keep actionable and brief. “Switch to Base to continue.” “Upload failed — try a smaller image.”

Analytics & Telemetry (proposed)
- `view_page:{/app,/queue}`
- `wallet_connect`, `chain_switch_prompted`, `chain_switch_confirmed`
- `create_preview_request`, `create_preview_success`, `create_preview_error`
- `tx_send_clicked`, `tx_submitted`, `tx_succeeded`, `tx_failed`
- `share_cta_clicked`, `share_completed`

Accessibility & Performance
- Targets: Keyboard operable, color contrast AA, reduced motion respects prefers‑reduced‑motion.
- Focus order preserved across sheet/dialog transitions.
- Labels and aria‑live for async updates (e.g., “Transaction submitted…”).

Technical Integration
- Framework: Next.js App Router (TS). shadcn/ui for components. wagmi + viem + OnchainKit for Base chain. MiniKit optional integration as host context matures.
- Chain: Base mainnet `8453` primary; Base Sepolia optional for dev.
- Identity:
  - Neynar SIWN or read‑only status for FID; resolve creator address via `NeynarService.resolveWalletForFid()` with user override.
- Zora Coins (SDK):
  - Preview: backend `POST /zora/coins/call/preview` → returns `{ to, data, value, chainId }` via `ZoraService.buildCreateCoinCall()`.
  - Send: client `walletClient.sendTransaction({ to, data, value, chainId })`.
  - Confirm: backend `POST /zora/coins/create/confirm` records `{ txHash, coinAddress }`.
  - Metadata: Pin via Pinata (existing flows) → use `ipfs://<cid>` for `metadataUri`.
- Mini App Manifest:
  - Serve `/.well-known/farcaster.json` with `miniapp` block and `accountAssociation` proof.
  - `homeUrl` → `/app`; `buttonTitle` concise; splash image/color optional.

Wireframe Outlines (textual)
- /app
  - Header: Kamo | WalletStatus
  - Card: “Create a coin”
    - Title [Input], Symbol [Auto/Editable], Description [Textarea], Media [Upload]
    - [Preview & Create] (primary)
  - Sheet: “Review & confirm” → shows name/symbol/fees → [Send]
  - Success state: Hash + coin address + [Copy link] [Share]
- /queue
  - Table: When | Title | Status | Tx | Error | Actions

Environment
- NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_BASE_CHAIN_ID, NEXT_PUBLIC_ONCHAINKIT_API_KEY
- Backend: NEYNAR_API_KEY, ZORA_API_KEY, PINATA_JWT, PINATA_GATEWAY_DOMAIN

Additions for v1.1
- Explicit validation rules (Title/ Symbol/ Description/ Metadata URI/ Chain 8453)
- Detailed preview sheet spec (to/data/value visualization and fee hint)
- Success view share template and copy guidance
- Accessibility acceptance (WCAG AA, keyboard flow)

Open Questions (for PO/Eng)
- Brand tone, colors, typography? (3–5 adjectives)
- Exact viral mechanic: share text template, image preview, post‑success incentives?
- Do we expose currency choice or lock to ZORA?
- Any legal disclaimers required for coin creation?
- Analytics provider preference (Plausible/PostHog/custom)?

References (inline file anchors)
- src/zoraService.ts:1 — Zora SDK integration (build call, create coin)
- src/neynarClient.ts:1 — Neynar client, publish, signer lookup, wallet resolution
- docs/epics/mini-app-adaptation.md:1 — Epic and story scope
- docs/stories/ma-2-eoa-create-now.md:1 — API contract and acceptance criteria
- docs/miniapp-scheduler-plan.md:1 — Current scheduler and infra notes

---

Implementation Notes (v1.1 specifics)
- API Contracts (frontend usage)
  - POST `/zora/coins/metadata` → `{ cid, uri }` used to fill Metadata URI
  - POST `/zora/coins/call/preview` → `{ to, data, value, chainId }` used for wallet `sendTransaction`
  - POST `/zora/coins/create/confirm` → acknowledges `{ ok: true }` after wallet send
  - GET `/zora/coins/queue` → read‑only table
  - GET `/auth/wallet` → identity panel (optional)
- Error Handling
  - Map 400/422 to inline validation messages; 500 to toast with retry
  - Preserve inputs in local component state; never clear on error
- Accessibility
  - Ensure focus moves to Sheet on open; return focus to trigger on close
  - Add aria‑labels for “Preview & Create”, “Send”, “Share to Farcaster”
- Copy Templates
  - Share default: “I just launched a coin on Base via Kamo. Check it out: <link> #Base #Zora”


---

## UI/UX Specification (BMAD Template v2)

### Introduction
This document defines the user experience goals, information architecture, user flows, and visual design specifications for Kamo Mini App’s user interface. It serves as the foundation for visual design and frontend development, ensuring a cohesive and user‑centered experience.

#### Overall UX Goals & Principles (Draft)

Target User Personas
- Creator (primary): Farcaster user who wants to launch a coin quickly and share it immediately. Values speed, simplicity, and social proof.
- Explorer (casual): Curious user who tries a creation once; needs clear guidance, defaults that “just work,” and easy exit/retry.
- Power User (advanced): Web3‑savvy creator who expects chain awareness, predictable fees, and manual override for addresses/params.

Usability Goals
- Time‑to‑first‑value: Complete “Create Now” in under 30s from open to success.
- Efficiency: One input screen → one preview sheet → native wallet tray.
- Error prevention: Enforce Base 8453; validate title/symbol; clear destructive confirmations.
- Memorability: Infrequent users can re‑create without relearning; sensible defaults.
- Accessibility: Meet WCAG AA color contrast; operable with keyboard/screen readers.

Design Principles (proposed)
1. Clarity over cleverness — direct, actionable copy; explain costs and outcomes.
2. Progressive disclosure — show only what’s needed now; advanced options later.
3. Short paths — minimize steps; reduce modals; keep decision points obvious.
4. Immediate feedback — optimistic UI where safe; toasts/states for async actions.
5. Accessible by default — mobile‑first, high contrast, motion‑aware, screen‑reader labels.

Rationale
- Trade‑offs: We prioritize EOA “Create Now” for v1 to maximize time‑to‑value, deferring session keys/paymaster (tracked in epic). This biases towards a shorter flow with fewer toggles.
- Assumptions: Users are mostly on Base or willing to switch; Farcaster share is the primary viral loop; identity hints (FID → wallet) are available but editable.
- Risks: Chain switch friction; media upload latency; unclear share mechanics could reduce virality; failure states must retain user inputs.
- Validation needed: Final brand tone/colors; exact share template/mechanics; whether currency choice is fixed to ZORA for v1.

### Information Architecture (IA) — Draft For Review

Site Map / Screen Inventory (Mermaid)
```mermaid
graph TD
    A[Mini App Home (/app)] --> B[Create Now Flow]
    A --> C[Queue (/queue)]
    A --> D[Zora Dev Panel (/zora) — optional]
    B --> B1[Preview & Send]
    B --> B2[Success & Share]
    C --> C1[Upcoming Jobs]
    C --> C2[Past Jobs]
```

Navigation Structure
- Primary Navigation: Minimal top header within Mini App host. Entry at `/app`. Link to `/queue` via secondary link or dev/debug affordance.
- Secondary Navigation: Contextual actions within screens (e.g., View Queue, Retry, Share). No persistent side nav in Mini App context.
- Breadcrumb Strategy: None (flat, shallow IA). Use clear titles and back affordances where hosted UI provides it.

Rationale
- Structure mirrors Base Mini App constraints: small surface, shallow IA, and host-provided chrome. Keeping routes to `/app` and a lightweight `/queue` minimizes cognitive load.
- Separate “Dev Panel (/zora)” remains optional to avoid cluttering user flow while enabling developer troubleshooting.
- Mermaid map encodes the short path expectation: input → preview → wallet → share.
