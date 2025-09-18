*# Farcaster Mini App: Cast + Zora Coin Scheduler — Build Plan

## Status Update (Completed Milestone)

- End‑to‑end scheduling is working via the demo UI (`public/app.html`).
- Media uploads succeed using Pinata’s Files API with signed upload URLs.
- Previews and embeds work when using `PINATA_GATEWAY_DOMAIN=gateway.pinata.cloud` or by leaving the variable empty (fallback to `ipfs.io`).
- A dedicated gateway `*.mypinata.cloud` returned `ERR_ID:00024` due to access policy; switching to `gateway.pinata.cloud` fixed previews immediately.

What changed:
- `.env` now sets `PINATA_GATEWAY_DOMAIN=gateway.pinata.cloud` for reliable public access.
- Upload flow uses `POST /uploads/pinata/sign` (server signs using `PINATA_JWT`) → client uploads to `https://uploads.pinata.cloud/v3/files` → receives `cid` → constructs `https://<gateway>/ipfs/<cid>`.
- Server retains `/uploads/pinata/direct` and `/uploads/pinata/legacy` as fallbacks.

Notes for dedicated gateways:
- To use your `*.mypinata.cloud` domain, configure Gateway Access Control in Pinata to allow serving the uploaded content (or use Signed Gateway Tokens), otherwise you may see `ERR_ID:00024`.

## Goals

- Farcaster: Sign in and publish casts (now or scheduled).
- Zora Coins: Build metadata, create coins (now or scheduled).
- User‑paid mode: Let users pay gas via Base smart accounts (ERC‑4337) using session keys; keep server‑paid as fallback for dev.
- Compose: Text area, media upload (file input), and date–time picker.
- Queue: Page to list upcoming/past jobs with status; allow cancel/reschedule.
- Mini App: Ship as a Farcaster Mini App via `/.well-known/farcaster.json`.

## Architecture

- Frontend: Next.js (recommended) or lightweight SPA served under the same domain as the backend for simple deployment and Mini App compatibility.
- Backend: Node/Express (this repo) exposing JSON endpoints for auth, upload, scheduling, queue, and Zora integration.
- Auth: 
  - Farcaster: SIWN (Sign In with Neynar) to create a session with `fid`; Neynar‑managed signer for writes.
  - Base/Zora: OnchainKit (Base App MiniKit context) to connect a Base smart account. In user‑paid mode, the smart account signs a scoped session key for scheduled execution.
- Storage: Pluggable — either S3‑compatible bucket (S3/R2/Supabase) or Pinata (IPFS). Always store a public URL we can embed in casts.
- Jobs: Scheduler via one of:
  - node-cron (local/dev) polling due jobs every minute.
  - Serverless cron (e.g., Vercel/Netlify) hitting a `/tasks/run` endpoint.
  - Queue (BullMQ + Redis) for robust delayed jobs and retries.

### Zora Coins Integration (Current)
- SDK: `@zoralabs/coins-sdk`
- Metadata: build JSON and pin (Pinata) → use `ipfs://<cid>`
- Create coin: `createCoin({ call: { creator, name, symbol, metadata: { type: 'RAW_URI', uri }, currency, chainId, payoutRecipientOverride } })`
- Server‑paid mode (today): backend signer submits tx and pays gas on Base.

### User‑Paid Mode (New)
- Smart accounts + session keys (ERC‑4337):
  - User connects Base smart account via MiniKit/OnchainKit.
  - App asks user to grant a short‑lived session key scoped to “create coin” (Zora factory), single‑use, with expiry (e.g., T+24h).
  - Backend stores the session key policy and, at schedule time, submits a UserOperation to a bundler; the user’s smart account pays gas.
  - Paymaster can be added later for gasless UX; not required for user‑paid mode.

## Mini App Integration

- Manifest: Serve `/.well-known/farcaster.json` with at least:
  - `miniapp.version`, `miniapp.name`, `miniapp.iconUrl`, `miniapp.homeUrl` pointing to the app entry (e.g., `/app`).
  - Optional: `imageUrl`, `buttonTitle`, `splashImageUrl`, `splashBackgroundColor`, `webhookUrl`.
- Verification: Use Farcaster’s Manifest Tool to add `accountAssociation` proving domain ownership, then embed in the manifest.
- Docs refs: See “Mini apps are expected to serve a farcaster.json… at `/.well-known/farcaster.json`” and example with `accountAssociation` + `miniapp` fields in your docs.

## Auth & Signers

- SIWN: Add the SIWN button to sign users in; on callback, create/find the app user with their `fid`.
- Managed signer: If the user lacks an approved signer for our API key, start signer registration (Neynar-managed is the simplest), guide the user to approve, and poll `lookupSigner` until approved.
- Store: Persist `{ user_id, fid, signer_uuid, approved_at }`. Only proceed to scheduling once signer is approved.

