# Kamo — Condensed Knowledge Brief (Base Mini Apps, Zora Coins)

Purpose
- Synthesize provided documentation into actionable guidance for Kamo’s brand, product, and growth decisions.
- Sources (as of 2025‑09‑10):
  - Base Mini Apps Overview — https://docs.base.org/mini-apps/overview
  - Onboard Any User — https://docs.base.org/cookbook/onboard-any-user
  - Base App Coins — https://docs.base.org/cookbook/base-app-coins
  - Viral Growth — https://docs.base.org/mini-apps/growth/build-viral-mini-apps
  - Data‑Driven Growth — https://docs.base.org/mini-apps/growth/data-driven-growth
  - Onchain Social — https://docs.base.org/cookbook/onchain-social
  - Zora Coins — https://docs.zora.co/coins
  - Zora Case Study (0x) — https://0x.org/case-studies/zora
  - Go Gasless — https://docs.base.org/cookbook/go-gasless
  https://docs.base.org/cookbook/successful-miniapps-in-tba

Summary Themes
- Mini App Context: Lightweight, mobile‑first experiences embedded in Base/Farcaster contexts. Keep flows short, defer prompts, leverage host identity.
- Identity & Onboarding: Wallet‑first with hints from host contexts; support graceful fallbacks and progressive disclosure.
- Coins as Content: Zora posts can be onchain assets/coins; UX should preview tx details, chain (8453), and fees clearly.
- Virality & Loops: Optimize post‑success sharing; lean into native social mechanics; measure conversion and iterate quickly.
- Data‑Driven Iteration: Instrument key events; funnel analysis from open → preview → send → success → share → re‑engage.
- Gas Strategy: Consider gasless patterns or session keys/paymasters later; start with clear “you’ll pay gas” messaging.

Implications for Kamo
- Brand: Emphasize speed, clarity, onchain‑native identity; celebrate successful posts as moments worth sharing.
- UX: One input screen → one preview sheet → native tx tray; strong error handling; visible identity/chain status; success share CTA.
- Growth: Bake sharing into success; encourage repeat posting; educate on benefits of Zora coins.
- Tech: Enforce Base 8453; preview call returns {to,data,value,chainId}; identity hints from Neynar/Farcaster; consider queue read for scheduled posts.

Key Concepts (by Source)
1) Base Mini Apps Overview
   - Small surface area, embedded UX; respect host chrome and context; short paths to value.
   - Design best practices: defer wallet prompts; use skeletons; focus on clarity.

2) Onboard Any User
   - Use host‑provided identity hints; support wallet connect with clear states; avoid forcing sign‑in before clear action.
   - Keep copy explicit about costs, outcomes, and next steps.

3) Base App Coins
   - Treat coin creation as a first‑class action; preview tx parameters; educate on implications (fees, ownership, chain).
   - Provide shareable outcomes and clear confirmations post‑tx.

4) Build Viral Mini Apps
   - Success state is the prime moment for sharing; optimize one‑tap share; use templated, delightful social proof.
   - Reduce friction before the share; make outcomes attractive and easy to celebrate.

5) Data‑Driven Growth
   - Define and track core funnel events; run experiments on copy, CTAs, and timing; instrument errors for fast fixes.

6) Onchain Social
   - Interoperate with onchain identity; align with social graphs; keep interactions simple and legible.

7) Zora Coins
   - Posts can mint coins/assets; integrate metadata build, preview, and confirmation; explain benefits and how earnings work.

8) Zora Case Study (0x)
   - Illustrates ecosystem momentum and monetization; social + token mechanics drive engagement.

9) Go Gasless
   - Options for abstracting fees (later phase): paymasters, sponsorship; begin with explicit gas messaging, then experiment.

KPIs to Track (Initial)
- Create conversion: preview → send → success
- Share rate: post‑success CTA
- Time‑to‑first‑value: open → coin created
- Error rate: by step and reason
- Retention: 7‑day repeat posting

Risks & Mitigations
- Wallet/chain friction → clear chain guardrails; upfront copy; helpful retries.
- Media latency → progress feedback; background tasks where safe.
- Virality stalls → iterate on share template/image; test incentives.

Brand Pointers
- Tone: direct, confident, encouraging; avoid hype, maintain credibility.
- Visuals: high contrast, mobile‑first, celebratory success without excessive motion.

Open Questions (Feed Brand Sprint)
- Which growth loop do we prioritize first (Farcaster share vs. Zora showcase)?
- How opinionated are defaults (e.g., coin settings) vs. advanced toggles?
- What’s our stance on gas (pay user vs. sponsor later)?
- Which creator segment do we hero initially (power users vs. new creators)?

