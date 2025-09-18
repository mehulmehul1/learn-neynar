# Zora Coins — Research Notes (Notepad)

Links crawled via Archon (Project: kamo):
- https://docs.zora.co/coins (intro)
- https://docs.zora.co/coins/sdk (SDK overview)
- https://docs.zora.co/coins/sdk/create-coin (Create Coin)
- https://docs.zora.co/coins/sdk/metadata-builder (Metadata Builder)
- https://docs.zora.co/coins/contracts/creating-a-coin (Contracts)

Targets to extract (fill from RAG results):
- SDK package/import: `PACKAGE_TBD`
- Create Coin function:
  - Name: `FUNC_TBD`
  - Params: `{ name, symbol?, metadataUri, ... }`
  - Returns: `{ address, txHash }` or receipt-like object
- Metadata Builder:
  - API: `BUILDER_TBD`
  - Fields: `name`, `description`, `image`, `image_mime_type`, `animation_url`, `animation_url_mime_type`
  - Output: `metadataJson`, `uri`
- Contracts path:
  - Factory address: `FACTORY_TBD`
  - Method: `METHOD_TBD(name, symbol?, metadataURI, ...)`
  - Chain: `ZORA_CHAIN_ID_TBD`, RPC: `RPC_TBD`

Open questions:
- Default symbol behavior if not provided.
- Any fees or hook registration required on creation.
- Recommended poster image for video.

Progress IDs:
- Crawl (coins root): 5c712ed4-2719-404e-aeb9-dcea189a6d51 (depth 0)
- Crawl (coins depth 1): f136d005-b077-4120-a65e-a43552d4038b

Next actions:
- Query RAG for exact function signatures and paste here.
- Replace all *_TBD with concrete values; update `docs/prp-zora-coins.md` accordingly.

