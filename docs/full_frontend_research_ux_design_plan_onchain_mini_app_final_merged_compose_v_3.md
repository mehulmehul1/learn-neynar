# Executive Summary

**Goal.** Build a mobile-first onchain Mini App that lets creators compose, save drafts, and schedule posts to Farcaster and Zora (coins) with a fast **create → preview → send → share** loop.

**Strategy.** Follow Base Mini Apps best practices for short, social-native flows; make gas/chain clarity explicit; orchestrate Zora coin transactions with safe previews; instrument growth loops and iterate with data.

---

# 1) Product Thesis

**Why this, why now.** Social-native mini apps reduce install friction and tap distribution in-feed. Farcaster identity + Base wallet + Zora coins = native creation + ownership + monetization loop.

**Winning bet.** Ship an *opinionated, delightful* post composer that makes it effortless to publish, mint content coins, and share socially—then optimize the share/return loop, not just the send step.

---

# 2) Personas (launch focus → expand)

1. **Creator Pro (primary)**

   - *Who:* Farcaster-native builders/artists, already posting daily; wallet-comfortable.
   - *Needs:* Publish quickly, schedule reliably, preview Zora coin impact, share achievements.
   - *Success:* <60s draft-to-scheduled; share rate >40%; weekly ritual adoption.

2. **Coin-Curious Follower (secondary)**

   - *Who:* Follows creators; occasionally mints/trades.
   - *Needs:* Clear coin info at preview; 1-tap buy/collect; reassurance on gas/safety.
   - *Success:* Previews convert to actions; returns from notifications.

3. **New Onchain Poster (expansion)**

   - *Who:* New to Base/Farcaster; no prior wallet friction tolerance.
   - *Needs:* Smart-wallet onboarding, plain-language gas messaging, guardrails.
   - *Success:* 1st post + first share in same session; time-to-first-value (TTFV) < 2 min.

---

# 3) Top User Stories (MVP scope → v1.1)

**Compose & schedule**

- As a Creator, I can compose a Farcaster post (text + media) and can have toggle that **automatically mints a Zora content coin** when posted.
- As a Creator, I can save and edit drafts (auto-save, offline tolerant), and schedule to a time window.
- As a Creator, I can preview the post *and* the associated coin action before sending.

**Send & share**

- As a Creator, I can confirm chain, gas, ticker, and coin details in plain language, then send.
- As a Creator, I get a success sheet with a dynamic share card and 1-tap “Share to Farcaster”.

**Coins & safety**

- As a Creator, I see what coin will be created/linked (creator vs content coin) and expected outcomes.
- As a Follower, I can discover coin info from the post’s preview/success card and act safely.

**Onboarding**

- As a New User, I can create/connect a smart wallet via a clear modal with passkeys support.
- As any user, I can proceed gasless (if enabled) within sponsor limits or pay minimal gas, explained simply.

**Notifications (v1.1)**

- As a Creator, I can opt into reminder notifications for scheduled posts and post-share nudges.
- As a Follower, I receive context-based re-engagement when friends interact with the creator’s posts.

---

# 4) Core Flows (golden path first)

**A. Create → Preview → Send → Share (golden path)**

1. *Create*: Single, thumb-reachable compose with 3 clear sections: content, schedule, coin.
2. *Preview*: Post + coin impact summary (what’s minted, fees, rewards), friend-context pill.
3. *Send*: Wallet tray (smart account), gas clarity (est. cost / sponsored), confirm.
4. *Share*: Success sheet → dynamic share image → prefilled cast w/ friend tags.

**B. Drafts & scheduling**

- Draft autosave; schedule picker with timezone and collision guard (warn if overlaps).

**C. Wallet & gas**

- WalletModal for connect/create; progressive disclosure for gas details; sponsor banner if gasless.

---

# 5) Social Mechanics to Build In (not bolt on)

**Identity Playgrounds**

- Creator profile badge on success cards; post-style presets that appear in feed previews.

**Co-Creation Loops**

- “Remix this post” inline action; reply-with-remix template; collab coin attribution.

**Long-Term Rituals**

