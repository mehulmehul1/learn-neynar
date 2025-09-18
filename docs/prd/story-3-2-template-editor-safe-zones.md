# Story 3.2 Template Editor with Safe Zones

As a designer,
I want a template editor that enforces safe zones and accessible typography,
so that shared templates look great and meet accessibility targets.

## Acceptance Criteria
1: Build editor workspace with layer list, properties panel, and canvas, leveraging shadcn layout patterns.
2: Overlay safe zones, grid, and contrast warnings; prevent saving when critical violations unresolved.
3: Provide typography and color controls sourced from token set; validate contrast >=4.5:1 automatically.
4: Update live preview panel within <300ms per change, showing queue of render jobs if needed.

## Integration Verification
- IV1: Render worker integration returns preview/success states; progress surfaced via WebSocket.
- IV2: Autosave ensures edits recover after reload; version stamp updated.
- IV3: Accessibility testing confirms keyboard operability of layer controls.

## Notes
- Coordinate with UX on default template set and safe zone visuals.
- Store editor settings (grid visibility, units) per user preference.
