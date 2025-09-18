# learn-neynar
## Neynar Farcaster Backend (Node + TypeScript) + Zora Coins Integration

Backend scaffold for a Farcaster app using Neynar's Node.js SDK with **full Zora coins integration**. Create tradeable cryptocurrency tokens from social media content. Includes a lightweight demo UI in `public/app.html` to sign in, upload media to Pinata, schedule casts, and **create Zora coins**.

### 🚀 New: Zora Coins Integration

- ✅ **Create Content Coins**: Turn posts into tradeable tokens
- ✅ **Wallet Integration**: Automatic Farcaster → Ethereum address resolution
- ✅ **Immediate Creation**: "Create Now" functionality for instant coin deployment
- ✅ **Scheduled Creation**: Queue coins for future launches
- ✅ **Profile Integration**: View user's existing Zora coins and profile

See [ZORA_SETUP.md](./ZORA_SETUP.md) for detailed setup instructions.

### Prerequisites
- Node.js 18+
- Neynar API Key (get one from Neynar)
- **For Zora Integration**: Zora API Key + Ethereum private key with Base ETH

### Setup
1. Copy `.env.example` to `.env` and set required variables:
   
   ```bash
   cp .env.example .env
   # Edit .env and set:
   # NEYNAR_API_KEY=your_api_key
   # NEYNAR_CLIENT_ID=your_client_id
   # 
   # For Zora integration:
   # ZORA_API_KEY=your_zora_api_key  
   # ZORA_SIGNER_PRIVATE_KEY=0x...
   ```

2. Install dependencies:
   
   ```bash
   npm install
   ```

3. Start the dev server:
   
   ```bash
   npm run dev
   # Server: http://localhost:3000
   ```

**🎯 Quick Test**: Navigate to `http://localhost:3000/app.html`, sign in with Neynar, toggle to "Zora Coin" mode, and create your first token!

### Available Scripts
- `npm run dev` – Start dev server (ts-node-dev)
- `npm run build` – Compile TypeScript to `dist/`
- `npm start` – Run compiled server
- `npm run typecheck` – TS type check without emit

### API
- `GET /health` – Service health
- `GET /farcaster/users/:fid/casts` – Fetch recent casts for a user
  - Query: `limit`, `cursor`, `includeReplies`

#### 🪙 Zora Coins Integration
- `POST /zora/coins/create` – Create a content coin immediately
  - Body: `{ title: string, caption: string, mediaUrl: string, symbol?: string }`
- `POST /zora/coins/schedule` – Schedule a coin creation
  - Body: `{ title: string, caption: string, mediaUrl: string, when: string }`  
- `GET /zora/coins/queue` – List scheduled coin jobs
- `GET /zora/profile` – Get user's Zora profile and coins
  - Query: `fid` or `address`
- `GET /auth/wallet` – Check wallet connection for current session

Referral rewards:
- Set `ZORA_PLATFORM_REFERRER=0x...` to attribute platform/developer referral on coin creation. The SDK’s `platformReferrer` field is passed on `createCoin`, enabling protocol referral rewards for your address.

#### Scheduler + Uploads (Scaffold)
- `POST /uploads/pinata/sign` – Create a temporary Pinata signed upload URL (requires `PINATA_JWT`)
  - Body (optional): `{ filename?: string, expires?: number, groupId?: string, network?: 'public'|'private' }`
  - Response: `{ url: string, expires: number }`
- `POST /casts/schedule` – Create a scheduled cast
  - Body: `{ text: string, mediaUrl?: string, when: string (ISO UTC), idem?: string, signerUuid?: string, fid?: number }`
  - If `signerUuid`/`fid` not provided, server uses the current session
  - Response: `{ job: ScheduledCast }`
- `GET /casts/queue` – List scheduled jobs
  - Query: `status?: pending|publishing|posted|failed|canceled`, `fid?: number`
- `POST /casts/:id/cancel` – Cancel a pending job
- `POST /casts/:id/reschedule` – Reschedule a pending job
- `POST /tasks/run` – Process due jobs (serverless cron friendly)

Notes:
- Jobs are stored in-memory for development; replace with a database for production.
- `POST /tasks/run` attempts to publish casts using Neynar `publishCast`. Jobs require a valid `signerUuid`.

#### Auth (SIWN) (Scaffold)
- Frontend: include the SIWN button per Neynar docs (script tag with `data-client_id` and `data-success-callback`). On success, you receive `{ fid, signer_uuid }`.
- `POST /auth/siwn/session` – Create a backend session after SIWN success
  - Body: `{ fid: number, signerUuid: string }`
  - Response: `{ token, fid, signerUuid, approved }`
- `GET /auth/session` – Return session + live signer status
  - Header: `Authorization: Bearer <token>` or `x-session-token: <token>`
- `GET /signer/status` – Poll signer approval by current session
  - Header: `Authorization: Bearer <token>` or `x-session-token: <token>`

Notes:
- Sessions are in-memory bearer tokens for dev convenience; replace with signed cookies/JWT + DB in production.

### Next Steps
- Wire `@neynar/nodejs-sdk` in `src/neynarClient.ts` and implement example endpoints:
  - Fetch user by FID, casts, followers, etc.
  - Optionally, implement casting endpoints if you plan to post casts (requires signer).
- Add request validation with `zod` as needed.

### Pinata (IPFS) Setup (Optional)
- Add to `.env`:
  - `PINATA_JWT=...` – Pinata JWT with upload permissions
  - `PINATA_GATEWAY_DOMAIN=` – Optional gateway domain used to build public URLs

