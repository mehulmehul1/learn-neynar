# Kamo (Neynar + Zora) Brownfield Architecture Document

## Introduction
This document captures the current state of the Kamo codebase that powers a Farcaster content scheduler and Zora Coin scheduling/creation. It documents real implementation details, integration constraints, and technical debt to support AI agents enhancing the system.

### Document Scope
Focused on areas relevant to: Farcaster cast scheduling and Zora Coins scheduling/creation (per PRP docs in `docs/`).

### Change Log
| Date | Version | Description | Author |
| ---- | ------- | ----------- | ------ |
| 2025-09-09 | 1.0 | Initial brownfield analysis | Architect |

## Quick Reference — Key Files and Entry Points
- Main Entry: `src/index.ts:978` (server listen) and routes at:
  - Health/config/static: `src/index.ts:26`, `:31`, `:42`, `:50`
  - SIWN + session: `src/index.ts:281`, `:311`, `:333`
  - Pinata uploads: `src/index.ts:351`, `:389`, `:420`, `:459`, `:475`
  - Farcaster (casts): `src/index.ts:198`, `:487`, `:528`, `:545`, `:559`, `:612`
  - Zora (coins): `src/index.ts:623`, `:685`, `:740`, `:804`, `:864`, `:881`, `:944`
- Neynar SDK wrapper: `src/neynarClient.ts:1`
- Zora integration service: `src/zoraService.ts:1` (wallet/clients, metadata helpers, coin creation)
- Demo UI: `public/app.html:1` (single-page demo for scheduling & queues)
- Configuration examples: `.env.example:1`

## High-Level Architecture
- Runtime: Node.js 18+ (TypeScript → Express HTTP API)
- HTTP Server: Express (JSON API + static UI)
- Client UI: Static HTML/JS (no framework) served from `/public`
- External Services:
  - Neynar API (`@neynar/nodejs-sdk`) for Farcaster SIWN, signer lookup, publishCast, and user data
  - IPFS via Pinata for media upload/pinning
  - Zora Coins via `@zoralabs/coins-sdk` and `viem` for wallet/client and on-chain calls
- Job Processing: In-memory arrays + interval “DEV cron”; manual run endpoint
- Persistence: None (in-memory only). Not suitable for production (volatile and single-instance only).

### Actual Tech Stack (package.json)
| Category | Technology | Version | Notes |
| -------- | ---------- | ------- | ----- |
| Runtime | Node.js | >=18 | Uses native fetch (shimmed typing) |
| Server | Express | ^4.19.2 | REST routes for auth/uploads/queues |
| Farcaster | @neynar/nodejs-sdk | latest | SIWN, signer status, publish casts |
| Zora | @zoralabs/coins-sdk | ^0.3.0 | Metadata builder + createCoin |
| EVM | viem | ^2.9.6 | Public/wallet client + chains |
| Types | TypeScript | ^5.5.4 | ts-node-dev for dev |

## Repository Structure Reality Check
- Monorepo-like with an embedded Archon subproject (`archon/`) running separately.
- App code is a single Express service with a static demo UI.
- Docs include PRP and plans for Zora Coins and scheduler features.

```
project-root/
  src/
    index.ts            # Express API and workers (casts + zora)
    neynarClient.ts     # Neynar SDK wrapper
    zoraService.ts      # Zora wallet/client, metadata, coin creation
  public/
    app.html            # Demo UI (SIWN, compose, upload, schedule, queues)
  docs/
    prp-zora-coins.md
    zora-coin-scheduler-plan.md
    miniapp-scheduler-plan.md
  .env.example          # Required/optional envs for service
```

## Core Domains

### Farcaster Cast Scheduling
- Endpoints (selected):
  - `GET /farcaster/users/:fid/casts` renders JSON/HTML feed for a user (`src/index.ts:198`)
  - `POST /auth/siwn/session` creates a backend session from SIWN result (`:281`)
  - `GET /auth/session` returns session and live signer status (`:311`)
  - `POST /casts/schedule` schedule a cast with `{ text, mediaUrl?, when, idem }` (`:487`)
  - `GET /casts/queue` list queued casts; supports filters (`:528`)
  - `POST /casts/:id/cancel` cancel pending (`:545`)
  - `POST /casts/:id/reschedule` reschedule pending (`:559`)
  - `POST /tasks/run` process due casts (and Zora jobs in combined run) (`:612`)
- Data model (in-memory): ScheduledCast with fields id/fid/signerUuid/text/mediaUrl/when/status/castHash/error/timestamps.
- Worker: `processDueJobs()` (not shown in this doc; runs from `/tasks/run` or interval). Uses Neynar `publishCast` with `signerUuid`.

