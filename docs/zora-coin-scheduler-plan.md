# Zora Content Coin Scheduler — PRP Implementation Plan

## Objective

Add a new feature to schedule creation of a Zora Content Coin using the user’s connected wallet (via Farcaster identity where possible), including title, caption, and media (image or video). The scheduler mirrors the existing cast scheduler: upload media, build metadata, schedule job, and execute at the due time.

## Key References

- Zora Docs: https://docs.zora.co/coins
- SDK Getting Started: https://docs.zora.co/coins/sdk
- Create Coin: https://docs.zora.co/coins/sdk/create-coin
- Coins Metadata Builder: https://docs.zora.co/coins/sdk/metadata-builder
- Contracts: https://docs.zora.co/coins/contracts/creating-a-coin
- Demonstration repo (community): https://github.com/iainnash/zora-coins-sdk-demo

## Exact SDK Calls (from working demo)

Package: `@zoralabs/coins-sdk`

- `createMetadataBuilder()`
  - Chainable: `.withName(name)`, `.withSymbol(symbol)`, `.withDescription(description)`, `.withImage(file)`
  - Finalize with: `.upload(createZoraUploaderForCreator(address))`
  - Returns: `{ createMetadataParameters }` for coin creation
- `createZoraUploaderForCreator(address)`
  - Binds uploader to a given EVM address
- `DeployCurrency`
  - Enum; example: `DeployCurrency.ZORA`
- `createCoinCall(createCoinArgs)`
  - Returns viem-compatible call params for `writeContract`
  - Alternative: `createCoin(...)` which may perform simulate+write

Working example (from demo, React/wagmi):

```ts
import { createMetadataBuilder, createZoraUploaderForCreator, DeployCurrency, createCoinCall } from '@zoralabs/coins-sdk'
import { base } from 'viem/chains'

const { createMetadataParameters } = await createMetadataBuilder()
  .withName(name)
  .withSymbol(symbol)
  .withDescription(description)
  .withImage(file)
  .upload(createZoraUploaderForCreator(address))

const createCoinArgs = {
  ...createMetadataParameters,
  payoutRecipient: address,
  currency: DeployCurrency.ZORA,
  chainId: base.id,
}

const tx = await createCoinCall(createCoinArgs)
// then writeContract({ ...tx, chain: base })
```

## Implementation Approach (Our App)

We implement server-side scheduling and a lightweight UI in `public/app.html`. For now, execution is scaffolded; a custodial/relayer signer is required to actually broadcast the transaction at the due time.

### UI Changes (public/app.html)

- New section: “Zora Coin: Create + Schedule”
  - Inputs: Title, Symbol (optional), Caption, File (image/video), Date-Time
  - Client uploads media via existing Pinata flow and stores CID
  - Calls `/zora/coins/metadata` to pin metadata JSON with `{ name, description, image|animation_url }`
  - Calls `/zora/coins/schedule` with `{ title, caption, symbol, when, mediaUrl?, metadataCid? }`
- New queue: “Zora Coin Queue” with status, when, title, symbol, tx hash, error, and cancel action
- Controls: “Create Due Now” invokes `/zora/tasks/run`

### Backend Endpoints (src/index.ts)

- `POST /zora/coins/metadata`
  - Body: `{ title, caption, symbol?, imageCid?, videoCid? }`
  - Uses `PINATA_JWT` to upload a `metadata.json` to IPFS
  - Returns `{ cid, url }`

- `POST /zora/coins/schedule`
  - Body: `{ title, caption, symbol?, imageCid?, videoCid?, metadataCid?, walletAddress?, chainId?, when, idem? }`
  - Stores a `zora-coin` job in memory (dev)

- `GET /zora/coins/queue`
  - Lists scheduled Zora coin jobs

- `POST /zora/coins/:id/cancel`
  - Cancels a pending job

- `POST /zora/tasks/run`
  - Runs due coin jobs via `processDueZoraJobs()` (currently a scaffold)

### Worker Execution (Scaffold → Full)

Current scaffold (dev):
- Marks job as `creating` → simulates `created` with placeholder `coinAddress`/`txHash`.

Full implementation (next phase):
- Configure signer (custodial or relayer):
  - `ZORA_SIGNER_PRIVATE_KEY` env var
  - `ZORA_RPC_URL` and `ZORA_CHAIN_ID` (default: Base)
  - Use `viem` to create wallet and public clients
- Build metadata parameters:
  - Option A: If `metadataCid` provided, set URI directly
  - Option B: Use `createMetadataBuilder()` and `createZoraUploaderForCreator(creatorAddress)` if running client-side or with suitable upload context
  - Option C: Server-side: continue using Pinata for media + metadata JSON
- Build `createCoinArgs` and use either `createCoinCall` → `writeContract` or `createCoin` with the clients
- Store `txHash`, wait for receipt, derive `coinAddress`, mark as `created`

### Wallet Linking (Farcaster → Wallet)

- Preferred: resolve EVM address from Farcaster via Neynar (verified addresses or custody)
- Fallback: let user input `walletAddress` to use as `payoutRecipient`/creator
- Persist mapping for future jobs

### Media & Metadata

- Media stored on IPFS via existing Pinata flow
- Metadata JSON schema:
  - Image: `{ name, description, image: 'ipfs://<CID>' }`
  - Video: `{ name, description, animation_url: 'ipfs://<CID>', image? }`

### Env & Config

- `PINATA_JWT` (required for uploads & metadata pin)
- `PINATA_GATEWAY_DOMAIN` (optional; recommend `gateway.pinata.cloud`)
- `ZORA_SIGNER_PRIVATE_KEY` (required for onchain execution in worker)
- `ZORA_CHAIN_ID` (default 8453 — Base)
- `ZORA_RPC_URL` (optional; if not using default provider)

## Task Breakdown

1) UI: Add Zora coin schedule form and queue (done)
2) Backend: Add `/zora/coins/metadata` and `/zora/coins/schedule` (done)
3) Worker: Replace scaffold with real `@zoralabs/coins-sdk` integration (pending)
4) Wallet mapping: Resolve FC → EVM via Neynar; add `/zora/wallet` endpoint (pending)
5) Observability: Log tx links; surface errors and guidance in UI (pending)
6) Security: Swap dev bearer sessions for cookies/JWT; validate inputs (pending)

## Testing Plan

- Unit: Validate endpoint payloads; metadata JSON structure
- Integration: Mock Pinata responses; ensure CIDs propagate; schedule+list+cancel flows
- E2E (manual):
  - Upload image and video; build metadata; schedule jobs for near future
  - Run `/zora/tasks/run`; verify `txHash`/`coinAddress` once SDK is integrated

## Open Questions

- Chain defaults: Zora vs Base vs testnets (docs indicate Base in example)
- Relayer support and spending controls
- Whether to always require metadataCid, or allow implicit from media URL