## Media Upload Strategy

- Why: Neynar `publishCast` supports embeds via URLs; uploading files requires hosting them and passing their public URL as an embed.
- Options:
  1) S3‑style presigned upload (recommended for low latency): `POST /uploads/presign` returns `{ url, fields }`; client `PUT`s the file directly; we then use the resulting public URL.
  2) S3 direct upload: `POST /uploads` with `multipart/form-data`, backend streams to S3 and returns the public URL.
  3) Pinata (IPFS): use Pinata’s uploads API or signed upload URLs to store on IPFS and then embed via your dedicated gateway URL. Details below.
- Validation: Enforce file size/type limits (e.g., images/gifs/mp4), optional image transformations, and virus scan if needed. Keep public URLs stable.

### Pinata (IPFS) Integration

- Why: immutable, content‑addressed storage with a CID and portability across gateways; good for permanence and verifiability.
- Upload methods:
  - Direct API (server‑side): `POST https://uploads.pinata.cloud/v3/files` with `multipart/form-data` and `Authorization: Bearer <PINATA_JWT>`.
  - Signed URL (client‑side): backend calls Pinata to create a temporary signed upload URL, client uploads with FormData directly to Pinata (keeps JWT server‑side).
  - Large files: TUS/resumable uploads supported via the same endpoint.
- Response: store `{ cid, url }`, where `url = https://<PINATA_GATEWAY_DOMAIN>/ipfs/<CID>`.
- Embed in cast: `embeds: [{ url }]` when calling `publishCast`.
- Tradeoffs:
  - Pros: permanence, integrity (CID), easy dedupe, portable across gateways.
  - Cons: cold fetch latency, harder deletion (unpin ≠ guaranteed removal), gateway bandwidth limits apply; fewer image transform options vs. S3+CDN.

## Scheduler Design

- Data model (table: `scheduled_casts`):
  - `id` (uuid), `user_id`, `fid`, `signer_uuid`, `text`, `embeds_json` (array), `scheduled_at` (UTC), `idem` (string), `status` (pending|publishing|posted|failed|canceled), `cast_hash` (string|null), `error` (string|null), timestamps.
- API Endpoints (JSON):
  - `POST /auth/siwn/start` → Begin SIWN (if using custom flow).
  - `POST /auth/siwn/callback` → Finalize SIWN; attach signer if missing; set session cookie/JWT.
  - `GET /signer/status` → Returns signer approval state for the logged-in user.
  - `POST /casts/schedule` → Body: `{ text, mediaUrl?, when, idem? }`; validates future time; persists job.
  - `GET /casts/queue?status=&limit=&cursor=` → Paginated list for the logged-in user.
  - `POST /casts/:id/cancel` → Marks pending job as canceled.
  - `POST /casts/:id/reschedule` → Updates `scheduled_at` for pending jobs.
  - `POST /tasks/run` → Runs due jobs (for serverless cron) or run as a worker process.
- Worker logic:
  - Pick all `pending` jobs due now; set `publishing` (to avoid double work across replicas).
  - Call `publishCast({ signerUuid, text, embeds, idem })` (v2 SDK) and capture `cast_hash`.
  - On success → `posted`; on error → retry with backoff and `idem` to ensure idempotency.

## Frontend UX

- Pages:
  - `/app` (entry):
    - If not authenticated → SIWN sign-in.
    - If no approved signer → show “Connect write access” with status polling.
    - Compose form: text area, file input (single media), date–time picker (local with UTC display), preview card, submit.
  - `/queue`: List of scheduled items with status, when, media thumbnail, and actions (cancel/reschedule). Link to posted cast by `cast_hash`.
- Client logic:
  - On file select, upload via presigned URL; preview; store public URL in component state.
  - On submit, POST `/casts/schedule` with `{ text, mediaUrl, when, idem }`.
  - Handle validation errors inline (length, file type/size, time in past, signer pending).

## Publish API Call

- Use Neynar SDK `publishCast` (v2 signature):
  - `publishCast({ signerUuid, text, embeds: mediaUrl ? [{ url: mediaUrl }] : [], idem, parent? })`.
  - Respect API’s expected field names (`parent` instead of `replyTo`, etc.).
  - Log full error payloads in server logs for debugging.

## Validation & Limits

- Text: enforce Farcaster text length limit and mention parsing if needed.
- Media: restrict to supported mime types (e.g., `image/jpeg`, `image/png`, `image/gif`, `video/mp4`) and size (e.g., 10MB). Consider re-encoding or rejecting large files.
- Time: store in UTC; show local and UTC; prevent past scheduling; enforce minimum delay (e.g., ≥ 2 minutes) if desired.

