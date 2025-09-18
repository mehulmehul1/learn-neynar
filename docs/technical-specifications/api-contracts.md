# API Contracts

## Context
- The Express backend in `src/index.ts` remains the canonical API surface for the Next.js frontend under `web/`, providing Farcaster and Zora orchestration, uploads, and scheduling workflows.
- `src/neynarClient.ts` supplies SIWN, wallet lookup, friend graph, and cast publishing helpers; `src/zoraService.ts` manages coin creation, portfolio analytics, and referral metadata.
- All endpoints are authenticated via SIWN-derived bearer tokens unless explicitly noted. WebSocket connections inherit the same session and must validate tokens on handshake.
- Specifications below extend the existing contracts to cover real-time collaboration, enhanced calendar tooling, social proof, ticker management, and shadcn-driven UI patterns captured in `docs/full_frontend_research_ux_design_plan_onchain_mini_app_final_merged_compose_v_3.md`.

## Global Conventions
- **Authentication:** REST, WebSocket, and SSE calls require `Authorization: Bearer <token>` unless an endpoint explicitly documents public access.
- **Error Envelope:** All non-2xx responses follow the standard structure documented in Error Handling & Offline Support. Errors include stable `code` values for client branching.
- **Pagination:** Cursor-based pagination is the default for all list endpoints. Requests accept `limit` (default `20`, max `100` unless otherwise stated) and an opaque base64 `cursor` issued from the prior page's `nextCursor`. Servers validate cursors for signature, timestamp freshness, and ownership; invalid cursors return `400 INVALID_CURSOR`. Responses include `items` arrays and a `nextCursor` (or omit/null when no more results). Clients must not assume cursor structure and should reset pagination when filters change.
- **Timestamps:** Unless noted, the API exchanges ISO-8601 strings in UTC (`Z` suffix). Inputs that include offsets are normalized to UTC.
- **Idempotency Keys:** Mutating endpoints accepting `Idempotency-Key` honor a 24-hour replay window per user + route. Replays with identical payloads return the original response; divergent payloads yield a `409 IDEMPOTENCY_CONFLICT` variant per endpoint.

## Real-Time Updates & WebSocket / SSE Integration
### Connection
- **Endpoint:** `GET /api/realtime` (upgrades to WebSocket) or `GET /api/realtime/sse` (Server-Sent Events fallback).
- **Auth:** `Authorization: Bearer <token>` header; reject handshake if invalid/expired.
- **Protocol:** Both transports emit newline-delimited JSON objects conforming to the `RealtimeMessage` schema below. Messages are strictly ordered per channel and include deterministic IDs for replay.
- **Status Codes:**
  - WebSocket: `101 Switching Protocols`, `401 Unauthorized`, `403 FORBIDDEN_REALTIME`, `429 RATE_LIMITED`.
  - SSE: `200 OK`, `401 Unauthorized`, `403 FORBIDDEN_REALTIME`, `429 RATE_LIMITED`.
- **Success Example (SSE):**
```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache

id: evt_20250916T120001Z_q1
event: message
data: {"id":"evt_20250916T120001Z_q1","type":"queue:update","payload":{"jobId":"job_789","status":"publishing"},"ts":"2025-09-16T12:00:01.234Z","requestId":"req_publish_456"}
```
- **Error Example:**
```json
{
  "error": {
    "code": "FORBIDDEN_REALTIME",
    "message": "User lacks permission to join realtime channel",
    "metadata": { "channel": "calendar:sync" }
  }
}
```

### Message Envelope
```json
{
  "id": "evt_20250916T120000Z_q1",
  "type": "queue:update",
  "payload": {},
  "ts": "2025-09-16T12:00:00.000Z",
  "requestId": "req_a1b2c3",
  "scope": "user:123",
  "retry": 1000
}
```
- `id` – monotonic per channel; reused as SSE `id` field and WebSocket ack pointer.
- `type` – matches one of the channel topics below.
- `payload` – typed object described per channel.
- `ts` – ISO-8601 UTC emission time.
- `requestId` – optional trace identifier echoed from initiating REST call when applicable.
- `scope` – optional string describing audience (e.g., `user:<fid>`, `team:<id>`); omit for broadcast events.
- `retry` – server recommended reconnection delay in milliseconds (mirrors SSE `retry:` directive).

### Event Examples
- `queue:update`
```json
{
  "id": "evt_20250916T120001Z_q1",
  "type": "queue:update",
  "payload": { "jobId": "job_789", "status": "publishing", "updatedAt": "2025-09-16T12:00:01Z" },
  "ts": "2025-09-16T12:00:01.234Z",
  "requestId": "req_publish_456"
}
```
- `calendar:sync`
```json
{
  "id": "evt_20250916T120100Z_cal",
  "type": "calendar:sync",
  "payload": { "changes": [{ "id": "job_123", "from": "2025-09-17T14:00:00Z", "to": "2025-09-17T15:00:00Z" }] },
  "ts": "2025-09-16T12:01:00.000Z",
  "scope": "user:fid_999"
}
```
- `ticker:availability`
```json
{
  "id": "evt_20250916T120200Z_tick",
  "type": "ticker:availability",
  "payload": { "ticker": "CAST", "available": false, "alternatives": ["CASTX", "CASTHQ"] },
  "ts": "2025-09-16T12:02:00.500Z"
}
```
- `template:render-progress`
```json
{
  "id": "evt_20250916T120210Z_tpl",
  "type": "template:render-progress",
  "payload": { "templateId": "tpl_42", "jobId": "render_abc", "progress": 65 },
  "ts": "2025-09-16T12:02:10.100Z",
  "requestId": "req_render_abc"
}
```
- `collab:session`
```json
{
  "id": "evt_20250916T120230Z_collab",
  "type": "collab:session",
  "payload": { "sessionId": "sess_77", "cursor": { "user": "fid_321", "x": 120, "y": 340 }, "revision": 12 },
  "ts": "2025-09-16T12:02:30.000Z",
  "scope": "session:sess_77"
}
```

### Client-to-Server Protocol (WebSocket)
- **Subscribe:** Clients send
```json
{ "action": "subscribe", "channels": ["queue:update"], "scope": { "type": "user", "id": "fid_123" }, "requestId": "req_sub_1" }
```
  - `scope` defaults to the caller (`user:<fid>`) when omitted. Alternate scopes (`team:<id>`, `workspace:<id>`) require matching bearer-token permissions; invalid or unauthorized scopes yield an error frame.
  - Maximum 5 active channels per connection; additional requests return `error` frames with `code: "FORBIDDEN_CHANNEL"`.
  - Subscription mutations are rate limited (same limits as other realtime actions) and must be replayed after reconnects.
