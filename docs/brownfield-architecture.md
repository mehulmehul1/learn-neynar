# Kamo (Neynar + Zora) Brownfield Architecture Document

## Introduction
This document captures the current state of the Kamo codebase, a brownfield project that combines a Node.js/Express backend using Neynar’s Farcaster SDK with Zora Coins integration, and a Next.js-based frontend for wallet-driven flows. It focuses on real implementation details, technical debt, and practical guidance for AI developers.

### Document Scope
- Focused on current features: Farcaster SIWN scaffold, media uploads via Pinata, cast scheduling, Zora coin creation (immediate and scheduled), and the Next.js UI integration.
- Includes endpoints, key modules, integration points, and known constraints.

### Change Log
| Date       | Version | Description                          | Author |
|------------|---------|--------------------------------------|--------|
| 2025-09-09 | 1.0     | Initial brownfield architecture doc  | Codex  |

## Quick Reference — Key Files and Entry Points

Backend (Express)
- Entry: `src/index.ts`
- Zora integration: `src/zoraService.ts`
- Neynar client wrapper: `src/neynarClient.ts`
- Env: `.env`, `.env.example`
- Static demo UI: `public/app.html`
- README: `README.md`

Frontend (Next.js)
- App shell/layout: `web/app/layout.tsx`
- Pages: `web/app/page.tsx`, `web/app/create/page.tsx`, `web/app/activity/page.tsx`, `web/app/queue/page.tsx`
- Components: `web/components/compose-form.tsx`, `web/components/wallet-status.tsx`, `web/components/siwn-button.tsx`, `web/components/siwn-status.tsx`
- Client API helpers: `web/lib/api.ts`
- Next config and rewrites: `web/next.config.js`
- Env: `web/.env`, `web/.env.example`

Build/Config
- Root package: `package.json`
- Web package: `web/package.json`
- TypeScript config: `tsconfig.json`, `web/tsconfig.json`

## High Level Architecture

### Technical Summary
- UI: Next.js 15 (App Router) on port 3001 during development. Uses Wagmi + Viem for wallet operations.
- Backend: Node.js 18 + Express on port 3000. Exposes REST endpoints for Farcaster, uploads (Pinata), cast scheduling, and Zora coins.
- Rewrites: In dev, `web/next.config.js` proxies `/auth`, `/zora`, `/casts`, `/uploads`, and `/config` to the backend on port 3000.
- Integrations: Neynar Node SDK, Zora Coins SDK, Pinata (upload/sign), Viem (wallet + chain), Coinbase OnchainKit (frontend).

### Data Flow (Typical coin “Create Now”)
1. User connects wallet in Next.js, composes content, uploads media to Pinata, and builds `ipfs://` metadata.
2. Frontend requests preview calldata: `POST /zora/coins/call/preview` (backend) to build `{ to, data, value, chainId }` via Zora SDK.
3. Frontend sends the transaction with Wagmi/Viem to the blockchain.
4. Frontend confirms with `POST /zora/coins/create/confirm` (backend acknowledges; no DB persistence yet).

### Scheduler (Casts and Coins)
- In-memory queues for cast publishing and Zora coin creation jobs.
- Worker endpoints and dev interval to process due jobs.
- Intended for DB-backed persistence in future stories (see docs/prd story files).

## Actual Tech Stack

Backend
- Runtime: Node.js 18+
- Framework: Express 4.x
- Language: TypeScript
- Key libs: `@neynar/nodejs-sdk`, `@zoralabs/coins-sdk@^0.3.0`, `viem@^2.9.6`, `dotenv`, `zod` (available, not widely used yet)

Frontend
- Next.js 15, React 18
- Wagmi 2.x, Viem 2.x, TanStack React Query 5.x
- Coinbase OnchainKit

Dev Tooling
- `ts-node-dev` for hot reload backend
- TypeScript 5.x

## Repository Structure (Reality Check)

