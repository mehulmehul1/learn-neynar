# Sprint Change Proposal — Frontend UX Focus (YOLO Mode)

Date: 2025-09-09
Author: Product Owner (Sarah)

## 1) Identified Issue Summary
- Backend capabilities for Zora coin creation (EOA “Create Now” + server-signed) and cast scheduling are working and validated.
- Frontend (Next.js + OnchainKit) currently implements only the “Create Now” path minimally.
- We need a deliberate pivot to: deepen UX design, complete the frontend (flows, components, styling, accessibility), and then wire all backend endpoints with robust error handling.

Immediate impact: Without a complete and guided UX, users can create but cannot reliably preview metadata, share, or see queue states; dev velocity is slowed by lack of final FE spec and acceptance criteria.

## 2) Epic Impact Summary
- Current epic: `docs/epics/mini-app-adaptation.md` remains valid but requires a FE-centric tranche.
- Recommend adding a focused sub-epic or workstream: “Frontend UX Completion for Mini App”.
- Reorder near-term priorities to finalize FE before expanding backend features.

## 3) Artifact Adjustment Needs
- Frontend Spec: `docs/specs/kamo-mini-app-frontend-spec.md`
  - Status: change from “Draft v1 — for review” to “v1.1 — Approved for implementation (styling polish pending)”.
  - Expand acceptance criteria per screen and flow; add A11y and empty/error state specs.
- Architecture: `docs/brownfield-architecture.md` (new) and `docs/architecture.md` (existing)
  - Cross-reference FE flows and API surface; add notes for prod rewrites and CORS hardening.
- PRD/Epics/Stories:
  - Add FE stories (see Section 5: Specific Proposed Edits) to `docs/stories/` and/or `docs/prd/` as your preferred location.
- README.md
  - Add “Frontend Dev Quickstart” and “Wiring Checklist” for FE ↔ BE.

## 4) Recommended Path Forward
Option 1: Direct Adjustment (Chosen)
- Double down on FE completion now, using the existing backend.
- Keep scheduler UI read-only for v1; focus on “Create Now” + Share loop to hit TTFV goals.
- Defer session keys/paymaster to follow-on epic (already tracked).

Rationale
- Maximizes user value quickly; reduces context switching; avoids premature backend scope.
- Uses validated backend endpoints; lowers risk of surprises during integration.

## 5) Specific Proposed Edits (Actionable)

A) Update Frontend Spec status and expand acceptance
- File: `docs/specs/kamo-mini-app-frontend-spec.md`
- Proposed textual changes:
  - Status: “Draft v1 — for review” → “v1.1 — Approved for implementation (styling polish pending)”
  - Add per-screen acceptance checklists for:
    - /app (inputs, preview sheet, tx send, success state)
    - /queue (empty, pending, created, failed rows; pagination/loading)
    - Identity panels (wallet/chain/SIWN visibility, copy changes)
    - Share flow (copy template, link, optional Farcaster intent)
  - Add A11y section: color contrast AA, focus order, aria labels for primary controls, motion reduction.

B) Add new FE stories (stubs) under `docs/stories/`
- FE-1 Create Now UX Completion
  - Acceptance: Title required; symbol auto; preview shows to/data/value nicely; Base 8453 enforced; tx success updates UI; errors recoverable without losing inputs.
- FE-2 Metadata Builder UX
  - Acceptance: Upload → CID → ipfs:// metadata JSON build; validation; clear progress and errors.
- FE-3 Success Share Flow
  - Acceptance: Shows tx hash + (optional) coin address; “Copy link” and “Share to Farcaster” CTA; template defined; handles cancel.
- FE-4 Queue Read-Only View
  - Acceptance: Lists pending/created/failed with when/title/status/tx; empty state friendly; polling or manual refresh.
- FE-5 Identity Panels (Wallet/SIWN)
  - Acceptance: Wallet connected state, wrong chain banner/action, SIWN session status; consistent with OnchainKit.
- FE-6 Dev Panel (Optional)
  - Acceptance: Address profile lookup; created coins table; for internal use; hidden in prod.
- FE-7 Backend Wiring & Error Handling
  - Acceptance: All calls use `web/lib/api.ts` base; robust to network errors; toasts; retry; graceful fallback when config missing.
- FE-8 Theming & A11y Polish
  - Acceptance: Consistent tokens; high-contrast mode; mobile-first; keyboard-only flows; screen reader labels on critical actions.

C) README additions
- Add “Frontend Dev Quickstart” with `web/` scripts and environment variables.
- Add “Integration Checklist” that maps FE actions to BE endpoints.

D) Architecture notes
- In `docs/architecture.md`, add a short “FE Integration” section: prod rewrites strategy vs. env base URL; CORS tightening for BE.

## 6) High-Level Action Plan
- Week 1
  - Finalize FE spec v1.1 (UX Expert) and approve.
  - Implement FE-1, FE-2, FE-5, FE-7 foundation (Dev) with basic styling.
- Week 2
  - Implement FE-3 (Share) and FE-4 (Queue), add polish (FE-8).
  - Optional FE-6 if time allows.
- QA (rolling)
  - Smoke tests per acceptance; verify chain guard; metadata pinning and preview flows.

## 7) Agent Handoff Plan
- UX Expert: finalize frontend spec v1.1 and component inventory; produce any wireframes/mockups as needed.
- Architect: review FE integration constraints (rewrites, CORS, env strategy) and document.
- Dev: implement FE stories and wire endpoints; keep scope to v1 targets.
- QA: validate acceptance criteria per story and UX a11y checks.
- PO/PM: reorder backlog to prioritize FE stories; track KPIs post-release.

## 8) MVP Scope Impact
- No reduction to MVP intent; clarifies that v1 centers EOA “Create Now” and read-only queue. Session keys/paymaster remain next epic.

## 9) Risks & Mitigations
- Risk: IPFS gateway variability → Mitigation: keep `gateway.pinata.cloud` fallback and skip preview metadata fetch.
- Risk: Chain switching friction → Clear copy + prominent switch action via OnchainKit.
- Risk: Error handling gaps → Centralize toasts/patterns; retry affordances.

## 10) Success Criteria
- Create Now: preview → send → success in <30s on typical network.
- Share: users can copy/share immediately; measurable share action rate.
- A11y: key screens pass AA contrast; keyboard-operable primary flow.
- Stability: <2% error rate across preview/send on dev test runs.

---

APPROVAL CHECKBOXES
- [ ] Approve spec status change to v1.1
- [ ] Approve story list FE-1 … FE-8
- [ ] Approve README/architecture doc updates
- [ ] Approve plan and sequence (weeks 1–2)

Once approved, I will generate the FE story files and apply the spec/README updates.

