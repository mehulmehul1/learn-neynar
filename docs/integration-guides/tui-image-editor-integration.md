# TUI Image Editor Integration Guide

## Overview
- Deliver Instagram-style editing workflow tightly integrated with compose tray, Template Studio, and drafts.
- Entry points: compose tray media upload (`web/components/compose-form.tsx`), Template Studio asset edits, queue item revisions.
- Adhere to research performance targets (<300ms preview, <1s final render) and accessibility requirements (Dynamic Type 130%, 4.5:1 contrast).

## Installation & Setup
1. Install dependencies: `npm install @toast-ui/react-image-editor react-color`.
2. Import editor styles in `web/app/layout.tsx` (or within the `tui-image-editor.tsx` wrapper) using a JavaScript statement such as `import 'tui-image-editor/dist/tui-image-editor.css';` so the CSS loads through Next.js modules.
3. Create wrapper component `web/components/tui-image-editor.tsx` that forwards refs and exposes imperative helpers (`applyTemplateOverlay`, `openWithFile`).
4. Access the underlying instance via `const inst = editorRef.current?.getInstance();`, `await inst.loadImageFromURL(url, name);`, and export through `inst.toDataURL({ format, quality });` (see Data Flow section for snippet).
5. Lazy load the wrapper with `next/dynamic` (`{ ssr: false }`) and gate rendering behind a shadcn `Skeleton` fallback.
6. Register Capacitor or Vibration API shim for optional haptics on supported devices.

## Enhanced Instagram-Style Workflow
- **Template Studio Integration**: Use `inst.loadImageFromURL(templateUrl, templateName)` to lock template background as the base layer and render safe-zone overlays via an HTML canvas. Maintain template structure on export by merging edited layers with template metadata before calling `/api/templates/render`.
- **Advanced Crop Tools**: Provide fixed aspect ratios (1:1, 4:5, 16:9) and free crop/rotate/flip. Perspective correction is optional and requires a custom Fabric transformation plugin if prioritized; treat as a stretch deliverable with separate sizing.
- **Enhanced Text Tools**: Offer font families (Inter, Satoshi, serif accent), typographic controls (size, weight, letter spacing), color picker with contrast validation, alignment, drop shadow, outline effect, and smart wrapping to stay inside safe zones.
- **Comprehensive Sticker System**: Include emoji packs, brand sticker library, and custom uploads restricted to raster formats (PNG/JPEG/WebP). If SVG must be supported, rasterize to canvas and sanitize server-side before insertion to prevent script injection.
- **Professional Draw Tools**: Provide brush presets (pen, marker, highlighter) with adjustable size/opacity, shape tools (rectangle, circle, arrow, line), color palette tokens, and undo/redo integration.
- **Filter System**: Implement brightness, saturation, contrast, and blur presets with real-time preview and before/after toggle. Warmth or vignette effects are optional extensions that need custom Fabric filter hooks or post-processing; document effort before scheduling.
- **Workflow Controls**: Breadcrumb (Compose -> Image Editor), contextual tooltips, keyboard shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Delete), and quick compare toggle for overlays.

## Enhanced Template Studio Integration
- **Live Preview Bridge**: Mirror editor state to Template Studio preview pane via shared context or `postMessage`; ensure updates render within <300ms budget.
- **Customization Controls**: Expose color theme, typography selection, avatar shapes, watermarks, and custom element toggles synchronized with Template Studio settings.
- **Template Versioning**: On save, post to `/api/templates/render` with `{ styleId, titleHash }` caching key, create new version records, and maintain history for rollback.
- **Accessibility Compliance**: Validate contrast 4.5:1 for text over backgrounds, auto-insert line breaks for long titles, and ensure template overlays include ARIA descriptions.

## Performance Optimization
- Enforce preview render <300ms and final export <1s by throttling filters, deferring heavy operations until idle, and batching state updates.
- Downscale images >4096px on import; use Web Workers or `createImageBitmap` to offload processing.
- Cache template previews keyed by {styleId, titleHash}; guard usage with if ('caches' in window) before calling caches.open('template-previews'), and fall back to storing blobs in IndexedDB when Cache API is unavailable.
- Store editor theme CSS in `<Head>` to prevent FOUC; prefetch icon sprites and fonts.
- Apply `will-change: transform` only during active gestures; remove afterwards to conserve GPU resources.
- Monitor memory via Performance API, releasing offscreen canvas contexts for low-end devices.