- **Unsubscribe:**
```json
{ "action": "unsubscribe", "channels": ["queue:update"], "requestId": "req_unsub_1" }
```
- **ACK Frames:** Emitted after successful subscribe/unsubscribe using the realtime envelope:
```json
{
  "type": "ack",
  "payload": { "subscriptions": ["queue:update"], "scope": "user:fid_123" },
  "ts": "2025-09-16T12:00:02.000Z",
  "requestId": "req_sub_1"
}
```
- **Unsubscribe ACK Example:**
```json
{
  "type": "ack",
  "payload": { "subscriptions": [], "scope": "user:fid_123" },
  "ts": "2025-09-16T12:05:00.000Z",
  "requestId": "req_unsub_1"
}
```
- **Error Frames:** Use the same envelope with `type: "error"` and surface validation issues without modifying subscriptions:
```json
{
  "type": "error",
  "payload": { "code": "INVALID_SCOPE", "message": "Scope team:999 is not allowed", "metadata": { "requestedScope": "team:999" } },
  "ts": "2025-09-16T12:00:02.100Z",
  "requestId": "req_sub_2"
}
```
- Supported error codes: `INVALID_SCOPE`, `FORBIDDEN_CHANNEL`, `INVALID_CHANNEL`. All events are authorized server-side for the effective scope; data for other users/teams is never emitted.

### SSE Subscription Semantics
- Subscriptions are declared in the request URL, e.g. `GET /api/realtime/sse?channels=queue:update,calendar:sync&scope=user:fid_123` (duplicates removed, URL-encode values as needed).
- On connection, the server emits an ACK event using the realtime envelope:
```http
event: message
data: {"type":"ack","payload":{"subscriptions":["queue:update","calendar:sync"],"scope":"user:fid_123"},"ts":"2025-09-16T12:00:02.000Z","requestId":"req_sse_init"}
```
- Changing channels or scope requires closing the stream and reconnecting with new query parameters; there is no in-band unsubscribe for SSE.
- Unauthorized scope requests respond `403 FORBIDDEN_REALTIME` and no events are streamed.
- All events are filtered server-side to the declared scope before emission, preventing cross-user or cross-team leakage.

### SSE Reconnection & Replay
- SSE responses include `id:` and `retry:` directives mirroring the JSON envelope. Default `retry` is `1000` ms; the server may increase this on transient failures.
- Clients resuming a stream MUST send `Last-Event-ID` with the most recent event ID. The backend replays up to 2 minutes (or 1,000 events) of history per channel to cover brief disconnects.
- Ordering is guaranteed per channel stream (events are emitted and replayed in monotonically increasing `ts` + sequence order). Cross-channel ordering is best-effort.
- Recommended backoff: 1 s → 2 s → 5 s → 10 s capped at 30 s; drop back to 1 s after a stable connection for 1 minute.
- Example reconnection request:
  - `GET /api/realtime/sse`
  - Headers: `Authorization: Bearer <token>`, `Last-Event-ID: evt_20250916T120100Z_cal`
- If the replay window is exceeded the server responds `409 REPLAY_WINDOW_EXPIRED` prompting a full resync via REST endpoints followed by stream resume.

### Channels & Events
- `queue:update` – Emitted when scheduled items change status (`pending`, `publishing`, `posted`, `failed`, `partial`). Latency target <100 ms from backend status change.
- `calendar:sync` – Broadcasted after drag-drop/reschedule, bulk scheduling, or auto-slot recommendation acceptance. Includes diff payload for optimistic UI reconciliation.
- `ticker:availability` – Streams live ticker availability results while user types; backoff to polling if rate limit hit.
- `template:render-progress` – Emits render start/progress/done states for Template Studio previews. Preview completion target <300 ms; backoff to cached response on timeout.
- `collab:session` – Handles collaborative editing (Template Studio, drafts) with events for cursor positions, selection, and version checkpoints. Requires `sessionId` negotiated via REST create endpoints.

## Shared Schema Definitions
### DraftRef
```json
{
  "id": "d_123",
  "mode": "cast",
  "title": "Launch teaser",
  "content": "...",
  "templateId": "t_9",
  "status": "pending_draft",
  "updatedAt": "2025-09-16T12:00:00Z",
  "revision": 7
}
```
- `id` – string prefixed with `d_`; immutable identifier.
- `mode` – enum `cast | coin`.
- `title` – optional string ≤ 140 chars; omit when draft focuses on media.
- `content` – optional string ≤ 2048 chars.
- `templateId` – optional string referencing Template Studio IDs.
- `status` – `pending_draft` (see Status & Error Taxonomy).
- `updatedAt` – ISO UTC; used for pagination ordering.
- `revision` – integer ≥ 1; incremented per successful save.

### Badge
```json
{
  "id": "badge_streak_10",
  "label": "10 Day Streak",
  "description": "Posted for 10 consecutive days",
  "awardedAt": "2025-09-10T08:00:00Z"
}
```
- `id` – slug string; stable across locales.
- `label` – display name ≤ 40 chars.
- `description` – optional, ≤ 140 chars.
- `awardedAt` – ISO UTC timestamp.

### Collision
```json
{
  "blockingId": "job_123",
  "conflictingId": "job_456",
  "startsAt": "2025-09-18T14:00:00Z",
  "endsAt": "2025-09-18T14:30:00Z",
  "channel": "cast"
}
```
- Represents overlapping scheduled items.
- `channel` – value from Calendar channel enumeration (see Calendar APIs below).
- `startsAt`/`endsAt` – ISO UTC; `endsAt` must be > `startsAt`.

### AutoSlot
```json
{
  "slotId": "auto_20250918T1500Z",
  "scheduledFor": "2025-09-18T15:00:00Z",
  "confidence": 0.82,
  "reason": "High engagement window",
  "channel": "cast"
}
```
- Suggested time windows returned by Auto Slot services.
- `confidence` – float between 0 and 1.
- `reason` – brief explanation ≤ 120 chars.

### HeatmapCell
```json
{
  "hour": 15,
  "weekday": 4,
  "score": 0.67,
  "sampleSize": 27
}
```
- `hour` – integer 0–23.
- `weekday` – integer 0 (Sunday) – 6 (Saturday).
- `score` – normalized engagement value 0–1.
- `sampleSize` – non-negative integer for data weighting.

