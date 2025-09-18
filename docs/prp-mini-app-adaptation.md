# PRP: Mini App Adaptation — Next.js + shadcn/ui + OnchainKit + MiniKit

## Overview
- Goal: Evolve Kamo from a backend + static HTML into a Base Mini App with a modern Next.js frontend using shadcn/ui and Coinbase OnchainKit, while retaining the existing Express API and incrementally enabling user‑signed and scheduled coin creation flows.
- Scope: Create a new `web/` Next.js app (App Router, TS) that consumes the existing Express API, implements wallet connect + chain switching for Base, integrates Neynar SIWN status, delivers the “EOA Create Now” flow (user‑signed), and prepares for Base Account session keys and paymaster sponsorship.
- Non‑goals (this PRP): Migrating all API routes into Next.js (can be a follow‑up), advanced design system work, or full AA + paymaster implementation (spec’d for later stories).

## Why
- Improve UX and velocity: componentized UI, routing, validation, and better error handling.
- Meet Mini App requirements: wallet, identity, and chain UX aligned with Base guidelines.
- Reduce backend coupling: move client behavior into a first‑class frontend without breaking existing endpoints.

## What (Success Criteria)
- [ ] Next.js `web/` app builds and runs locally alongside the existing Express server.
- [ ] OnchainKit + wagmi configured for Base (8453), with wallet connect and chain guardrails.
- [ ] shadcn/ui components replace the raw HTML for compose/schedule forms and queues.
- [ ] MA‑2 (“EOA Create Now”) implemented end‑to‑end using preview → `sendTransaction` → confirm.
- [ ] SIWN (Neynar) status visible; identity mapping shows FID + resolved address.
- [ ] No regressions: existing server‑paid scheduled flow continues to work via existing endpoints.

## All Needed Context

### Documentation & References
- https://docs.base.org/mini-apps/overview — Mini App overview & UX
- https://docs.base.org/base-account/overview/what-is-base-account — Base Account (session keys)
- https://docs.base.org/base-account/improve-ux/sponsor-gas/paymasters — Paymasters (sponsored gas)
- https://onchainkit.xyz/docs — Coinbase OnchainKit docs
- https://wagmi.sh/ — wagmi docs
- https://viem.sh/docs — viem docs
- https://ui.shadcn.com/ — shadcn/ui docs
- https://docs.neynar.com/docs/siwn — Neynar SIWN
- https://docs.zora.co/coins — Zora Coins docs
- docs/doc-miniapp-llm.txt — Mini app notes in repo
- docs/epics/mini-app-adaptation.md — Epic
- docs/stories/ma-2-eoa-create-now.md — Story for EOA Create Now

### Current Codebase (Key Files)
- src/index.ts — Express API (casts, uploads, zora, workers)
- src/zoraService.ts — Zora service & coin creation
- public/app.html — Current UI
- docs/prd.md — PRD

### Desired Codebase Additions (Frontend)
- web/app/layout.tsx
- web/app/page.tsx (compose/schedule)
- web/app/queue/page.tsx (queues)
- web/components/wallet-status.tsx
- web/components/siwn-status.tsx
- web/components/compose-form.tsx
- web/components/queue-table.tsx
- web/lib/api.ts
- web/lib/chains.ts
- web/lib/onchain.ts
- web/styles/globals.css

### Known Gotchas & Library Quirks
- Do not expose secrets in Next client; only NEXT_PUBLIC_* envs are client‑readable.
- Add CORS for Next → Express in dev if different ports.
- Enforce Base (8453) chain before transactions; prompt switch.
- SIWN vs wallet: either may be missing; guard actions.
- OnchainKit/wagmi compatibility with Next App Router.

## Implementation Blueprint

### Phase 0 — Scaffold & Config
1) Create Next app in `web/` (TS, App Router).
2) Install shadcn/ui and add base components.
3) Add OnchainKit + wagmi + viem; configure Base 8453 (+ optional Base Sepolia).
4) Env vars:
   - NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   - NEXT_PUBLIC_BASE_CHAIN_ID=8453
   - NEXT_PUBLIC_NEYNAR_CLIENT_ID=<id>
5) lib/api.ts: central fetch with bearer (SIWN token).
6) wallet-status.tsx + siwn-status.tsx; mount in layout.

### Phase 1 — MA‑2: EOA “Create Now”
1) Backend endpoints: POST /zora/coins/call/preview and POST /zora/coins/create/confirm.
2) Frontend compose-form (Zora mode): preview → walletClient.sendTransaction → confirm.
3) Show tx hash, explorer link, and status; toast errors.

### Phase 2 — Queues & UX
1) queue/page.tsx: render both queues with filters.
2) Replace HTML with shadcn tables and inputs.
3) Add validation, skeletons, toasts.

### Phase 3 — Session Keys (Design Stub)
1) Toggle “Enable scheduled user‑paid”.
2) Placeholder UI for session key registration summary.
3) Backend endpoints tracked in separate PRP/stories.

### Phase 4 — Optional API consolidation
1) Keep Express now; consider migrating specific routes later.

## Pseudocode (selected)

web/lib/onchain.ts
```ts
import { createConfig, http } from 'wagmi';
import { base } from 'viem/chains';
export const wagmiConfig = createConfig({ chains: [base], transports: { [base.id]: http() } });
```

Create Now flow (client)
```ts
const r = await api.post('/zora/coins/call/preview', { title, symbol, description, metadataUri, creatorAddress, chainId: 8453 });
const { to, data, value, chainId } = await r.json();
const txHash = await walletClient.sendTransaction({ to, data, value, chainId });
await api.post('/zora/coins/create/confirm', { txHash, coinAddress, metadataUri, creatorAddress });
```

## Integration Points
- ENV: NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_BASE_CHAIN_ID, NEXT_PUBLIC_NEYNAR_CLIENT_ID
- Backend: enable CORS for web origin; keep routes stable
- Frontend routes: /app, /queue, (optional) /zora

## Validation Loop

Frontend build & types
```bash
cd web
npm run lint && npm run typecheck && npm run build
```

Manual e2e (dev)
```bash
# 1) backend
npm run dev
# 2) frontend
cd web && npm run dev
```
- Connect wallet (Base 8453); verify SIWN; Create Now preview → send → confirm; queues render.

Regression
- public/app.html still works until fully replaced.
- Scheduled server‑paid mints keep working.

## Rollout Plan
- M1: Next shell + status + queues (read only)
- M2: MA‑2 Create Now end‑to‑end
- M3: Redirect from static UI to Next
- M4: Session keys & paymaster in separate PRPs

## Risks & Mitigations
- Chain mismatch → chain switch guard + OnchainKit UI
- Env drift → central API base + feature flags
- Double submit → disable during pending; debounce
- CORS → configure for dev

## Confidence
Score: 8/10 — Incremental, API remains stable; primary risk is library version drift & identity edge cases.