- Weekly themed drops (e.g., #MintMonday); scheduled challenges; leaderboard among *friends you follow*.

**Make sharing inevitable**

- Every success leads to: dynamic image + prefilled cast with 2–3 best-friend mentions.
- “Share to claim” micro-rewards (badges/NFTs) tied to engagement, not spam.

**Notifications that matter**

- Social-triggered (friend beat you, friend minted, challenge closing) > time-only pings.

---

# 6) Validation Plan (pre-code → post-launch)

**Pre-code**

- 5 storyboard tests of golden path (paper/Figma); success = 4/5 complete unaided in <60s.
- Copy test for gas/coin clarity: 10 users, target ≥80% correct recall of fee/chain.

**Beta (invite-only)**

- Instrument: app\_open, draft\_create/save, preview\_open, wallet\_open, tx\_confirm, tx\_success, share\_click, share\_posted.
- Targets (first 2 weeks):
  - Create-to-send conversion ≥ 55%
  - Success→share rate ≥ 40%
  - 7-day repeat creators ≥ 30%

**Post-launch**

- A/B: dynamic share image variants; friend-graph mentions on/off; gasless vs paid nudge.
- Funnel reviews weekly; ship one growth experiment per week.

---

# 7) Analytics & Measurement

**Dashboards**

- *Engagement*: Active/New users, number of opens, median session time, entry points.
- *Creation funnel*: create → preview → send → share w/ drop-offs.
- *Growth*: invite/share K-factor proxy (shares per user × open-through).

**Event schema (MVP)**

- `app_open`, `composer_open`, `draft_save`, `preview_open`, `wallet_open`, `tx_submit`, `tx_success`, `share_open`, `share_posted`, `notif_open`.

**Key questions**

- Which entry points (Base App search/feed, friend share) drive highest create conversion?
- Do dynamic share images materially increase open-through and add rate?

---

# 8) UX Guidelines (mobile-first Mini App)

- Single-screen compose, short forms, progressive disclosure for advanced options.
- Always show *who you are* (FID) and *where you are* (Base, chain badge) in header.
- Gas clarity: show est. cost; if sponsored, show remaining per-user limit.
- Preview must include coin summary (creator vs content coin; rewards basics) in plain language.
- Success sheet is a celebration + invitation (not a dead end).

**Copy essentials**

- Avoid jargon; use tooltips for “what’s this coin?”; confirm screens: “You’re posting to Farcaster on Base; a content coin will be created on Zora.”

---

# 9) Onboarding & Wallet Strategy

- Use a smart-wallet modal with passkeys for new users; connect for existing wallets.
- Default to minimal friction; advanced wallet settings gated behind an “Advanced” drawer.
- If enabling gas sponsorship, surface user & global limits in plain language.

---

# 10) Coins Integration (Creator & Content coins)

**At compose**

- **Always on:** Posting (now or scheduled) **creates a Zora content coin**. No coin toggle. The primary text field serves as both **cast text** (Farcaster) and **Title** (Zora).

**At preview**

- Show: which coin will be created, the **Ticker** (auto-derived from Title, editable), how rewards flow, and a safety note; link to more details.

**At success**

- Dynamic card includes coin ticker, lightweight price/volume snapshot (threshold-gated), and share CTA.

**Safety & guardrails**

- Validate token metadata before display; warn on thin liquidity/new pools; simple risk cues.

---

# 11) Gas & Performance Considerations

- **Creation mode at launch: user-signed (EOA).** Default to user-signed transactions for Zora coin creation; Farcaster posting is off-chain (no gas).
- **Phase 2:** add gasless via Paymaster sponsorship with per-user and global caps (daily/weekly cycles).
- Respect Base per-transaction gas cap; avoid large multi-call sequences; chunk when needed.
- Keep transactions tiny; pre-fetch where legal; optimistic UI on send.

---

# 12) Technical Architecture (frontend-first)

**Framework & SDKs**

- MiniKit + OnchainKit (wallet, transactions, context) for Mini App shell.
- Neynar (Farcaster graph, notifications, best-friends API, share composition).
- Zora Coins SDK (create/trade hooks, metadata) + 0x Swap API for routing quotes.

**Services**

- **Template Studio & Render Service** for auto-generated coin media: user chooses a template once; server renders per-post image (avatar, name, text, brand).
- Serverless functions for previews (sanitized) and dynamic share image generation.
- Webhooks for notifications and share/claim verification.

**Observability**

- Base.dev analytics + custom event stream; error tracking; performance budgets.

---

# 13) Roadmap (design → alpha → GA)

**Week 1 — Discovery & Brief lock**

- Kickoff brief approval; storyboard flows; copy v1 for gas/coin clarity; event schema draft.

**Week 2 — Low-fi UX & prototype**

- Wireframes for compose/preview/send/success; dynamic share image prototype; wallet modal.

**Week 3 — Hi-fi UI & integration spikes**

- Visual language; MiniKit shell; Neynar share & notifications spike; Zora coin preview spike.

**Week 4 — Alpha**

- End-to-end golden path; analytics wired; private beta with 10 creators.

**Week 5 — Beta harden**

- Performance polish; gas messaging A/B; notification experiments; bug bash.

**Week 6 — GA**

- Public launch checklist; growth ops; weekly experiment cadence.

---

# 14) Launch Checklist (must-haves)

-

---

# 15) Risks & Mitigations

- **Gas confusion** → Plain-language copy, cost estimator, sponsorship banner.
- **Thin liquidity coins** → Surface risk badges; delay price badge until threshold.
- **Spammy sharing** → Social-triggered notifications and “share to claim” with rate limits.
- **Performance in feed** → Image sizes capped; lazy load; optimistic UI; strict budgets.

---

# 16) Open Questions

- Which coin defaults should the composer choose per content type?
- Sponsorship at launch or Phase 2? (budget & abuse thresholds)
- Minimum liquidity before showing price badge?
- Which weekly ritual fits our brand best for Week 1?

---

# 17) References (for implementation)

- Base Mini Apps overview, Growth guides (viral, data-driven), Onboarding, Onchain Social.
- Zora Coins protocol (creator/content coins, rewards, pools).
- 0x case study for Zora routing and indexing.
- Gasless transactions with Paymaster (limits, setup).
- Neynar virality and UX mistakes guides (social graph, notifications, share composition).

---

# Appendix A — Copy blocks (ready to paste)

**Gas clarity (paid)**\
“You’re posting on **Base**. Estimated network fee: **\~\$0.00x**. Fees fluctuate with network activity.”

**Gas clarity (sponsored)**\
“**Gas is sponsored** for this action. You have **1** sponsored action left today.”

**Coin preview safety**\
“This post will create a **content coin** backed by your creator coin. Trading fees reward you and your collectors. Learn more.”

**Success share**\
“🚀 Posted! New coin live. Think @alice or @bob will beat you? Tap to challenge.”

---

# Appendix B — Event dictionary (keys & props)

- `composer_open`: { source, fid }
- `draft_save`: { length, has\_media }
- `preview_open`: { has\_media, friends\_in\_context }
- `ticker_edited`: { from, to }
- `tx_submit`: { sponsored, est\_gas\_usd }
- `tx_success`: { hash, duration\_ms, gas\_paid\_usd }
- `share_posted`: { image\_variant, friends\_tagged }
- `notif_open`: { trigger\_type }

---

# 18) Information Architecture & Screens (including your "compose + queue" and Coins views)

**Nav model (Mini App)**

- **Create** (default) — unified composer tray with Zora/Farcaster support and a **Queue** drawer.
- **Plan** — full **Drafts/Queue** management plus **Calendar** view (weekly/monthly) with drag-and-drop.
- **Coins** — user’s Zora identity header + creator coin + content coins list + *Holdings* (other creators’ coins).
- **Activity** (v1.1) — notifications, scheduled jobs, recent mints/buys.
- **Settings** — wallet, sponsorship status, defaults (title/ticker rules, share prefs), **Template Studio**, data export.

**Entry points**

- Base App search → “Create”
- Farcaster Apps tray → “Create” (pre-seed caption/media)
- Profile deep link → “Coins”
- Reminder push → “Plan → Calendar (date)”

---

# 19) Unified Compose Tray (V3, supersedes prior §19)

**Goal:** Lightweight, Twitter/Farcaster-like compose that supports Zora coins with minimal friction.

**Layout (V3)**

1. **Text area** (Title/Cast) — single field, 3–120 chars.
2. **Toolbar (icons)**
   - **Camera** icon → opens camera/gallery; supports **multiple images** (appends to `images[]`).
   - **Template** icon → **drop‑up** with `Style 01/02/03 + Customize…`; when applied, shows template preview if no uploads.
   - **Create coin** switch (default On) → reveals **Ticker** chip (auto from Title; editable; availability inline).
3. **Media area (under text)**
   - If uploads present: horizontal **thumbnail strip** (112×112) with **remove (×)** per item.
   - Else if Template active: large template preview card.
4. **Bottom row**
   - **Schedule** button → **drop‑up** with: `Publish now`, `Later today (10 PM)`, `Tomorrow morning (9 AM)`, `Pick date & time`.
   - **Preview** button → enabled when validation passes.

**Dynamic validation**

- **Required:** Title/Cast (3–120).
- **Ticker:** 3–10 chars `A–Z0–9`; auto from Title; edit allowed; inline availability.
- **Media rule:** If **Create coin** is **On**, require at least one upload **or** Template preview active; Farcaster alone allows no media.

**Microcopy (minimal)**

- Placeholder: “Write something…”.
- Preview subline shows **schedule label**: `Posting now` or `Scheduled: …`.

**Queue access**

- Collapsed view shows small counters: `Queue N`, `Drafts M`; full management in **Plan**.

---

# 20) Field Mapping — Farcaster vs Zora (unified compose)

| Concept               | Farcaster                | Zora (Coins)                             | Notes                                 |
| --------------------- | ------------------------ | ---------------------------------------- | ------------------------------------- |
| **Media**             | Optional                 | **Required** (upload or Template render) | Template fallback ensures requirement |
| **Title / Cast text** | **Cast text (required)** | **Coin Title (required)**                | **Single input for both**             |
| **Ticker**            | *N/A*                    | Auto-derived from Title; **editable**    | Availability check + suggestions      |
| Destinations          | Farcaster                | Zora                                     | Both on by default                    |
| Schedule              | Client time + job        | Client time + job                        | Single scheduler orchestrates both    |
| Share                 | Prefilled cast           | Success card with share CTA              | One success sheet post-send           |

**Edge behavior**

- If Farcaster succeeds and Zora fails (or vice-versa), show partial success with retry card per destination.

---

# 21) Coins Screen — Zora Identity, Creator Coin, Content Coins, and Holdings

**Header**

- Zora profile avatar + name/handle + address short + chain badge (Base).
- Creator coin summary: ticker, price snapshot, 24h vol (threshold-gated), holders.

**Tabs**

1. **Created** — content coins minted from this profile (list + filters)
2. **Holdings** — other creators’ coins and content coins the user owns

**List item (content coin)**

- Media thumbnail, Title/ticker, created date, quick stats (holders/vol), 1-tap action: *View* / *Trade*.

**Filters & sort**

- Sort by *Recent*, *Top holders*, *Volume*; Filter by *Type* (content/creator), *Status* (live/ended).

**Empty states**

- Created: “Coins you create from posts will appear here.” CTA: *Make your first coin*.
- Holdings: “Collect coins to see them here.” CTA: *Explore trending creators* (v1.1).

---

# 22) Scheduling UX (+ Presets)

- Presets: **Publish now**, **Later today (10 PM)**, **Tomorrow morning (9 AM)**, **Pick date & time** (opens custom picker).
- Custom: date/time picker with timezone chip and collision guard (warn if overlapping job).
- Bulk actions (v1.1): select multiple queued items → reschedule / send now.

---

# 23) Data & Integrations — Frontend ↔ Backend contract (brownfield-ready)

**Zora (Coins)**

- **Create now (EOA, default at launch)**: `POST /zora/coins/call/preview` → `{ to, data, value, chainId }` → wallet send → `POST /zora/coins/create/confirm`.
- **Schedule**: `POST /zora/coins/schedule`, `GET /zora/coins/queue`, `POST /zora/coins/:id/cancel`.
- **Queries (UI)**: `getCreatorCoin(address)`, `getContentCoinsByCreator(address)`, `getHoldings(address)`, `getCoinSummary(ticker|contract)`.

**Farcaster (Neynar)**

- Publish cast: `postCast({ text: Title, embeds: media?, channel? })` (no gas required).
- Profile: `getUserProfile(fid)` for avatar/name.

**Template Studio / Render Service**

- `GET /template` → fetch user’s current template config.
- `POST /template` → save/update template (fonts, colors, layout, watermark).
- `POST /render` → `{ title, handle, avatarUrl, bg?, styleId }` → returns `mediaUri` used for Zora when no upload.

**Scheduling**

- `scheduleJob({payload, runAt, destinations})` in our backend (fan-out + idempotency key).

**Observability**

- Emit our event schema; link `txHash` and `castHash` to queue item id.

---

# 24) State & Error Handling

**Queue item states**: `draft` → `scheduled` → `sending` → `success|partial|failed`

- On `partial`: show per-destination status; retry only failed destination.
- On `failed`: keep in queue with red badge; tap to fix fields and retry.

**Validations**

- **Title/Cast text**: 3–120 chars; whitespace collapse; emoji ok.
- **Ticker** *(auto + editable)*: 3–10 chars; charset A-Z0-9; **availability check inline**.
- **Media**: If **Create coin On**, require `images.length > 0` **or** Template preview available; Farcaster allows no-media posts.
- Media size caps; graceful downscale for preview.

**Network/Gas**

- Farcaster posts are gasless. Zora coin creation is user-signed (EOA) at launch. If sponsorship becomes available, show in-flow toggle to use sponsor and est. cost when off.

---

# 25) Copy & Visual Tweaks from your screenshots (quick wins)

1. **Title guidance** — “**This text is your cast and your coin Title.** Keep it crisp.”
2. **Ticker helper** — “Ticker auto-generates from Title (first letters). You can edit.”
3. **CTA labels** — Use **Post** when immediate, **Schedule** when future; avoid generic “Confirm”.
4. **Clarity chip** — “Posting will also **create a coin on Zora**.”
5. **Media helper** — “No image? We’ll use your **Template** to generate one for Zora.”

---

# 26) Acceptance Criteria (updated for Compose V3)

**Compose (Create tab)**

- Can add **multiple images**; each image shows as a thumbnail with **remove (×)**.
- With **Create coin On** and no uploads, Template preview appears and **Preview** is enabled (after render ready).
- **Ticker** auto-generates from Title and is editable; shows **Checking/OK/Taken** states; blocks Preview on collision.
- **Schedule** drop‑up exposes exactly: *Publish now*, *Later today (10 PM)*, *Tomorrow morning (9 AM)*, *Pick date & time*.

**Preview**

- Shows image strip (or Template card), Title, and **Ticker** (if Zora On).
- Shows **schedule label**: `Posting now` or `Scheduled: …`.
- `Back` returns to Compose without losing state; `Send/Schedule` advances and emits events.

**Plan & Coins (unaltered)**

- Queue drawer and Coins list behave as previously specified.

---

# 27) Metrics Focus for New Screens

- Queue usage: % of posts scheduled, median scheduled delay.
- Coins screen engagement: views/DAU, Created vs Holdings tab split, trade CTR from list.
- **Ticker edit rate**: % of posts where user overrides the auto-ticker; collision resolution time.
- **Auto-media usage**: % of posts using Template render; render failure rate; time-to-render.
- **Zora success rate**: successful coin creations / attempts; partial-failure rate.

---

# 28) Next Design Deliverables

- Annotated wireframes: **Compose + Queue drawer**, **Coins (Created/Holdings)**, **Success sheet**, **Template Studio**.
- Component specs: Title/Ticker field (availability + generation rules), Media block (Upload vs Use Template), Destination chips, Queue item cell.
- Data contract: queue item schema, destination statuses, idempotency keys, Template config + `/render` payload/response.

---

# 29) Template Studio — Custom Coin Media (like Base App, user-customizable)

**Purpose**

- Ensure Zora’s media requirement is always met while giving creators a brandable, reusable image template for posts without uploads.

**Template elements**

- Avatar (rounded), display name, handle, timestamp (optional), Title text, watermark/logo, background (solid/gradient/image), corner badge (Base badge optional), layout variants (card, full-bleed).

**Customization controls**

- Fonts (system + curated), font sizes, colors, alignment, padding, logo upload, background style, accent color.

**Behavior**

- Set once in **Settings → Template Studio**; can override per post in the Media block.
- Live preview while editing; save as `styleId`.
- Posts without user media: Composer requests `/render` with `{ title, handle, avatarUrl, styleId }` → returns `mediaUri`.

**Performance**

- Target <300ms render for preview; <1s for final. Cache by `{styleId, titleHash}`.

**Accessibility**

- Ensure contrast ratio ≥ 4.5 for text on background; truncate long titles with ellipsis and smart line-breaks.

**Telemetry**

- Events: `template_open`, `template_set`, `media_autogen_used` (with styleId), `render_fail`.

---

# 30) Drafts, Queue & Calendar — Scale features inspired by Buffer/Hootsuite

**Goals**

- Make drafting and scheduling effortless; help creators **scale** output without losing quality; provide a clear **at-a-glance plan**.

**Drafts**

- Inbox-style list with filters: *All*, *Needs media*, *Needs ticker*, *Scheduled*, *Failed*.
- Inline edit (Title/Ticker/Media) without leaving list; keyboard shortcuts; autosave.
- Bulk actions: select → schedule, assign slot, delete.

**Queue**

- **Auto-Queue slots** per day (creator sets preferred times). “Add to Queue” finds next open slot.
- Slot health: warn on overlapping jobs or missing Zora media (auto-Template fallback badge).
- Quick actions per item: send now, reschedule, duplicate, share preview link.

**Calendar**

- Week & Month views; drag-and-drop to reschedule; tap to edit.
- Heatmap overlay (optional) for past performance by hour/day to suggest “best times”.
- Show destination badges per item (Farcaster/Zora) and coin ticker.

**Evergreen & Re-share (v1.1)**

- Mark as *Evergreen*; auto-re-queue after N days if last send met success threshold.
- Smart dedupe to avoid spam (cap repeats per week).

**Libraries & templates**

- **Media library** (uploads + generated Template images); **Text snippets** for recurring intros/outros.
- Saved **Hashtag/Channel sets** (e.g., `degen`, `gen-art`) applied with one tap.

**Team (later)**

- Optional approval workflow and roles; not in MVP.

**Metrics**

- Queue fill %, on-time send rate, schedule drag-and-drop frequency, slot utilization, Evergreen re-share lift.

**Events**

- `draft_open`, `draft_bulk_action`, `queue_add_to_slot`, `calendar_view`, `calendar_drag_reschedule`, `evergreen_toggle`.

---

# 31) Coins & Portfolio — Beyond basics

**Created**

- Add quick stats chips: holders, 24h vol, P/L since mint (if available), last share date.

**Holdings**

- Portfolio value snapshot (if price thresholds met), top movers, watchlist.

**Actions**

- From list: *View*, *Share*, *Trade*; from detail: performance mini-chart (threshold-gated), recent activity.

**Exports**

- CSV for created coins & holdings with timestamps; API token for programmatic export (later).

**Metrics/Events**

- Portfolio views/DAU; trade CTR from list; `portfolio_exported`.

---

# 32) Social Proof Onboarding — “Friends already using Kamo”

**What users see**

- On signup/connect: “**5 friends already use Kamo**” with up to 7 tiny friend avatars (circle), randomized order; tap to expand list.

**How we compute**

- `friends = (following ∩ kamo_users)` via Neynar following graph + our `has_used_kamo` flag.
- Count shown = min(friends.length, cap 50); avatars sampled per session.

**Variants to A/B**

- Copy: “friends using Kamo” vs “friends scheduling with Kamo”.
- CTA framing: “Join them” vs “Start posting faster”.

**Acceptance criteria**

- Social proof renders <150ms after profile fetch; gracefully hides if `friends.length === 0`.
- Privacy-safe (no *invite without consent* actions on behalf of friends).

**Events/Metrics**

- `socialproof_impression`, `socialproof_expand`, `signup_completed`; lift in connect rate and first-post TTFV.

---

# 33) Streaks, Challenges & Reminders — Lightweight growth loop

**Streaks**

- Daily posting streak (counts scheduled posts that successfully send). Badges at 3, 7, 21 days.
- Success sheet nudges: “🔥 Day 4 complete — 3 to a 7-day badge.”

**Challenges**

- Themed weekly/monthly prompts (e.g., *Mint Monday*) with optional auto-slots pre-filled.
- Friend-graph leaderboard (only people you follow) to keep it non-spammy.

**Reminders**

- Calendar slot reminders (10 min before), streak-save reminders (evening if no send), challenge closing alerts.

**Rewards**

- Badge NFTs or profile flair; small, non-spammy share CTAs.

**Metrics/Events**

- `streak_day_completed`, `challenge_join`, `challenge_complete`, `reminder_sent`, `reminder_open`.
- Retention uplift vs control, streak drop-off points.

---

# 34) Acceptance Criteria — Plan & Growth additions

- **Drafts/Queue/Calendar**: drag-and-drop reschedule; auto-queue slots; performance heatmap toggle; bulk actions working.
- **Social Proof**: shows when `friends.length > 0`, hides otherwise; avatars resolve from Neynar; copy switchable by experiment flag.
- **Streaks/Challenges/Reminders**: streak count accurate across timezones; reminders deduped; leaderboard scoped to friend graph.

---

# 35) Open Questions — Scale & Growth

- Auto-queue default slots per day (3? 5?) and local-time behavior during DST.
- Evergreen policy: success threshold & cool-down to avoid spam.
- Which streak cadence aligns with brand (7-day vs 5-day weekdays)?
- Do we show creator coin stats on success sheet or keep it minimal?

---

# 36) UX-Expert Review — Principles, Risks, and Priorities

**North-star:** fastest path from *idea → coinified post → social proof*. Every element should shorten that path or strengthen the loop back to Create.

**Key heuristics**

- **Recognition over recall:** Single **Title/Cast** field; show live **Ticker** chip as you type.
- **Make status visible:** destination chips (Farcaster/Zora), media requirement chip (✔ Template used / ✖ Missing), gas hint on press.
- **Error prevention > error states:** preflight checks for ticker, render, wallet connection before enabling Post.
- **Recovery first:** partial-success card with one-tap retry on the failed destination.

**Top UX risks** (with mitigations)

- **Ticker collisions** → inline suggestions; reserve on schedule to avoid race; expire holds quickly.
- **Render fails** → fallback to minimal text-only template; keep Farcaster send; queue Zora retry.
- **Timezone/DST confusion** → always show local TZ chip; warning when creator travels; allow quick TZ override per schedule.
- **EOA friction** → defer wallet connect until *Send*; keep Create usable without blocking.

---

# 37) Annotated Wireframe Specs (v1)

## A) Compose (Create tab, V3 updates applied)

**Header:** avatar + handle + base badge; close (X). **Text area:** 2–3 lines by default; live count; paste cleans whitespace. **Toolbar:** **Camera**, **Template**, **Create coin** switch → **Ticker chip** (editable with state badges). **Media:** horizontal **thumbnail strip** with remove (×), or Template card when no uploads. **Schedule:** drop‑up menu from bottom with presets; `Pick date & time` opens custom picker. **Primary CTA:** **Preview**; subtext shows schedule label on Preview sheet.

**Empty/error states:**

- No uploads + Zora On → Template preview is required before Preview.
- Ticker collision → suggestions (1-tap); CTA disabled until resolved.
- Wallet connect only on **Send**.

## B) Plan — Drafts & Calendar

*(unchanged from previous)*

## C) Coins (Created/Holdings)

*(unchanged from previous)*

## D) Success Sheet

*(unchanged from previous)*

## E) Template Studio

*(unchanged from previous)*

---

# 38) Content Design — Final Microcopy (ready to ship)

- **Title/Cast placeholder:** “Write something…”
- **Ticker helper:** “We’ll use the first letters (edit anytime).”
- **Template helper:** “No image? Your template will make one.”
- **Schedule helper:** “Local time · change in settings.”
- **Partial success:** “Posted to Farcaster. Coin queued on Zora — tap to retry.”
- **Collision:** “That ticker’s taken. Try {SUGGESTION\_1} or {SUGGESTION\_2}.”
- **Gas hint (EOA):** “You’ll sign one transaction for the coin.”

---

# 39) Component Library (tokens & specs)

**Tokens**

- Radius: `r-2xl` for cards/buttons; `r-lg` for inputs.
- Spacing: `8px` grid; inputs `p-12` vertical rhythm.
- Type scale: `Display 28/32`, `Title 20/24`, `Body 16/22`, `Caption 13/18`.
- Elevation: card `shadow-sm`, sheets `shadow-lg`.

**Key components** (adds for V3 in **bold**)

- `Input.TitleCast`
- `Input.Ticker`
- ``
- ``
- ``
- ``
- `Queue.Item`

**States to design**: default, hover/press, focus, error, disabled, loading/skeleton.

---

# 40) Accessibility, Motion & Haptics

**A11y**

- Support Dynamic Type up to 130%; wrap Title/Cast gracefully; never truncate ticker without tooltip.
- Color contrast ≥ 4.5:1; do not rely on color alone for status; include icons/labels.
- Screen reader labels: Camera ("Add media"), Template ("Choose template"), Ticker (value + state), Remove image (index).
- Focus order: Text → Camera → Template → Create coin → Ticker → Schedule → Preview.

**Motion**

- Subtle sheet slides; reduce-motion respects OS; confetti micro-motion on success.

**Haptics** (mobile)

- Light tap on **Preview/Send**; success haptic on sends; warning haptic on collision.

---

# 41) Edge Cases & Offline

- **Offline at compose:** allow Draft save; show offline banner; disable Post.
- **Slow render:** show progress bar with cancel; after 2s offer text-only minimal template.
- **Ticker race condition:** reserve ticker on Schedule; release if canceled/edited.
- **Clock skew:** server authoritative send time; client shows local estimate.
- **Neynar outage:** cache last-known profile; still allow Zora coin with generic avatar in template.

---

# 42) Research & Usability Testing Plan

**Participants:** 8–10 creators (4 power, 4 new) + 4 coin-curious followers. **Tasks:**

1. Post with no upload → confirm coin created with Template image.
2. Schedule two posts via Calendar; drag & drop one.
3. Resolve a ticker collision and post.
4. View Coins → Share a created coin.
5. Onboarding: respond to “5 friends already use Kamo”. **Success criteria:** ≥80% task completion; average Post setup time ≤45s; SUS ≥80.

---

# 43) Analytics Additions (beyond #27)

- `media_autogen_used` {styleId}
- `ticker_collision` {attempts, time\_to\_resolve\_ms}
- `queue_auto_slot_used` {slot\_index}
- `calendar_drag_attempt` {from, to, success}
- `partial_success` {failed\_destination}

---

# 44) Engineering Handoff Checklist

- All components mapped to API contracts (see §23); error codes enumerated and copy tied.
- Empty states, errors, and loading skeletons designed for each screen.
- Event names/props finalized; added to tracking plan; dashboards stubbed.
- Accessibility review passed (contrast, labels, focus, dynamic type).
- QA scripts for timezone/DST, collision, offline, retry, render fallback.

---

# 45) Decisions Needed (blockers to hi-fi)

- Reserve-on-schedule vs reserve-on-post for tickers (recommend: **reserve on schedule** with short TTL).
- “Best times” heatmap data source and default model (last 30 days vs global heuristic).
- Default Auto-Queue slots per day (propose 3/day: 9am, 2pm, 8pm local).
- Minimum thresholds for showing price/vol on creator/content coin chips.

---

# 46) UX-Expert Quickstart — 5-Day Sprint Plan

**Day 1 – Audit & framing**

- Confirm decisions in §45. Lock token scale and icon set.
- Finalize Title/Ticker rules and edge messages (collision, reserved words).
- Draft usability test plan (§42) with tasks specific to Template media.

**Day 2 – Lo-fi wireframes**

- Create flows for: Compose (V3), Queue/Drafts, Calendar, Coins, Success, Template Studio.
- Add interaction notes (focus order, error placements, haptics).

**Day 3 – Click-through prototype**

- Validate tab IA and queue interactions; connect basic data to simulate ticker checks and renders.
- Prep test stimuli (2 render styles, 2 ticker collision cases).

**Day 4 – Usability testing (8 sessions)**

- Run, synthesize same day; track errors/time-on-task; mark P0 fixes.

**Day 5 – Iterate & handoff**

- Apply P0/P1 fixes; export component specs; update tracking plan; sign off on ACs.

---

# 47) Lo-Fi Wireframe Sketches (ASCII)

## A) Compose (V3)

```
┌─────────────────────────────────────────────────────────┐
│  Mehul        Base ●                                     X│
├─────────────────────────────────────────────────────────┤
│ Write something…                                         │
│  [📷]   [Template ▾]   [Create coin ◯/●]   [TICKER ABC]  │
│  ┌─ Thumbnails (scroll)  ──────────────────────────────┐ │
│  │ [img×] [img×] [img×] …                             │ │
│  └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  Schedule ▴    Preview                                  │
└─────────────────────────────────────────────────────────┘
```

## B) Plan — Drafts & Calendar *(unchanged)*

## C) Coins — Created/Holdings *(unchanged)*

## D) Success Sheet *(unchanged)*

## E) Template Studio *(unchanged)*

---

# 48) Figma File Structure & Components

**Pages**: 00-Foundations, 10-Compose (V3), 20-Plan, 30-Coins, 40-Success, 50-Template Studio, 90-Prototypes.\
**Libraries**: Tokens, Icons, Illustration (Template assets).\
**Key variants**: `Input.TitleCast` (default/focus/error), `Input.Ticker` (idle/checking/valid/collision), `` (1/2/3/4 items), `Queue.Item` (draft/scheduled/failed), `Calendar.Cell` (empty/occupied/drag-over).

---

# 49) Redlines — Critical Interaction Details

- **Ticker generation:** on blur OR after 800ms idle typing; if user edits manually, stop auto-regeneration.
- **Reserve on schedule:** call `/ticker/reserve` with TTL 10m; extend on edit; release on cancel.
- **Render pipeline:** show preview using `/render?preview=true`; block Post until final `/render` succeeds or fallback minimal template completes.
- **Calendar DnD:** snap to creator’s auto-queue slots if near; confirm modal only when moving across days.
- **Partial success:** keep queue item with Zora retry state; do not show failure toast if Farcaster succeeded.

---

# 50) Usability Test Script (condensed)

1. Post with no upload → confirm coin created with Template image.
2. Fix a ticker collision using a suggestion; measure time-to-resolve.
3. Schedule three posts via Calendar; drag one to tomorrow at 2pm.
4. From Coins → share the latest content coin.
5. Onboarding: respond to “5 friends already use Kamo”.\
   **Success**: all tasks in ≤45s each; errors logged; SUS ≥80.