### ChallengeProgress
```json
{
  "challengeId": "chal_42",
  "title": "September Cast Sprint",
  "progress": 3,
  "target": 5,
  "status": "in_progress",
  "nextRewardAt": "2025-09-20T00:00:00Z"
}
```
- `progress` – integer ≥ 0.
- `target` – integer ≥ 1.
- `status` – enum `not_started | in_progress | completed`.
- `nextRewardAt` – optional ISO timestamp for milestone notifications.

### RevenueSummary
```json
{
  "totalUsd": "1520.45",
  "period": "2025-09-01/2025-09-15",
  "breakdown": [
    { "source": "coins", "usd": "900.00" },
    { "source": "tips", "usd": "620.45" }
  ]
}
```
- `totalUsd` – decimal string with two fractional digits.
- `period` – ISO interval `YYYY-MM-DD/YYYY-MM-DD`.
- `breakdown` – array of `{ source: string, usd: string }`; `usd` uses decimal string to avoid float drift.

## Template Studio API (Expanded)
### GET /api/templates
- Parameters: `feature`, `limit` (default 20, max 100), `cursor`, `styleId`, `modifiedAfter`, `search`.
- Response includes `accessibilityScore` (0–100), `lastRenderedAt` timestamps, and `nextCursor` for pagination.
- **Status Codes:** `200 OK`, `400 INVALID_CURSOR`, `401 Unauthorized`, `429 RATE_LIMITED`.
- **Success Example:**
```json
{
  "items": [
    {
      "id": "tpl_42",
      "name": "Launch Announce",
      "feature": "coins",
      "accessibilityScore": 92,
      "lastRenderedAt": "2025-09-15T18:30:00Z"
    }
  ],
  "nextCursor": "eyJpZCI6InRwbF80MiIsInRzIjoiMjAyNS0wOS0xNVQxODozMDowMFoifQ=="
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "INVALID_CURSOR",
    "message": "Cursor could not be decoded",
    "metadata": { "cursor": "bad" }
  }
}
```

### POST /api/templates
- Body now accepts `theme` (color tokens), `fontStack`, `watermark`, `layoutPreset`, `backgroundStyle`, `contrastOverride`.
- Server validates WCAG 2.1 AA contrast; returns `warnings` array for detections.
- **Status Codes:** `201 Created`, `400 VALIDATION_ERROR`, `401 Unauthorized`, `409 TEMPLATE_NAME_CONFLICT`.
- **Success Example:**
```json
{
  "id": "tpl_99",
  "name": "High Contrast CTA",
  "theme": { "primary": "#2F4BFF" },
  "warnings": []
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Contrast ratio fails WCAG AA",
    "metadata": { "ratio": 3.5, "minimum": 4.5 }
  }
}
```

### POST /api/templates/render
- Body supports either `templateId` or inline `config`. Optional `stream=true` to receive progress events over WebSocket.
- Performance targets: preview <300 ms, final export <1 s. Cache renders by `{ templateId, versionId, styleId, contentHash }` with 15 minute TTL.
- Cache invalidation triggers: publishing a new template version, editing associated style/theme tokens, or mutating inline config inputs. Workers purge matching cache keys asynchronously via `templateId` + `versionId` fan-out.
- Response: `{ renderUrl, width, height, durationMs, cacheKey }` where `cacheKey` encodes `templateId`, `versionId` (or `inline`), `styleId`, and a short hash of the payload.
- Example response:
```json
{
  "renderUrl": "https://cdn.example/render/tpl_42/v5/style_modern/hash_abc123.png",
  "width": 1080,
  "height": 1350,
  "durationMs": 240,
  "cacheKey": "tpl_42:v5:style_modern:abc123"
}
```
- **Status Codes:** `200 OK`, `400 VALIDATION_ERROR`, `401 Unauthorized`, `429 RENDER_RATE_LIMIT`.
- **Error Example:**
```json
{
  "error": {
    "code": "RENDER_RATE_LIMIT",
    "message": "Render limit exceeded, retry later",
    "retryAfter": "2025-09-16T12:05:00Z",
    "metadata": { "templateId": "tpl_42" }
  }
}
```

### POST /api/templates/render/async
- Queue long-running exports; returns `jobId`, progress provided through `template:render-progress` channel.
- **Status Codes:** `202 Accepted`, `400 VALIDATION_ERROR`, `401 Unauthorized`, `409 RENDER_JOB_EXISTS`.
- **Success Example:**
```json
{
  "jobId": "render_job_123",
  "status": "queued",
  "estimateSeconds": 45
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "RENDER_JOB_EXISTS",
    "message": "An identical render job is already running",
    "metadata": { "jobId": "render_job_123" }
  }
}
```

### PUT /api/templates/:id/version
- Body: `{ action: "publish" | "rollback", versionId }`.
- Supports version history with metadata referencing collaborator, timestamp, diff summary.
- **Status Codes:** `200 OK`, `400 VALIDATION_ERROR`, `401 Unauthorized`, `404 TEMPLATE_VERSION_NOT_FOUND`, `409 TEMPLATE_LOCKED`.
- **Success Example:**
```json
{
  "id": "tpl_42",
  "versionId": "v6",
  "status": "published",
  "publishedAt": "2025-09-16T11:55:00Z"
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "TEMPLATE_LOCKED",
    "message": "Template is locked because it is in use",
    "metadata": { "id": "tpl_42" }
  }
}
```

### POST /api/templates/accessibility
- Validates template configuration for typography size, contrast, motion; response includes remediation suggestions.
- **Status Codes:** `200 OK`, `400 VALIDATION_ERROR`, `401 Unauthorized`.
- **Success Example:**
```json
{
  "score": 98,
  "issues": [],
  "warnings": ["Consider increasing line height"]
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Template config missing heading styles",
    "metadata": { "field": "heading" }
  }
}
```

### Tweet-Style Card Template (Planned)
- **Status:** Pending implementation; captured here for alignment across product, design, and engineering teams.
- **Template Definition:** Introduce a canonical `tweet_card` template in Template Studio with slots for `profileImage`, `displayName`, `handle`, `timestamp`, and `text`. The template ships with Neynar-styled defaults but is fully editable via standard layer controls.
- **Style Tokens:** Expose palette tokens (primary/accent/background), typography stacks, and avatar masks (circle, rounded, square) as user-editable metadata on the template. Persist overrides alongside drafts so autosave and scheduling flows retain selections.
- **Text-Only Render Path:** When a user submits a text-only Zora post, the compose flow will call `POST /api/templates/render` with the tweet-card template plus runtime data, then attach the rendered image to the Zora payload. Render failures fall back to plain-text posting with UI warnings.
- **Lightweight Customization UI:** Add a focused customization panel (color picker, font dropdown, avatar shape selector, background variants) that sits above the full image editor, allowing quick tweaks without launching the advanced editor. Advanced editing remains available on demand.
- **Caching & Versioning:** Cache rendered previews keyed by template version + token hash. Publishing a new template version or changing token values must invalidate cached previews so subsequent renders pick up the latest styling. Monitor render latency (target <300 ms) and surface cache hits in observability dashboards.

