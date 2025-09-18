# Neynar Planner Fullstack Architecture Document

This document outlines the complete fullstack architecture for Neynar Planner, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

## Starter Template or Existing Project
Existing brownfield project — we are extending the prior Express + Neynar/Zora scheduler MVP in this repository.

## Change Log
| Date       | Version | Description                                         | Author   |
|------------|---------|-----------------------------------------------------|----------|
| 2025-09-17 | 2.0     | Re-baselined architecture to match PRD v5 scope     | Winston  |
| 2025-09-09 | 1.0     | Initial brownfield architecture for scheduler MVP   | Winston  |

## High Level Architecture

### Technical Summary
- Neynar Planner runs as a single Next.js (App Router) application under web/ deployed on Vercel using the Base mini app toolchain; all frontend and backend logic live side-by-side via route handlers, server actions, and edge functions.
- Base Minikit powers wallet connection, SIWN flows, and onchain transactions directly from the client, while server handlers coordinate Neynar, Zora, and Pinata integrations using shared TypeScript contracts.
- Prisma models (backed by Neon Postgres) persist drafts, templates, queues, streaks, challenges, analytics snapshots, and ticker reservations; Upstash Redis supports cache, pub/sub, and scheduled work coordination.
- Real-time delivery relies on Vercel-hosted socket.io handlers with SSE fallback, emitting the standardized envelopes defined in docs/technical-specifications/api-contracts.md.
- Scheduled jobs (template rendering, queue processing, streak updates) execute through Vercel Cron invoking serverless background functions that interact with Redis queues and Postgres state.
- Observability spans Vercel analytics, PostHog/Segment events, and Grafana dashboards sourced from Neon/Upstash metrics to enforce the PRD’s performance budgets (TTI <3s, render <1s, drag feedback <150ms).

### Platform and Infrastructure Choice
**Option 1 – Vercel + Base Minikit (Recommended)**
- Pros: Official Base mini app workflow, seamless Next.js deployment, built-in cron/jobs, edge network, minimal ops overhead.
- Cons: Long-running workers require cron or external queue service; regional choices limited to Vercel supported regions.

**Option 2 – Vercel + Supabase Edge Functions**
- Pros: Supabase offers Postgres, auth, storage, and scheduled functions closely integrated with Vercel.
- Cons: Adds a second control plane; still need to wire Base Minikit manually.

**Option 3 – Render Fullstack**
- Pros: Single platform for web + background workers, straightforward cron.
- Cons: Lacks Base mini app templates; less optimized for Next.js edge features.

**Platform:** Vercel (Next.js app + API route handlers) with Base Minikit tooling
**Key Services:** Vercel Edge Functions & Cron, Base Minikit SDK, Neon serverless Postgres, Upstash Redis, Pinata media storage, PostHog/Segment analytics
**Deployment Host and Regions:** Vercel (iad1 primary with global edge cache); Neon (us-east or eu-central aligned with primary traffic); Upstash Redis global replication

### Repository Structure
- Monorepo managed with npm workspaces + Turborepo; web/ is the primary application and hosts both UI and server logic.
- /web/app – App Router pages, route handlers (pp/api/*), server actions, success/share flows.
- /web/components – shadcn/ui primitives, feature components (compose, calendar, template studio).
- /web/lib – SDK clients (Neynar, Zora, Pinata, Base Minikit helpers), React Query hooks, Redis/Postgres clients.
- /packages/shared (planned) – Shared schema validators (Zod), analytics constants, TypeScript types consumed by client/server.
- /packages/workers (planned) – Isolated logic for template rendering and queue processing shared by cron jobs.
- Tests colocated with features plus root-level Playwright configuration for E2E.

### Component Overview
| Layer | Responsibility | Tech |
|-------|----------------|------|
| Frontend (web/app) | Compose tray, Template Studio, Calendar, Portfolio, Success flows | Next.js App Router, shadcn/ui, React Query, IndexedDB, Base Minikit |
| API Route Handlers | SIWN auth handshakes, template render queues, ticker checks, analytics ingestion | Next.js route handlers, Prisma, Zod, Redis client |
| Background Jobs | Template rendering, scheduling, streak/challenge processing, analytics batching | Vercel Cron-triggered route handlers / background functions, Redis queues |
| Data | Persistent state and cache | Neon Postgres (Prisma), Upstash Redis, Pinata (media) |
| Observability | Metrics, tracing, analytics | Vercel Analytics, PostHog/Segment, Grafana/Loki via Neon/Upstash exports |

### Data Flow Diagram
`mermaid
flowchart TD
    Client(Next.js Frontend) -->|fetch/POST| Routes(App API Handlers)
    Client -->|WebSocket/SSE| Realtime(Vercel Edge socket.io)
    Routes -->|Prisma| Postgres(Neon)
    Routes -->|Cache| Redis(Upstash)
    Routes -->|Queue jobs| CronJobs(Vercel Cron)
    CronJobs -->|Process| Workers(Background Functions)
    Workers -->|Update| Postgres
    Workers -->|Push events| Redis
    Redis -->|Fan-out updates| Realtime
    Routes -->|Upload| Pinata
`

### Deployment Topology
- Next.js app deploys on Vercel; route handlers and server actions run in the same project with Base Minikit wired via environment variables and the Base CLI.
- Vercel Cron schedules background jobs (template render worker, queue processor, analytics ETL) hitting designated /api/jobs/* endpoints.
- Neon Postgres accessible via connection pooling (Prisma Data Proxy or PgBouncer) from Vercel serverless/edge functions.
- Upstash Redis provides low-latency cache and pub/sub; connection secrets stored in Vercel environment.
- Pinata (or S3 mirror) handles media uploads; signed URLs managed by route handlers.
- CI (GitHub Actions) runs lint/type/test, Storybook, Prisma migrations, Lighthouse, and Playwright suites before promoting to Vercel.

### Environment Matrix
| Environment | Purpose | Differences |
|-------------|---------|-------------|
| Dev (local) | Individual iteration via 
pm run dev in web/; uses .env.local, SQLite fallback, mocked Redis where needed | Base Minikit dev keys, local wallet, hot reload |
| Staging | Integration QA on Vercel preview | Neon staging database, Upstash staging cache, Neynar/Zora sandbox credentials, feature flags for partial rollouts |
| Production | Live Neynar Planner mini app | Production Neon database, Upstash production Redis, Vercel cron schedule, Base mainnet keys, analytics dashboards and alerting |

### Third-Party Dependencies
- Base Minikit (wallet onboarding, transaction orchestration)
- Neynar API (SIWN, social graph, casting)
- Zora Coins SDK/services
- Pinata for media uploads (with optional S3 archival)
- Neon Postgres (primary data store)
- Upstash Redis (cache + pub/sub)
- PostHog/Segment (analytics pipeline)
- Vercel (host + cron + analytics)