- Upload flow: client requests `POST /uploads/pinata/sign`, uploads file directly to Pinata using the returned signed URL, then schedules a cast with the public URL `https://<gateway>/ipfs/<CID>` (or a public gateway fallback) as an embed.

### What We Achieved (Scheduling + Uploads)
- End‑to‑end scheduling works with media uploaded to Pinata and embedded by URL.
- Using `PINATA_GATEWAY_DOMAIN=gateway.pinata.cloud` allows immediate public previews/embeds.
- Dedicated Pinata gateways (e.g., `*.mypinata.cloud`) can reject requests with "This content cannot be requested through the gateway you are using - ERR_ID:00024" if access policies restrict serving that CID. In that case, use a public gateway or adjust gateway access.

### Pinata Gateway: Recommended Settings and Fix
- Quickest path: set `PINATA_GATEWAY_DOMAIN=gateway.pinata.cloud` (public Pinata gateway) or leave it empty to fall back to `https://ipfs.io`.
- If you prefer your dedicated gateway (`*.mypinata.cloud`):
  - In the Pinata dashboard, configure Gateway Access Control to allow serving the content you upload (e.g., allow public IPFS content or at least content pinned by your account).
  - For restricted setups, use Signed Gateway Tokens and append the signature to the URL, or proxy via your backend to sign requests.

### How Uploads Work Here
- Client (see `public/app.html`) requests a short‑lived signed URL via `POST /uploads/pinata/sign` with `network: "public"`.
- Client uploads the file to `https://uploads.pinata.cloud/v3/files` using that signed URL and receives a `cid`.
- The preview URL is constructed as:
  - `https://${PINATA_GATEWAY_DOMAIN}/ipfs/${cid}` if the env var is set, otherwise
  - `https://ipfs.io/ipfs/${cid}` as a fallback.
- Server fallbacks exist:
  - `POST /uploads/pinata/direct` proxies multipart upload using your `PINATA_JWT`.
  - `POST /uploads/pinata/legacy` supports older `pinFileToIPFS` style flows.

### Scheduling Flow (Working)
- `POST /auth/siwn/session` creates a dev session after SIWN success.
- `POST /casts/schedule` accepts `{ text, mediaUrl?, when (ISO UTC) }` and enqueues a job.
- `POST /tasks/run` publishes due jobs using Neynar `publishCast`, attaching `embeds: [{ url: mediaUrl }]` when provided.

### Env Vars
- `NEYNAR_API_KEY` – required (server)
- `NEYNAR_CLIENT_ID` – required for SIWN button (client)
- `PINATA_JWT` – optional, enables Pinata uploads
- `PINATA_GATEWAY_DOMAIN` – optional, gateway domain to build IPFS URLs
- **Zora Integration**:
  - `ZORA_API_KEY` – required for Zora integration
  - `ZORA_SIGNER_PRIVATE_KEY` – required for coin creation (Ethereum private key)
  - `ZORA_CHAIN_ID` – optional (default: 8453 for Base mainnet)
  - `ZORA_RPC_URL` – optional (default: Base mainnet RPC)
  - `ZORA_PLATFORM_REFERRER` – optional developer/platform referral address
  - `ZORA_TRADER_REFERRER` – optional, reserved for future trade flows

### Demo UI (Optional)
- Static page: `public/app.html`
- Config endpoint: `GET /config` → `{ neynarClientId, pinataGatewayDomain }`
- Visit `http://localhost:3000/app.html`
  - Sign in with Neynar SIWN button
  - Upload media to Pinata (if configured)
  - Compose text + pick date/time
  - Schedule and view queue
  - Click “Publish Due Now” or rely on the dev auto-worker

Tips:
- If a preview fails on a `*.mypinata.cloud` domain with `ERR_ID:00024`, switch to `gateway.pinata.cloud` or leave `PINATA_GATEWAY_DOMAIN` blank and retry.

### Dev Auto-Worker
- Env var: `DEV_CRON_MS` (milliseconds, default `30000`)
- When set > 0, the server checks for due jobs on an interval and publishes them.

### BrowserMCP (Browserbase MCP) for Codex
- Config file: `mcp.server.browserbase.json`
- Env vars in `.env.example`: `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`, `GEMINI_API_KEY`
- To use: point your MCP client (e.g., Codex CLI) at `mcp.server.browserbase.json` or copy its `mcpServers` entry into your client’s MCP config. Fill the three env vars with your keys. The config runs the server via `npx @browserbasehq/mcp` over STDIO.
- Optional: If your client supports SHTTP or you prefer a hosted URL, follow `@browserbasehq/mcp` docs to use a Smithery-generated URL and, if needed, `mcp-remote`.
## Frontend Design System (web/)

The Next.js app under `web/` now hosts our shadcn/ui design system foundation.

### Initialise or update shadcn components

```bash
cd web
npx shadcn@latest add <component-name>
```

Generated components are written to `web/components/ui` and share the `@/components/ui` alias. Tokens live in `web/styles/tokens.css` and are imported globally from `web/app/globals.css`.

### Storybook workflow

```bash
cd web
npm run storybook        # dev preview with light/dark + dynamic type toggles
npm run storybook:build   # generate static Storybook for CI
npm run storybook:test    # run accessibility + interaction test runner
```

The baseline `stories/Tokens.stories.tsx` file shows color, typography, spacing, radii, and shadow tokens with dynamic type controls.