## Image Editor API
### POST /api/images/edit-session
- **Body:** `{ "templateId"?: string, "mediaCid": string }`.
- **Behavior:** Issues short lived edit session token, preloads template overlays, and associates `collabSessionId` for WebSocket collaboration.
- **TTL & Concurrency:** Sessions expire after 10 minutes of inactivity; each user may hold up to 3 concurrent active sessions. Creating a fourth session returns `429 TOO_MANY_EDIT_SESSIONS` with metadata listing active IDs.
- **Authorization:** Session ownership is bound to the authenticated user; collaborators join via explicitly shared `collabSessionId`. Attempting to mutate a session created by another user returns `403 EDIT_SESSION_FORBIDDEN`.
- **Responses:** `201` with `{ "sessionId": string, "expiresAt": ISO }`, `401` when unauthenticated, `403` for forbidden access, `429` when exceeding concurrency.
- **Success Example:**
```json
{
  "sessionId": "sess_abc123",
  "expiresAt": "2025-09-16T12:10:00Z"
}
```
- **Example Error:**
```json
{
  "error": {
    "code": "TOO_MANY_EDIT_SESSIONS",
    "message": "Maximum concurrent edit sessions reached",
    "metadata": { "activeSessionIds": ["sess_a", "sess_b", "sess_c"] }
  }
}
```

### POST /api/images/save-edit
- **Body:** `{ "sessionId"?: string, "dataUrl": string, "format": "png" | "jpeg", "quality"?: number }`.
- **Behavior:** Validates optional collaborative session when `sessionId` is provided (must match an active edit session tied to the caller). When omitted, processes a standalone save scoped to the authenticated user, enforcing media limits before uploading to Pinata and recording provenance metadata.
- **Responses:** `200` with `{ "cid": string, "url": string, "size": number, "sessionValidated": boolean }`, `410 Gone` if a referenced session expired, `401` if the session belongs to another user.
- **Success Example:**
```json
{
  "cid": "bafy...",
  "url": "https://ipfs.neynar.xyz/ipfs/bafy...",
  "size": 512000,
  "sessionValidated": true
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "EDIT_SESSION_EXPIRED",
    "message": "Edit session has expired, create a new session",
    "metadata": { "sessionId": "sess_abc123" }
  }
}
```

### GET /api/images/templates
- **Purpose:** Provide sticker packs, fonts, overlays for editor.
- **Response:** `{ "stickers": [], "fonts": [], "overlays": [] }` with CDN URLs and licensing metadata.
- **Caching:** Served with `Cache-Control: public, max-age=86400`, `ETag` for conditional requests, and asset versioning via `?v=<hash>` query strings to coordinate CDN invalidation.
- **Status Codes:** `200 OK`, `401 Unauthorized`.
- **Success Example:**
```json
{
  "stickers": [{ "id": "sticker_1", "url": "https://cdn.neynar.com/stickers/1.png" }],
  "fonts": [{ "id": "font_display", "url": "https://cdn.neynar.com/fonts/display.woff2" }],
  "overlays": []
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Valid token required"
  }
}
```

### POST /api/images/edit-session/extend
- **Body:** `{ "sessionId": "sess_123" }`.
- **Behavior:** Extends the TTL of an existing session by 10 minutes when the owner issues keep-alive pings; may be called at most once every 2 minutes per session. Collaborators cannot extend sessions they do not own.
- **Responses:** `200` with `{ "sessionId": "sess_123", "expiresAt": "2025-09-16T12:15:00Z" }`, `401` when unauthenticated, `403 EDIT_SESSION_FORBIDDEN` when non-owners attempt extension, `410 EDIT_SESSION_EXPIRED` when the session no longer exists.
- **Revocation:** Owners may terminate sessions by omitting extensions; expiration triggers WebSocket `collab:session` `ended` payloads and subsequent save attempts return `410` with `metadata.sessionExpired=true`.
- **Success Example:**
```json
{
  "sessionId": "sess_123",
  "expiresAt": "2025-09-16T12:15:00Z"
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "EDIT_SESSION_FORBIDDEN",
    "message": "Only the owner may extend this session",
    "metadata": { "sessionId": "sess_123" }
  }
}
```

## Queue & Calendar APIs (Enhanced)
### GET /api/queue/stats
- Response: `{ "counts": { "pending": number, "publishing": number, "failed": number, "posted": number, "partial": number }, "nextRunAt": ISO, "workerHealth": "ok" | "degraded", "revenueSummary": RevenueSummary, "streakImpact": object, "challengeProgress": ChallengeProgress }`.
- Maps `counts` to UI labels defined in the Status & Error Taxonomy table (e.g., UI "Success" ↔ backend `posted`, UI "Partial Success" ↔ backend `partial`).
- **Status Codes:** `200 OK`, `401 Unauthorized`.
- **Success Example:**
```json
{
  "counts": { "pending": 4, "publishing": 1, "failed": 0, "posted": 12, "partial": 1 },
  "nextRunAt": "2025-09-16T12:10:00Z",
  "workerHealth": "ok",
  "revenueSummary": {
    "totalUsd": "1520.45",
    "period": "2025-09-01/2025-09-15",
    "breakdown": [{ "source": "coins", "usd": "900.00" }]
  },
  "challengeProgress": {
    "challengeId": "chal_42",
    "title": "September Cast Sprint",
    "progress": 3,
    "target": 5,
    "status": "in_progress"
  }
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Valid token required"
  }
}
```

### GET /api/queue/calendar
- **Status:** Deprecated. Remains available until **2025-10-31** with response parity to `GET /api/calendar/view` limited to week range data.
- **Sunset Header:** Responses include `Sunset: 2025-10-31` and `Link: </api/calendar/view>; rel="successor-version"` per RFC 8594.
- **Alias:** Requests automatically 307-redirect to `/api/calendar/view?legacy=true` starting **2025-10-01**, preserving query string and requiring clients to follow redirects with auth headers.
- **Migration Notes:** Consumers should transition to `GET /api/calendar/view` immediately to access heatmaps, drag handles, and channel filters. Backend maintains schema compatibility (no field removals) during the overlap window.
- **Status Codes:** `200 OK` (until 2025-09-30), `307 Temporary Redirect` (from 2025-10-01), `410 Gone` (after 2025-10-31), `401 Unauthorized`.
- **Success Example (pre-redirect):**
```json
{
  "items": [],
  "nextCursor": null
}
```
- **Error Example (post-sunset):**
```json
{
  "error": {
    "code": "ENDPOINT_GONE",
    "message": "GET /api/queue/calendar has sunset",
    "metadata": { "sunset": "2025-10-31", "replacement": "/api/calendar/view" }
  }
}
```

