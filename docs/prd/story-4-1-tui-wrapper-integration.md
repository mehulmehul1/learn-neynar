# Story 4.1 TUI Wrapper Integration

As a frontend engineer,
I want a reusable Toast UI image editor wrapper component,
so that any feature can open the editor with consistent configuration.

## Acceptance Criteria
1: Create `web/components/tui-image-editor.tsx` with dynamic import (`next/dynamic`, ssr: false) and skeleton fallback.
2: Expose imperative methods (`openWithFile`, `applyTemplateOverlay`, `exportImage`) and context for sharing state.
3: Load editor styles, localization, and icon assets without blocking main bundle (code splitting + prefetch).
4: Provide basic toolbar preset aligning with design guide.

## Integration Verification
- IV1: Compose tray can open editor, edit image, and return asset; ensure no memory leaks.
- IV2: Template Studio and queue revision integrate the same wrapper.
- IV3: Unit/integration tests cover mount/unmount lifecycle.

## Notes
- Ensure wrapper handles cleanup (`inst.destroy`) when closing to avoid leaks.
- Document usage examples for other engineers.
