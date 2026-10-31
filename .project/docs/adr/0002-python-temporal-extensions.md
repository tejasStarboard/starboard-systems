# ADR 0002 — Python + Temporal OSS for async extensions

## Status

Accepted

## Context

Rate-doc ingestion, carrier spot (API + scrape), and email/LLM pipelines are
long-running. Blocking Next request paths caused production lockouts in
starboard-2. The rewrite needs durable async work with step retries, mid-pipeline
resume, and a clear **202 enqueue** contract from the shell.

Sync domain CRUD already lives on Bun + Hono. Async work should stay in Python
plugins (per mode / carrier) without inventing a new monorepo app for each
extension. Temporal OSS provides a mature Python SDK, self-hosted control plane
(no Cloud requirement), and first-class workflows/activities for multi-step
pipelines (plan → extract → gate → save).

## Decision

- Sync domain CRUD stays on **Bun + Hono** services.
- Async / LLM / scraper / ingest work runs in **Python** workers driven by
  **Temporal OSS** (self-hosted; Temporal Cloud optional later, not required).
- Shell/BFF starts a workflow (via the extension worker HTTP API) and returns
  **202 + workflow / run id**; never waits on full scrape/ingest in the user
  request.
- Shared Python bootstrap lives in `packages/python-kit` (service token, logging,
  Temporal client/worker helpers).
- Extension manifest `worker.kind` is **`python-temporal`**.
- Local uses Temporal OSS via Docker (`@starboard/ext-temporal` in `pnpm dev`;
  UI on `:8233`, gRPC on `:7233`) plus the Python worker
  (`starboard-ingestion-dev`).

## Consequences

- Per-carrier / per-mode logic ships as plugins inside workers, not new apps.
- Workflow state is owned by Temporal; domain writes (e.g. `services/rates`) go
  over HTTP with service-token auth — no dual-write into domain schemas from
  workers.
- Ad-hoc Neon job tables and third-party TS job buses (e.g. Inngest) are out of
  scope for extension durability.