### GET /api/calendar/view
- Query: `range=week|month`, `start`, `channels[]`, `includeHeatmap=true|false`.
- Response includes `heatmap` (array of 24×7 engagement intensity), `collisions`, `autoSlots` suggestions, and `dragHandles` metadata for UI.
- **Status Codes:** `200 OK`, `400 INVALID_CHANNEL_FILTER`, `401 Unauthorized`, `400 INVALID_RANGE`.
- **Success Example:**
```json
{
  "items": [{ "id": "job_1", "channel": "cast", "scheduledFor": "2025-09-17T14:00:00Z" }],
  "collisions": [],
  "autoSlots": [],
  "heatmap": [{ "hour": 14, "weekday": 3, "score": 0.7, "sampleSize": 12 }],
  "dragHandles": []
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "INVALID_RANGE",
    "message": "Range must be week or month",
    "metadata": { "range": "day" }
  }
}
```

### POST /api/calendar/drag-reschedule
- Body: `{ itemId, from, to, channel, force?: boolean }`.
- Validates collisions, DST boundaries, sponsorship windows; on success triggers `calendar:sync` event.
- Responds with updated item payload and `adjustedTo` if server modified requested time.
- **Status Codes:** `200 OK`, `400 VALIDATION_ERROR`, `401 Unauthorized`, `409 SCHEDULE_CONFLICT`.
- **Success Example:**
```json
{
  "id": "job_123",
  "scheduledFor": "2025-09-18T15:00:00Z",
  "adjustedTo": null
}
```
- `409 Conflict` response example:
```json
{
  "error": {
    "code": "SCHEDULE_CONFLICT",
    "message": "Slot overlaps with another scheduled post",
    "conflicts": [{ "id": "job_123", "scheduledFor": "2025-09-18T14:00:00Z" }],
    "suggestedSlots": ["2025-09-18T15:00:00Z", "2025-09-18T16:30:00Z"]
  }
}
```

### GET /api/calendar/auto-slots
- Returns recommended slots based on historical performance, follower activity, and open queue capacity. Optional `lookbackDays` parameter.
- **Status Codes:** `200 OK`, `401 Unauthorized`.
- **Success Example:**
```json
{
  "autoSlots": [
    { "slotId": "auto_20250918T1500Z", "scheduledFor": "2025-09-18T15:00:00Z", "confidence": 0.82, "reason": "High engagement window", "channel": "cast" }
  ]
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Valid token required"
  }
}
```

### POST /api/calendar/bulk-schedule
- Body: `{ drafts: DraftRef[], scheduleStrategy: "stagger" | "cluster" | "custom", anchorTime, timezone }`.
- Enqueues multiple items, surfaces partial failures with `errors[]` and `retryAfter` guidance.
- **Status Codes:** `202 Accepted`, `400 VALIDATION_ERROR`, `401 Unauthorized`, `207 Multi-Status` for partial successes.
- **Success Example:**
```json
{
  "jobs": [
    { "draftId": "d_123", "jobId": "job_999", "status": "scheduled" }
  ],
  "errors": []
}
```
- **Error Example (partial):**
```json
{
  "status": 207,
  "jobs": [
    { "draftId": "d_123", "jobId": "job_999", "status": "scheduled" }
  ],
  "errors": [
    {
      "draftId": "d_456",
      "error": {
        "code": "SCHEDULE_CONFLICT",
        "message": "Draft conflicts with another post",
        "metadata": { "conflictingJobId": "job_888" }
      }
    }
  ]
}
```

### GET /api/calendar/performance-heatmap
- Standalone endpoint returning aggregated engagement metrics for visualization; includes caching headers (`Cache-Control: private, max-age=300`).
- **Status Codes:** `200 OK`, `401 Unauthorized`.
- **Success Example:**
```json
{
  "heatmap": [
    { "hour": 9, "weekday": 1, "score": 0.64, "sampleSize": 18 }
  ]
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Valid token required"
  }
}
```

### Calendar Response Schemas
- `Collision` objects follow the shared definition above and appear under `collisions[]` for both `/api/calendar/view` and drag conflict errors.
- `AutoSlot`
```json
{
  "slotId": "auto_20250918T1500Z",
  "scheduledFor": "2025-09-18T15:00:00Z",
  "confidence": 0.82,
  "reason": "High engagement window",
  "channel": "cast"
}
```
- `DragHandles`
```json
{
  "itemId": "job_789",
  "start": "2025-11-03T01:30:00-04:00",
  "end": "2025-11-03T02:30:00-05:00",
  "timezone": "America/New_York",
  "isLocked": false,
  "supportsCrossDay": true
}
```
  - `start`/`end` preserve original timezone offsets to highlight DST transitions.
  - `isLocked` indicates items that cannot be resized (e.g., sponsored casts).
  - `supportsCrossDay` flags items spanning midnight so UI can draw handles correctly.

- Sample `/api/calendar/view` response excerpt covering DST shift:
```json
{
  "items": [
    {
      "id": "job_789",
      "channel": "cast",
      "scheduledFor": "2025-11-03T06:30:00Z",
      "durationMinutes": 60,
      "timezone": "America/New_York"
    }
  ],
  "collisions": [
    {
      "blockingId": "job_789",
      "conflictingId": "job_790",
      "startsAt": "2025-11-03T06:30:00Z",
      "endsAt": "2025-11-03T07:00:00Z",
      "channel": "cast"
    }
  ],
  "autoSlots": [
    {
      "slotId": "auto_20251103T0800Z",
      "scheduledFor": "2025-11-03T08:00:00Z",
      "confidence": 0.75,
      "reason": "Post-DST engagement bump",
      "channel": "cast"
    }
  ],
  "dragHandles": [
    {
      "itemId": "job_789",
      "start": "2025-11-03T01:30:00-04:00",
      "end": "2025-11-03T02:30:00-05:00",
      "timezone": "America/New_York",
      "isLocked": false,
      "supportsCrossDay": true
    }
  ]
}
```

### Calendar Channel Filters
- `channels[]` accepts the following values:
  - `cast` – Farcaster casts scheduled through the compose tray.
  - `coin` – Zora coin drops or earnings announcements.
  - `reminder` – In-app or email reminders generated from scheduling workflows.
