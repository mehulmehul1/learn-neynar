# Zora Coins Feature — PRP Implementation Plan

## Overview
- Goal: Create and schedule “Content Coins” on Zora from a user’s Farcaster-linked wallet.
- Scope: Backend endpoints + worker + simple UI to schedule coin creation with media (image/video), title, caption, and (optional) symbol.
- Out of scope: Wallet custody; we assume a signer is resolvable for the user’s Farcaster EOA.

## Architecture
- UI: `public/zora.html` — form for title/caption/media/schedule; lists queue.
- API (Express):
  - `POST /zora/coins/schedule` — enqueue coin creation.
  - `GET /zora/coins/queue` — list scheduled jobs.
  - `POST /zora/coins/:id/cancel` — cancel pending job.
  - `POST /zora/tasks/run` — run workers for casts + zora coins.
- Worker: `processDueZoraJobs()` — resolves signer, builds metadata JSON, uploads to IPFS, calls Zora Coins SDK to create coin, stores `coinAddress`, `txHash`, `metadataUri`.

## Data Model (in-memory scaffold)
```
ScheduledZoraCoin {
  id, fid?, walletAddress?, title, caption?, symbol?, mediaUrl?, mediaMime?, when,
  status: pending|creating|created|failed|canceled,
  coinAddress?, txHash?, metadataUri?, error?, createdAt, updatedAt
}
```

## Exact SDK / Contracts (to confirm via docs)
- Coins SDK: Create Coin function and Metadata Builder (pages crawled in Archon):
  - `/coins/sdk/create-coin` — function name + params (name, symbol?, metadataURI, …)
  - `/coins/sdk/metadata-builder` — fields for image vs video (`image`, `image_mime_type`, `animation_url`, `animation_url_mime_type`).
- Contracts: `/coins/contracts/creating-a-coin` — factory address + method signature.
- Network: Zora chain ID + RPC.

## Metadata Rules
- Title → `name`.
- Caption → `description`.
- Image → `image`, `image_mime_type`.
- Video → `animation_url`, `animation_url_mime_type` (+ `image` poster if desired).
- Optional: `external_url`, `attributes`.

## Scheduling Flow
1) Client uploads media to IPFS (Pinata signed URL) and gets `mediaUrl` + `mediaMime`.
2) Schedules job with `title`, `caption`, `symbol?`, `mediaUrl`, `mediaMime`, `when`.
3) Worker time:
   - Resolve signer from Farcaster → EOA (custody or linked wallet).
   - Build metadata JSON via SDK helper, upload to IPFS; get `metadataUri`.
   - Call Coins SDK `createCoin` with required params.
   - Persist `coinAddress`, `txHash`, `metadataUri` or mark `failed`.

## Security & Ops
- Signer management: use server-side keys or wallet provider (e.g., embedded key mgmt).
- Rate limiting and idempotency: ensure idempotent creation if retried.
- Monitoring: log tx hash, address, and failures.

## TODOs / Open Questions
- Confirm SDK package name, import path, and exact `createCoin` signature.
- Confirm factory addresses and chain ID for Zora.
- Decide on default symbol rules if user omits it.
- Add persistent storage (DB) for production.

## Rollout Plan
- Phase 1: Ship scaffold (UI + endpoints + worker stub) — dev testing only.
- Phase 2: Wire exact SDK calls + signer resolution + IPFS metadata.
- Phase 3: Add retries, webhooks, and admin observability.