## Advanced Mobile Gesture Support
- Deliver full-screen shadcn `Sheet` on mobile with sticky top/bottom toolbars and collapsible tool drawers.
- Pinch zoom and two-finger rotation are not automatic in Toast UI; implement custom pointer gesture handlers (e.g., Hammer.js or Fabric canvas transforms) to translate multi-touch into scale/rotate actions. Mark two-finger rotate as stretch goal if timelines tighten.
- Support swipe to change tools, long-press to duplicate layer, and double-tap to reset zoom using custom handlers tied to the canvas.
- Provide haptic feedback (Vibration API or Capacitor) for tool selection, successful save, and error states.
- Optimize for battery by pausing heavy animations when `navigator.connection.saveData` or low power mode is detected.

## Enhanced Data Flow Integration
```tsx
const editorRef = useRef<ToastUIEditorRef>(null);

const openEditorWithTemplate = async (imageFile: File, templateUrl?: string) => {
  const inst = editorRef.current?.getInstance();
  if (!inst) return;

  if (templateUrl) {
    await inst.loadImageFromURL(templateUrl, 'template-background');
    // lock the base layer using Toast UI APIs if available
  }

  await inst.loadImageFromURL(URL.createObjectURL(imageFile), imageFile.name);
};

const exportImage = async () => {
  const inst = editorRef.current?.getInstance();
  if (!inst) return;
  const dataUrl = inst.toDataURL({ format: 'png', quality: 0.92 });
  return dataUrl;
};
```
1. User selects media in compose tray -> open editor with File blob.
2. Editor loads template background (if applicable), overlays safe zones, and listens for React Query updates (ticker availability, render status).
3. On save, call `inst.toDataURL({ format, quality })`, convert to Blob, upload via existing Pinata pipeline, and store CID.
4. Strip EXIF metadata (including GPS) by re-encoding through canvas or server-side utilities before upload, while honoring EXIF orientation on import.
5. Dispatch optimistic updates through React Query; subscribe to WebSocket events for render confirmation and progress toasts.
6. Maintain offline edits in IndexedDB; sync pending uploads when connection restores.
7. Emit analytics events (`image_editor.open`, `image_editor.export`, `image_editor.tool_used`) for product tracking.

## Accessibility Enhancements
- Support Dynamic Type up to 130% scaling; ensure toolbar wraps gracefully and tool labels remain legible.
- Provide descriptive ARIA labels for all controls (e.g., Crop tool, selected; Sticker library, 20 options).
- Maintain logical focus order; allow keyboard navigation across toolbars and canvas with arrow keys + Enter.
- Implement Escape key handling to close dialogs and Alt+Drag alternative for keyboard resizing gestures.
- Use color contrast validation on text/sticker colors and expose icon + text labels for non-color cues.

## Error Handling & Edge Cases
- **Render Failures**: Show fallback text-only preview, log telemetry, and allow user to proceed with minimal template.
- **Memory Overflow**: Detect via try/catch around canvas operations, downscale source progressively, warn users about quality impact.
- **Network Interruptions**: Queue uploads offline, show offline banner, and retry automatically with exponential backoff (max 5 attempts).
- **File Validation**: Enforce max 15MB, supported formats (jpeg, png, webp, gif). Animated GIFs are either blocked with guidance to upload video/MP4, or flattened to the first frame with a warning that animation will be lost before export. Exports always return static PNG/JPEG/WebP.
- **Sticker Security**: Only accept raster sticker uploads; if SVGs are allowed, rasterize client-side before insertion and sanitize on server to prevent script injection.
- **EXIF Handling**: Detect EXIF orientation to rotate images correctly on import and strip all EXIF data (GPS, device info) prior to Pinata upload to protect privacy.
- **Collaboration Conflicts**: If WebSocket indicates template version change, prompt to reload or branch edits.

## Integration with Existing Services
- Reuse Pinata upload flow with signed URL fallback; include metadata about edit session and template version.
- Call `/api/templates/render` after export to generate preview assets and trigger queue updates.
- Emit WebSocket messages (`image-editor.progress`, `image-editor.complete`) for real-time UI updates and toasts.
- Coordinate with Neynar/Zora actions to ensure composed media accompanies cast/coin payloads and share assets.

## Testing & Quality Assurance
- **Cross-Platform**: Test on Chromium, Safari, iOS Safari, Android Chrome with target devices (iPhone 14, Pixel 8, iPad Mini).
- **Performance**: Measure render/export times, memory usage, and frame rate during gestures; ensure compliance with targets.
- **Accessibility**: Validate screen reader announcements (VoiceOver, TalkBack), keyboard navigation, focus visibility, and Dynamic Type support.
- **Offline & Error**: Simulate offline editing, large files (8MP), Pinata failures, and template conflicts.
- **Analytics**: Verify event firing and React Query/WebSocket state transitions during editing lifecycle.

Reference `docs/full_frontend_research_ux_design_plan_onchain_mini_app_final_merged_compose_v_3.md` for full UX requirements and ensure all state management, performance, and accessibility standards remain aligned.