- Requests omitting `channels[]` default to `cast` and `coin`. Supplying an empty array yields `400 INVALID_CHANNEL_FILTER`.
- Invalid channel example:
```json
{
  "error": {
    "code": "UNSUPPORTED_CHANNEL",
    "message": "Channel value 'sms' is not supported",
    "metadata": { "channel": "sms", "allowed": ["cast", "coin", "reminder"] }
  }
}
```

## Scheduling Timezone Semantics
- All persisted timestamps are stored in UTC. Clients may submit ISO-8601 timestamps with offsets; the server normalizes to UTC and returns canonical UTC values in responses.
- Calendar query parameters (start/end) are interpreted as UTC unless a `tz` query parameter (IANA timezone string) is provided. When supplied, the server converts results to that timezone for presentation while maintaining UTC storage.
- Scheduling endpoints validate daylight-saving transitions and include `timezoneWarnings` when user-provided offsets do not align with profile settings. See Journey 2 and Journey 8 edge cases for UI handling.
## Ticker Management APIs
### POST /api/tickers/check-availability
- Body: `{ ticker: string }`; response `{ available: boolean, reason?, alternatives?: string[] }`.
- Must respond <200 ms; reuses cached results for 60 s.
- **Status Codes:** `200 OK`, `400 INVALID_TICKER_FORMAT`, `401 Unauthorized`, `422 TICKER_RESERVED`, `422 TICKER_HOMOGLYPH`.
- **Success Example:**
```json
{
  "available": true,
  "reason": null,
  "alternatives": []
}
```

### POST /api/tickers/reserve
- Body: `{ ticker, coinType, ttlSeconds? }`; default TTL 600 s. Stores reservation in `ticker_reservations` table.
- **Status Codes:** `201 Created`, `400 INVALID_TICKER_FORMAT`, `401 Unauthorized`, `409 TICKER_ALREADY_RESERVED`, `422 TICKER_RESERVED`.
- **Success Example:**
```json
{
  "reservationId": "res_123",
  "ticker": "CASTX",
  "expiresAt": "2025-09-16T12:10:00Z"
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "TICKER_ALREADY_RESERVED",
    "message": "Ticker is already reserved by another user",
    "metadata": { "reservationId": "res_987", "expiresAt": "2025-09-16T12:05:00Z" }
  }
}
```

### GET /api/tickers/suggestions
- Query: `baseTicker`, `count` (max 10). Uses heuristics (prefix, suffix, numeric) while avoiding existing reservations and minted coins.
- **Status Codes:** `200 OK`, `401 Unauthorized`.
- **Success Example:**
```json
{
  "suggestions": ["CASTX", "CASTHQ", "CASTLAB"]
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Valid token required"
  }
}
```

### PUT /api/tickers/extend-reservation/:id
- Extends TTL while user edits; maximum cumulative hold 30 minutes.
- **Status Codes:** `200 OK`, `401 Unauthorized`, `403 RESERVATION_FORBIDDEN`, `404 RESERVATION_NOT_FOUND`, `409 RESERVATION_MAX_EXTENDED`.
- **Success Example:**
```json
{
  "reservationId": "res_123",
  "expiresAt": "2025-09-16T12:15:00Z",
  "extendedCount": 2
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "RESERVATION_MAX_EXTENDED",
    "message": "Reservation cannot be extended beyond 30 minutes",
    "metadata": { "reservationId": "res_123" }
  }
}
```

### Ticker Validation Rules
- **Charset:** Uppercase alphanumerics plus underscore (`^[A-Z0-9_]+$`). Requests that include lowercase or unicode glyphs are normalized to uppercase ASCII; characters outside the set trigger `400 INVALID_TICKER_FORMAT`.
- **Length:** Minimum 3, maximum 10 characters after normalization.
- **Reserved Words:** Reject `NEYNAR`, `ADMIN`, `SYSTEM`, `CAST`, and any ticker already minted or permanently blocked; respond with `422 TICKER_RESERVED`.
- **Homoglyph Handling:** Confusable Unicode characters (e.g., Cyrillic `А`) are rejected with `422 TICKER_HOMOGLYPH` to prevent spoofing.
- **Examples:**
```json
// 400 Invalid format
{
  "error": {
    "code": "INVALID_TICKER_FORMAT",
    "message": "Ticker must match ^[A-Z0-9_]+$",
    "metadata": { "ticker": "cast!" }
  }
}

// 422 Reserved
{
  "error": {
    "code": "TICKER_RESERVED",
    "message": "Ticker is reserved and cannot be used",
    "metadata": { "ticker": "NEYNAR" }
  }
}

// 422 Homoglyph
{
  "error": {
    "code": "TICKER_HOMOGLYPH",
    "message": "Ticker contains confusable characters",
    "metadata": { "ticker": "САST" }
  }
}
```

## Social Proof & Growth APIs
### GET /api/social/friends-using-app
- Returns list of Farcaster friends already using the mini-app, with metadata: `{ fid, username, avatarUrl, lastActiveAt, mutualChallenges }`.
- Integrates Neynar following graph; caches results in `social_connections` table with 10 minute TTL.
- **Status Codes:** `200 OK`, `401 Unauthorized`, `429 RATE_LIMITED`.
- **Success Example:**
```json
{
  "friends": [
    { "fid": 123, "username": "alice", "avatarUrl": "https://...", "lastActiveAt": "2025-09-16T11:30:00Z", "mutualChallenges": 2 }
  ]
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many social lookups, retry later",
    "retryAfter": "2025-09-16T12:05:00Z"
  }
}
```

### GET /api/streaks/current
- Response: `{ currentStreakDays, longestStreak, nextRewardAt, badges: Badge[] }`.
- Consumes data from `streaks` table updated by worker after successful publish events.
- **Status Codes:** `200 OK`, `401 Unauthorized`.
- **Success Example:**
```json
{
  "currentStreakDays": 5,
  "longestStreak": 12,
  "nextRewardAt": "2025-09-17T00:00:00Z",
  "badges": [
    { "id": "badge_streak_5", "label": "5 Day Streak", "description": "Shared for 5 days", "awardedAt": "2025-09-15T08:00:00Z" }
  ]
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Valid token required"
  }
}
```

