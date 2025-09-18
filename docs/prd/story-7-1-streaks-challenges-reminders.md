# Story 7.1 Streaks, Challenges & Reminders

As a growth PM,
I want streaks, challenges, and reminder systems live,
so that creators stay engaged and return weekly.

## Acceptance Criteria
1: Implement streak tracking service (current, longest, badges) with UI surfacing progress in success sheet and portfolio.
2: Launch challenge enrollment flows, dashboards, and reminder scheduling with opt-in controls.
3: Provide reminder delivery preferences (email/push) and integrate with notifications API.
4: Track analytics (`streak_milestone`, `challenge_join`, `reminder_opt_in`) feeding growth dashboards.

## Integration Verification
- IV1: Backend endpoints consumed; data persists and updates correctly.
- IV2: QA validates on/off toggles, reminders firing, and unsubscribes.
- IV3: Accessibility review ensures new UI elements meet contrast and keyboard requirements.

## Notes
- Provide guardrails to avoid notification fatigue (frequency caps, quiet hours).
- Document copy/tone with marketing.
