# Story 6.2 Coin Detail & Actions

As an engaged collector,
I want rich coin detail with quick actions,
so that I can trade, share, or manage positions efficiently.

## Acceptance Criteria
1: Build detail view/modal with metrics, transaction history, share CTA, trade shortcuts, and milestone badges.
2: Integrate Zora trade links or embedded widget respecting permissions.
3: Provide share builder with prefilled cast text, template preview, and optional friend tags.
4: Track analytics (`coin_detail.open`, `coin_detail.share`, `coin_detail.trade`) with outcome metadata.

## Integration Verification
- IV1: API calls fetch detail data with caching and error states.
- IV2: Share flow hooks into success sheet pipeline; preview updates accordingly.
- IV3: QA verifies permission gating (private coins hidden to followers lacking access).

## Notes
- Provide fallback when trade integration unavailable (maintenance banner).
- Align copy with legal/compliance guidance.