### POST /api/challenges/join
- Body: `{ challengeId }`; ensures challenge capacity, registers user in `challenges_participants` join table, returns progress template.
- **Status Codes:** `200 OK`, `401 Unauthorized`, `403 CHALLENGE_FORBIDDEN`, `409 CHALLENGE_FULL`.
- **Success Example:**
```json
{
  "challengeId": "chal_42",
  "status": "joined",
  "progress": {
    "progress": 1,
    "target": 5,
    "status": "in_progress"
  }
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "CHALLENGE_FULL",
    "message": "Challenge is at capacity",
    "metadata": { "challengeId": "chal_42" }
  }
}
```

### GET /api/reminders/settings
- Returns reminder configuration (`email`, `push`, `in-app`, `timezone`, `prePublishLead`, `postSuccessNudge`). Supports future `PATCH` updates.
- **Status Codes:** `200 OK`, `401 Unauthorized`.
- **Success Example:**
```json
{
  "email": true,
  "push": true,
  "in-app": true,
  "timezone": "America/Los_Angeles",
  "prePublishLead": 15,
  "postSuccessNudge": true
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Valid token required"
  }
}
```

### GET /api/social/activity-feed
- Optional: paginated endpoint surfacing friend successes, challenge milestones, remix invites.
- **Status Codes:** `200 OK`, `400 INVALID_CURSOR`, `401 Unauthorized`.
- **Success Example:**
```json
{
  "items": [
    { "id": "act_1", "type": "challenge_completed", "ts": "2025-09-16T10:00:00Z" }
  ],
  "nextCursor": null
}
```
- **Error Example:**
```json
{
  "error": {
    "code": "INVALID_CURSOR",
    "message": "Cursor could not be decoded",
    "metadata": { "cursor": "bad" }
  }
}
```

## Cast, Draft & Image APIs (Carryover + Enhancements)
- Existing endpoints retained; augment responses with `streakImpact`, `challengeBadge`, and `tickerReservationId` where applicable.
- `POST /api/casts/create` should publish `queue:update` events immediately and include `optimisticQueueId` for UI reconciliation.
- `POST /api/images/edit-session` may include `collabSessionId` enabling shared edits via WebSocket.

### GET /api/casts/drafts
- **Purpose:** Powers the Journey 9 Drafts Management list and search UI; filters, pagination, and search chips must map directly to these parameters.
- **Query Parameters:**
  - `limit` – defaults to `20`, maximum `100`; follows identical pagination semantics as `GET /api/templates`.
  - `cursor` – opaque base64 cursor encoding the `updatedAt` and `id` of the last item from the previous page.
  - `mode` – optional filter of draft mode; one of `"cast"`, `"coin"`, or `"all"` (`all` returns both modes).
  - `templateId` – optional template association filter; omit to include drafts without a template.
  - `updatedBefore` / `updatedAfter` – ISO 8601 timestamps (UTC) bounding last-update window; combine with `limit` for time-sliced pagination.
  - `search` – prefix search applied to title or content fields for quick filtering.
- **Sorting & Pagination:** Default sort is `updatedAt DESC, id DESC` to guarantee stable ordering; the continuation cursor encodes both fields so pagination remains deterministic during concurrent edits.
- **Response:**
```json
{
  "items": [
    { "id": "d_123", "mode": "cast", "content": "...", "templateId": "t_9", "updatedAt": "2025-09-16T12:00:00Z", "status": "pending_draft", "revision": 7 }
  ],
  "nextCursor": "eyJ1cGRhdGVkQXQiOiIyMDI1LTA5LTE2VDEyOjAwOjAwWiIsImlkIjoiZF8xMjMifQ=="
}
```
- **Status Codes:** `200 OK`, `400 INVALID_CURSOR`, `401 Unauthorized`, `429 RATE_LIMITED`.
- **Error Cases:** Return `400 INVALID_CURSOR` when the supplied cursor cannot be decoded or refers to stale pagination state; include standard error envelope metadata.
- **Consumer Notes:** `/web/app/(dashboard)/drafts` and associated search components should hydrate from this endpoint, mirroring the Journey 9 Data & API contract described in `docs/user-journeys/journey-specifications.md` (Journey 9). Offline reconciliation continues to use `/api/sync/drafts` but must revalidate against this listing once a connection restores.

### POST /api/sync/drafts
- **Purpose:** Reconciles offline edits captured in IndexedDB/local storage with server state after connectivity is restored.
- **Request Body:**
```json
{
  "clientId": "device_abc",
  "drafts": [
    {
      "id": "d_123",
      "tempId": "temp_789",
      "revision": 7,
      "content": "...",
      "updatedAt": "2025-09-16T12:00:00Z",
      "mode": "cast"
    }
  ]
}
```
- **Conflict Strategy:** Server compares provided `revision` + `updatedAt` against canonical values. When mismatched, response includes `status: "conflict"` with both versions so clients can prompt resolution. Matching revisions apply updates atomically.
- **Response:**
```json
{
  "results": [
    {
      "tempId": "temp_789",
      "id": "d_123",
      "status": "updated",
      "serverRevision": 8,
      "serverUpdatedAt": "2025-09-16T12:05:00Z"
    }
  ],
  "conflicts": [
    {
      "id": "d_456",
      "clientRevision": 2,
      "serverRevision": 4,
      "clientPayload": { "content": "local draft" },
      "serverPayload": { "content": "remote draft" }
    }
  ]
}
```
- **Status Codes:** `200 OK`, `207 Multi-Status`, `400 VALIDATION_ERROR`, `401 Unauthorized`, `409 DRAFT_VERSION_CONFLICT`.
- **Error Example:**
```json
{
  "error": {
    "code": "DRAFT_VERSION_CONFLICT",
    "message": "Server revision is newer",
    "metadata": { "id": "d_456", "serverRevision": 4, "clientRevision": 2 }
  }
}
```

## Shadcn Component Integration Patterns
- **State Management:** Standardize on React Query with keys mirroring endpoint paths (e.g., `['queue','stats']`). WebSocket pushes call `queryClient.invalidateQueries` selectively.
- **Forms:** Use `react-hook-form` + shadcn `Form`, `FormField`, `Input`, `Textarea`, `Switch`. Server validation errors map to `FormMessage` via `fieldErrors` payload.
- **Real-Time UI:** Integrate WebSocket events with shadcn `Toast` for errors/success, `Progress` for render updates, and `Badge` for status chips.
- **Calendar UI:** Combine shadcn `Calendar`, `Popover`, `Command`, plus drag-drop via `@dnd-kit/core`. Real-time sync updates pivot to optimistic updates with rollback from `calendar:sync` payloads.
- **Mobile Patterns:** Use `Sheet` for scheduling and editor modals, ensuring 44 px touch targets and accessible focus management when real-time updates arrive.

