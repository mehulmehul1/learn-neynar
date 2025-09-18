Archon Document Ingestion (Local)

Use this minimal flow to add a local Markdown file to Archon as a Document via the API.

Prereqs
- Node 18+ installed.
- Archon backend running locally (API on `http://localhost:8181`). Start via: `cd archon && make dev`.
- Project ID available (create one if needed via API below).

Create a Project (if needed)
curl -sS -X POST "http://localhost:8181/api/projects" \
  -H "Content-Type: application/json" \
  -d '{"title":"learn-neynar","description":"Local docs + examples"}'

Grab the `id` from the response and export it:
setx ARCHON_PROJECT_ID <copied-uuid>   # Windows PowerShell
# or
export ARCHON_PROJECT_ID=<copied-uuid> # macOS/Linux

Dry-Run: Inspect the payload to be posted
npm run archon:add-doc -- --dry-run

Post the local Markdown as a Document
npm run archon:add-doc
# or explicitly:
node scripts/archon/add-doc.mjs \
  --project %ARCHON_PROJECT_ID% \
  --file doc-neynerlll.md \
  --type guide

Verify
curl -sS "http://localhost:8181/api/projects/%ARCHON_PROJECT_ID%/docs?include_content=false"

Notes
- Script reads `HOST` and `ARCHON_SERVER_PORT` from environment if set (defaults: `localhost:8181`).
- Document payload uses `{ format: "markdown", text: <file> }` so the API can store and embed it.
- For remote URLs, use Archon’s crawler via the MCP/HTTP endpoint `/api/knowledge-items/crawl` (requires running services).