```
project-root/
├── src/                # Express backend (Neynar + Zora + Pinata + jobs)
├── web/                # Next.js app (App Router)
├── public/             # Static demo UI (app.html)
├── docs/               # PRDs, stories, specs
├── .bmad-core/         # BMAD agents and tasks
├── archon/             # Archon setup/migrations (not wired in runtime)
└── scripts/            # Misc scripts
```

## Source Tree and Key Modules

Backend (Express)
- `src/index.ts`: Main server. Provides health, config, SIWN session scaffold, Farcaster casts, Pinata uploads (sign/direct/legacy), scheduling (casts + Zora jobs), and Zora endpoints including EOA “Create Now” preview/confirm and immediate creation using a server signer.
- `src/zoraService.ts`: Zora Coins SDK wrapper. Key methods:
  - `buildCreateCoinCall(...)` → returns calldata `{ to, data, value, chainId }` for EOA flow.
  - `createContentCoin(...)` → server-signed content coin creation.
- `src/neynarClient.ts`: Neynar SDK wrapper with convenience methods for user fetch, wallet resolution, publish.

Frontend (Next.js)
- `web/components/compose-form.tsx`: Main UI for cast vs coin modes, media upload, metadata build, EOA create-now flow.
- `web/components/wallet-status.tsx`: Wallet connection and chain status.
- `web/lib/api.ts`: Helper for resolving backend base URL and auth headers.
- `web/next.config.js`: Development rewrites to backend.

## APIs (Reality)

General
- `GET /health` – Service health.
- `GET /config` – Client config `{ neynarClientId, pinataGatewayDomain }`.

Farcaster
- `GET /farcaster/users/:fid/casts` – List user casts. Optional `limit, cursor, includeReplies`. HTML rendering with `?format=html`.

Auth (SIWN Scaffold)
- `POST /auth/siwn/session` – Create in-memory session with `{ fid, signerUuid }`. Returns `{ token, fid, signerUuid, approved }`.
- `GET /auth/session` – Get session with live signer status.
- `GET /auth/wallet` – Resolve ETH wallet for session fid; includes basic profile meta.
- `GET /signer/status` – Poll signer status (via Neynar).

Uploads (Pinata)
- `POST /uploads/pinata/sign` – Signed upload URL (JWT required).
- `POST /uploads/pinata/direct` – Proxy multipart to Pinata using server JWT.
- `POST /uploads/pinata/legacy` – `pinFileToIPFS` style proxy (JWT or key/secret).
- `GET /uploads/pinata/test-auth` – Quick auth test.
- `GET /uploads/pinata/config` – Show presence of JWT and gateway domain (sanitized).

Cast Scheduling
- `POST /casts/schedule` – Enqueue cast.
- `GET /casts/queue` – List queue.
- `POST /casts/:id/cancel` – Cancel pending.
- `POST /casts/:id/reschedule` – Reschedule pending.
- `POST /tasks/run` – Process due casts.

Zora Coins
- Immediate (server signer): `POST /zora/coins/create` – Validates inputs, resolves creator address, calls `createContentCoin`.
- Metadata helper (Pinata JSON): `POST /zora/coins/metadata` – Builds and pins JSON with `ipfs://` fields.
- Scheduler: `POST /zora/coins/schedule`, `GET /zora/coins/queue`, `POST /zora/coins/:id/cancel`, `POST /zora/tasks/run`.
- EOA “Create Now” flow:
  - Preview: `POST /zora/coins/call/preview` → `{ to, data, value, chainId }` (uses `buildCreateCoinCall`, now correctly shaped and without metadata fetch).
  - Confirm: `POST /zora/coins/create/confirm` → acknowledges `{ ok: true, txHash, ... }` (no persistence yet).

## Data and Models
- No database currently. Jobs and sessions are in-memory TypeScript objects:
  - Cast queue: `ScheduledCast` in `src/index.ts`.
  - Zora queue: `ScheduledZoraCoin` in `src/index.ts`.
  - Sessions: `Map<string, { token, fid, signerUuid, createdAt }>`.