## Performance & Caching Requirements
- Template preview render <300 ms; hard cap 1 s for final export with async fallback.
- Ticker availability <200 ms, cached per ticker for 60 s; reservations persisted immediately to avoid race conditions.
- Calendar drag-drop feedback <150 ms to UI, with optimistic update and server confirmation; server resolves collisions within 100 ms when possible.
- Social proof endpoints deliver within 150 ms after initial cache warm; background job refreshes caches every 10 minutes.
- Queue status pushes target <100 ms latency via WebSocket; fallback polling every 10 s when WebSocket unavailable.
- Enable CDN caching for template assets, heatmaps, and share images; include `ETag` headers for render responses.

## Error Handling & Offline Support
- Standard error envelope:
```json
{
  "error": {
    "code": "SOME_CODE",
    "message": "Human-readable detail",
    "retryAfter": "ISO timestamp",
    "metadata": {}
  }
}
```
- Offline Mode: Draft and template edits queue in IndexedDB; server exposes `/api/sync/drafts` for reconciliation once back online.
- Partial Success: If Farcaster succeeds but Zora coin fails, return `status: "partial"`, include `retryInstruction`, and fire `queue:update` with partial flag.
- Render Fallback: When preview render exceeds SLA, respond with `fallbackPreview: true` and deliver minimal text-only card.
- Timezone & DST: Server enforces timezone conversions and returns `timezoneWarnings` when user-supplied offset mismatches profile.

## Status & Error Taxonomy
| UI Label        | Backend `status` | Description                                | Primary `error.code` triggers             |
|-----------------|------------------|--------------------------------------------|-------------------------------------------|
| Draft           | `pending_draft`  | Draft saved but not scheduled              | `DRAFT_VERSION_CONFLICT`                  |
| Scheduled       | `pending`        | Queued for future publication              | `SCHEDULE_CONFLICT`                       |
| Sending         | `publishing`     | Actively publishing/minting                | `PUBLISH_IN_PROGRESS`                     |
| Success         | `posted`         | Completed successfully                     | —                                         |
| Failed          | `failed`         | Permanently failed after retries           | `CAST_PUBLISH_FAILED`, `COIN_CREATE_FAILED` |
| Partial Success | `partial`        | Cast succeeded, coin or side-effect failed | `PARTIAL_SUCCESS`                         |

- UI components should use this table to map statuses and display consistent messaging. Detailed error code descriptions accompany responses in the Error Handling section.

## Idempotency Guarantees
- All POST endpoints listed below accept an optional `Idempotency-Key` header. Keys are cached for 24 hours and must be unique per user per endpoint.
- `/api/casts/create`: repeated keys return the original job/cast response; collisions with different payloads yield `409 CAST_IDEMPOTENCY_CONFLICT`.
- `/api/templates`: idempotency covers template creation; duplicate keys re-surface the created template metadata.
- `/api/templates/render` and `/api/templates/render/async`: treat keys as render job deduplication within a 10-minute window.
- `/api/calendar/bulk-schedule`: ensures multi-item scheduling executes once; subsequent identical keys return the prior summary with `jobs[]` results.
- `/api/images/save-edit`: when provided, prevents duplicate uploads within 5 minutes by returning the prior `{ cid, url }` payload.
- Clients should persist keys per submission attempt and clear them after successful completion; server logs collisions for monitoring.

## Data Model Extensions
- **streaks** – `id`, `user_id`, `current_streak`, `longest_streak`, `last_posted_at`, `badges JSONB`.
- **challenges** – `id`, `title`, `theme`, `starts_at`, `ends_at`, `reward`, `capacity`, `rules JSONB`.
- **challenges_participants** – `id`, `challenge_id`, `user_id`, `progress`, `joined_at`, `completed_at`.
- **social_connections** – `id`, `user_id`, `friend_fid`, `relationship`, `last_synced_at`, `metadata JSONB`.
- **auto_queue_slots** – `id`, `user_id`, `weekday`, `time_utc`, `channel`, `priority`, `created_at`, `updated_at`.
- **ticker_reservations** – `id`, `ticker`, `user_id`, `coin_type`, `reserved_until`, `created_at`, `extended_count`.

## Security, Rate Limiting & Privacy
- Rate limits (default): REST write endpoints 60/min, reads 120/min; WebSocket subscriptions 1/min per channel per user, ticker availability 30/min.
- WebSocket heartbeat every 30 s; disconnect after two missed heartbeats.
- Transport security: WebSocket endpoints are available only over `wss://`; downgrade attempts receive `400 UPGRADE_REQUIRED`. SSE endpoints require HTTPS and honor the same bearer token header—cookies are ignored to avoid CSRF.
- CORS: Only `https://app.neynar.com` and registered preview domains may call REST or SSE endpoints via browsers. Preflight responses include `Access-Control-Allow-Origin` on the allowlist and `Access-Control-Allow-Headers: Authorization, Content-Type, Last-Event-ID`.
- CSRF: Session cookies are never accepted for state-changing endpoints; clients must send bearer tokens via Authorization header. When cookies are enabled for other reasons, `SameSite=strict` is enforced.
- Enforce scope-based permissions for template sharing (`owner`, `editor`, `viewer`).
- Social endpoints respect privacy (`friends-only`, `public`, `hidden`). Users can opt-out via `/api/reminders/settings` toggles.
- All real-time messages include `requestId` for tracing.
- Apply JWT audience/issuer checks and rotate signing keys regularly.

## Integration with Existing Services
- **Neynar:** Extend client for following graph (`getFriendsUsingApp`), streak detection, and share casting. Cache Neynar responses in Redis (TTL 600 s).
- **Zora:** Add portfolio analytics endpoints, ticker validation hooks, and partial success reconciliation flows.
- **Pinata:** Continue multi-path uploads; add signed URL endpoint for template assets and share images.
- **Worker Processes:** Workers consume queue, streak updates, challenge progression. Broadcast events through WebSocket channel manager after state transitions.

## Monitoring & Observability
- Metrics: latency histograms per endpoint, WebSocket message count, cache hit rate, render duration, ticker check times.
- Logs include `requestId`, `userId`, `channel`, `status`, `durationMs`, `errorCode`.
- Alerts: trigger on render SLA breaches, WebSocket error rates, ticker reservation contention, social cache failures.

## Reference Materials
- Primary UX, performance, and component requirements sourced from `docs/full_frontend_research_ux_design_plan_onchain_mini_app_final_merged_compose_v_3.md`.
- Keep this contract updated alongside frontend shadcn component implementations in `web/` and backend logic in `src/` to maintain parity between research intent and production behavior.



























