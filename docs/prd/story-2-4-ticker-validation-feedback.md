# Story 2.4 Ticker Validation & Feedback

As a coin creator,
I want immediate feedback on ticker availability and sponsorship status,
so that I avoid failures at publish time.

## Acceptance Criteria
1: Integrate debounced ticker validation hooking into `/ticker/check` endpoint with real-time status badges (idle/checking/available/conflict/sponsored).
2: Surface sponsorship eligibility and gas estimates inline for coin mode, updating preview summary.
3: Provide toast notifications for validation errors, retries, or fallback scenarios.
4: Log analytics (`ticker_check`) with response time, availability result, and retry count.

## Integration Verification
- IV1: Contract tests ensure validation handles success, conflict, rate limit, and error responses.
- IV2: UI tests verify status transitions and accessible announcements (aria-live) for each state.
- IV3: No more than 30 validations/minute per requirements; confirm debounce/throttle meets quota.

## Notes
- Coordinate with backend on error codes defined in API contracts.
- Provide manual override notes for support (when to escalate to admin tools).
