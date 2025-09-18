# Story 4.3 Export & Upload Pipeline

As a backend-integrated engineer,
I want editor exports to flow through Pinata safely and efficiently,
so that edited media is ready for templates and casts.

## Acceptance Criteria
1: Convert editor output to Blob, strip EXIF metadata, and upload via existing Pinata signed URL flow with retries/backoff.
2: Queue uploads offline and resume when connection returns; show progress via toast and status badge.
3: Persist asset metadata (cid, url, width/height, mime) with draft/template record.
4: Enforce file size limits and alert user when downscaling occurs.

## Integration Verification
- IV1: Contract tests ensure uploads succeed/fail gracefully (network error, quota exceeded, unsupported format).
- IV2: Manual test exporting large (>4096px) image demonstrates downscaling path.
- IV3: Analytics `image_editor.export` event captured with quality + duration.

## Notes
- Consider using `createImageBitmap` or worker to offload encoding for performance.
- Update support docs for troubleshooting failed uploads.
