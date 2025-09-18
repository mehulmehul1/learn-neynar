# Story 4.4 Editor Analytics Instrumentation

As a product analyst,
I want detailed analytics from the image editor,
so that we can optimize tooling and engagement.

## Acceptance Criteria
1: Emit events (`image_editor.open`, `image_editor.tool_used`, `image_editor.export`, `image_editor.cancel`) with payload (toolType, durationMs, collaborativeSession flag).
2: Integrate feature flags for experimental tool rollsouts and capture variant exposure.
3: Surface basic telemetry dashboard (e.g., Looker/PostHog) with funnels for open -> export -> publish.
4: Provide privacy review ensuring no PII in payloads.

## Integration Verification
- IV1: Analytics QA validates events firing with correct schema across web/mobile.
- IV2: Feature flag toggling verified in dev/stage environments.
- IV3: Dashboard screenshot attached to story closure.

## Notes
- Coordinate with growth team on naming conventions and retention metrics.
- Align with broader analytics taxonomy defined in PRD.