## Observability

- Logs: structured logs for auth, scheduling, publishing, and webhooks (if used).
- Metrics: counters for scheduled/posted/failed; queue depth; retry counts.
- Alerts: notify on repeated publish failures or signer errors.

## Security

- Session: Signed cookies or JWT; include CSRF protection for form POSTs if using cookies.
- Access control: user can only operate on their own jobs (`user_id`/`fid` check on each request).
- Storage: generate unique object keys; validate file types; avoid serving private buckets; sanitize filenames; set appropriate cache and content-type headers.
- Idempotency: require/auto-generate `idem` and dedupe by it server-side.

## Environment & Config

- Required:
  - `NEYNAR_API_KEY`
  - `SESSION_SECRET`
  - Storage (S3 option): `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `PUBLIC_CDN_BASE_URL`
  - Storage (Pinata option): `PINATA_JWT`, `PINATA_GATEWAY_DOMAIN` (recommended `gateway.pinata.cloud` or leave empty to fallback)
  - Scheduler: `CRON_ENABLED=true`, optional Redis vars for BullMQ, or configure platform cron.
- Zora (server‑paid mode):
  - `ZORA_API_KEY`, `ZORA_SIGNER_PRIVATE_KEY`, optional `ZORA_CHAIN_ID` (default 8453 Base), `ZORA_RPC_URL`
- User‑paid mode (AA):
  - `ZORA_EXECUTION_MODE=server|user` (switch)
  - `AA_BUNDLER_RPC=<bundler RPC URL>`
  - Optional future: `PAYMASTER_RPC=<paymaster RPC URL>`
- Optional:
  - `MAX_UPLOAD_MB` (default 10)
  - `TIMEZONE` (display only; store UTC)

## Implementation Phases (Updated)

1) Mini App shell
   - Create frontend pages `/app` and `/queue` with routing and UI shell.
   - Serve `/.well-known/farcaster.json` and complete `accountAssociation` via the manifest tool.
2) Auth & signer
   - Wire SIWN; persist user; implement signer registration/lookup; gated UI.
3) Media upload
   - Implement pluggable upload backend:
     - S3: presigned upload endpoint + client flow
     - Pinata: signed upload URL endpoint or server‑side upload
   - Preview image/video; return public URL (S3 or IPFS gateway URL).
4) Scheduling API + worker
   - CRUD endpoints for scheduled casts; node-cron or serverless cron; publish via Neynar; idempotent retries.
5) Zora coins (server‑paid path)
   - Metadata build endpoint (Pinata) → `cid`.
   - Create coin now and schedule endpoints use metadata URI (`ipfs://<cid>`).
   - Worker submits onchain tx using backend signer.
6) User‑paid mode (smart account + session key)
   - Frontend: connect Base smart account via MiniKit/OnchainKit; generate ephemeral session key; grant scope to Zora factory (single‑use, expiry).
   - Backend: add endpoints
     - `POST /zora/coins/call/preview` → returns exact `{ to, data, value, chainId }` for `createCoin`.
     - `POST /account/session-keys` → store `{ smartAccount, sessionKeyPub, policy, expiresAt }`; allow revoke.
   - Worker (user‑paid mode): build call via SDK, compose UserOperation, sign with session key, submit to bundler (`AA_BUNDLER_RPC`), await receipt.
7) Queue UI
   - List user’s scheduled/past jobs; cancel/reschedule; link to posted cast.
8) Polish & reliability
   - Validation, error states, loading skeletons; logs/metrics; rate limits.

## Open Questions

- Preferred storage provider (S3, R2, Supabase, UploadThing)?
- Hosting platform (affects cron strategy): Vercel/Netlify/Fly/Render/self-hosted?
- Do we support multiple media assets per cast or just one?
- Limits: max file size; allowed mime types; text length rules to enforce.
- Smart account stack: Coinbase Smart Wallet (Base Account) vs generic 4337 SDK?
- Bundler provider: Base recommended, Pimlico, Stackup?
- Session key policy: single‑use only? commit to `metadataUri` hash? strict expiry window?
- Paymaster later: sponsor policy & budget if/when gasless UX is desired.

## Next Steps (Proposed)

- Confirm storage and hosting choices, then I will scaffold:
  - `/.well-known/farcaster.json`
  - Auth routes (SIWN), signer registration/lookup
  - Upload presign + direct upload fallback
  - Schedule and queue endpoints
  - Zora coins: metadata builder + server‑paid create/schedule flow (works today)
  - Add user‑paid mode scaffolding:
    - `POST /zora/coins/call/preview`, `POST /account/session-keys`
    - Frontend: Base smart account connect + session key grant UI
    - Worker path to submit UserOperations via bundler
  - Minimal frontend pages for compose and queue
