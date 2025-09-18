# Story 6.1 Portfolio Tabs & Metrics

As a creator,
I want to review my Created and Holdings coins with key metrics,
so that I can understand performance at a glance.

## Acceptance Criteria
1: Build tabs for Created vs Holdings with summary stats (market cap, volume, streak status) and filters.
2: Render cards with sparklines, price change, supply, and CTA buttons (share, mint more) per design spec.
3: Support empty, loading, and error states with guidance and deep links.
4: Emit analytics (`portfolio.view`, `portfolio.filter`) capturing filters and dwell time.

## Integration Verification
- IV1: API integration handles pagination/cursor, caching results.
- IV2: Accessibility scan ensures cards navigable and chart alternatives provided.
- IV3: Performance profiling ensures cards render under 16ms average.

## Notes
- Provide accessible descriptions for sparklines.
- Ensure data refresh triggers highlight updates without jarring animations.