### Zora Coin Scheduling/Creation
- Endpoints:
  - `POST /zora/coins/create` immediate creation with payload (via `ZoraService`) (`src/index.ts:623`)
  - `POST /zora/coins/metadata` build/upload metadata (Pinata) → `metadataUri` (`:685`)
  - `POST /zora/coins/schedule` schedule content coin creation with `{ title, symbol?, caption?, mediaUri?, metadataUri, when, walletAddress? }` (`:740`)
  - `GET /zora/profile` view Zora profile + created coins for an identifier (address/handle/fid) (`:804`)
  - `GET /zora/coins/queue` list scheduled coin jobs (`:864`)
  - `POST /zora/coins/:id/cancel` cancel pending coin job (`:881`)
  - `POST /zora/tasks/run` process due coin jobs (also runs cast jobs) (`:944`)
- Data model (in-memory): ScheduledZoraCoin with id/fid/walletAddress/title/caption/symbol/mediaUrl/mediaMime/metadataUri/when/status/txHash/coinAddress/error/timestamps.
- Worker: `processDueZoraJobs()` reads due jobs, calls `zoraService.createContentCoin()` and updates job status.

### Uploads (Pinata)
- Endpoints:
  - `POST /uploads/pinata/legacy` and `/direct`/`/sign` for upload strategies (`src/index.ts:351`, `:389`, `:420`)
  - `GET /uploads/pinata/config` exposes gateway domain (`:475`)
  - `GET /uploads/pinata/test-auth` diagnostics (`:459`)

## Service Modules

### NeynarService (`src/neynarClient.ts:1`)
- Wraps `@neynar/nodejs-sdk` for:
  - `fetchCastsForUser`, `publishCast`, `lookupSigner`
  - `resolveWalletForFid` (verified/custody addresses), `getUserProfile`

### ZoraService (`src/zoraService.ts`)
- Initializes `publicClient` and `walletClient` using `viem` with Base chain and signer private key.
- Metadata helpers:
  - `createImageMetadata` and `createVideoMetadata` (generates JSON and uploads to Pinata)
- Coin creation:
  - `createContentCoin({ title, description, creatorAddress, metadataUri, symbol?, currency?, startingMarketCap? })`
  - `createCreatorCoin({ name, symbol, creatorAddress, metadataUri? })`
- Profile:
  - `getProfileInfo(addressOrHandle)` aggregates profile + first 10 created coins
- Utilities:
  - `isConfigured()`, `getWalletAddress()`, `getReferralConfig()`, `generateSymbol()`

## Configuration & Environments
See `.env.example` for all variables. Notable:
- Farcaster/Neynar: `NEYNAR_API_KEY`, `NEYNAR_CLIENT_ID`
- Zora: `ZORA_API_KEY`, `ZORA_SIGNER_PRIVATE_KEY`, `ZORA_CHAIN_ID` (default 8453 Base), `ZORA_RPC_URL`
- Referrals (optional): `ZORA_PLATFORM_REFERRER`, `ZORA_TRADER_REFERRER`
- Pinata: `PINATA_JWT`, `PINATA_GATEWAY_DOMAIN`
- Server: `PORT` (default 3000), `DEV_CRON_MS` (interval run)

Security notes:
- Never commit real keys. The current `.env` contains secrets and should be rotated. Use `.env.local` or secret manager in production.

## UI Flows (public/app.html)
- SIWN Sign-in → backend `/auth/siwn/session` → token stored in localStorage → `/auth/session` polls signer status
- Compose + Upload (Pinata) → schedule cast or coin
- Queues: lists both cast and coin jobs; actions (cancel, run now)
- Zora profile lookup and display

## Known Constraints & Technical Debt
- In-memory queues: Volatile, single-instance only; race conditions if scaled; no persistence.
- Auth: Demo-only bearer token; no CSRF or full session management.
- Uploads: No size/type enforcement server-side beyond UI hints.
- Error handling: Basic; mixed shapes from SDKs require normalization.
- Onchain ops: Single private key signer; no multi-tenant security or user-paid mode yet.
- Observability: Console logs only; no metrics or tracing.

## Enhancement Impact Areas (from PRP)
- Zora Coins scheduler: Implement persistent storage (DB), retries, and robust worker model; validate exact SDK calls (createCoin) and metadata rules.
- Farcaster scheduler: SIWN wiring and signer approvals; idempotency with `idem`.
- Security: Key management, rate limiting, per-user authorization on queues/actions.
- UI polish: Validation, loading/error states, queue UX improvements.

## Recommended Next Steps
1) Persist jobs in a DB (e.g., SQLite/Postgres) and migrate worker to BullMQ/cron or platform scheduler.
2) Normalize SDK responses and errors; add structured logging + request tracing.
3) Harden auth: scoped sessions, CSRF, per-user access control; encode user IDs in tokens.
4) Add configuration management and secret loading patterns.
5) Implement user-paid AA mode for Zora, and server-paid as fallback as per PRP.