- Planned: persistence in future PRD stories (see `docs/prd/` and `docs/stories/`).

## Integration Points

Neynar
- SDK via `@neynar/nodejs-sdk` in `src/neynarClient.ts`. Used for user fetch, wallet resolution, signer status, and publishing casts.

Zora Coins
- SDK via `@zoralabs/coins-sdk` in `src/zoraService.ts`. Two modes:
  - Server-signed creation (requires `ZORA_SIGNER_PRIVATE_KEY`).
  - EOA flow using preview calldata (wallet signs in the browser).
- Chain: Base mainnet by default (`ZORA_CHAIN_ID=8453`), Base Sepolia supported via env.

Pinata (IPFS)
- JWT or key/secret supported for uploads.
- Signed upload URL path and direct proxy provided.
- Gateway domain configurable (`PINATA_GATEWAY_DOMAIN`), fallback to `ipfs.io` if not set.

Frontend Integration
- `web/next.config.js` rewrites to backend during dev; `web/lib/api.ts` resolves the correct base URL depending on UI port.
- Wagmi/Viem handle wallet send of previewed calldata.

## Development and Deployment

Local Dev
- Backend: `npm run dev` → Express on `http://localhost:3000`.
- Frontend: from `web/`, `npm run dev` → Next on `http://localhost:3001`.
- Static demo: `http://localhost:3000/app.html` (uses `/config` for client vars).

Environment Variables
- Backend: `NEYNAR_API_KEY`, `NEYNAR_CLIENT_ID`, `PINATA_JWT` (optional), `PINATA_GATEWAY_DOMAIN` (optional), `ZORA_API_KEY`, `ZORA_SIGNER_PRIVATE_KEY`, `ZORA_CHAIN_ID`, `ZORA_RPC_URL`, optional `ZORA_PLATFORM_REFERRER`, `ZORA_TRADER_REFERRER`.
- Frontend: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_BASE_CHAIN_ID`, `NEXT_PUBLIC_NEYNAR_CLIENT_ID`.

Build & Start
- Backend: `npm run build && npm start` (emits `dist/`).
- Frontend: `npm run build && npm start` in `web/`.

## Technical Debt and Known Issues

- No DB persistence: sessions and queues are memory-only; restarts drop state.
- TypeScript types for Neynar: `src/neynarClient.ts` tolerates multiple SDK response shapes; current typecheck may fail if strict types enforced. Dev run uses `--transpile-only`.
- CORS: backend allows all origins for dev; must restrict in production.
- Secrets in `.env`: do not commit real keys. Ensure operational secrets are handled via secure env stores.
- Production rewrites: `web/next.config.js` only proxies in dev; configure API base in prod or host behind the same origin.
- IPFS validation fetch: Zora preview originally fetched `metadata.uri`; now disabled via `skipMetadataValidation` to avoid environmental failures during preview. Ensure metadata is valid before on-chain operations.

## If Enhancement PRD Provided — Impact Notes

MA-2: EOA Create Now (implemented)
- Adjusted Zora preview builder to match SDK expectations and avoid external metadata fetch.
- Frontend `compose-form.tsx` consumes `{ to, data, value, chainId }`, sends with Wagmi.

Upcoming Stories (from docs/prd/, docs/stories/)
- Persist queues and sessions in a database.
- Strengthen request validation with `zod`.
- Harden auth/session model for production (JWT/cookies, CSRF, etc.).

## Appendix — Useful Commands

Backend
- `npm run dev` – start Express (hot reload)
- `npm run typecheck` – TS type checking
- `npm run build && npm start` – compile and run

Frontend (web/)
- `npm run dev` – Next dev server
- `npm run build && npm start` – Next production server

Diagnostics
- `GET /health` – basic liveness
- `GET /uploads/pinata/config` – Pinata config presence
- `GET /debug/fid/:fid/wallet` – Neynar wallet resolution for a FID

