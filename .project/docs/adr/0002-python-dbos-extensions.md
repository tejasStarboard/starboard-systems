# ADR 0002 — Python + DBOS for async extensions

## Status

Accepted

## Context

Rate-doc ingestion, carrier spot (API + scrape), and email/LLM pipelines are long-running. Blocking Next request paths caused production lockouts in starboard-2. Prod already uses DBOS (“foundry”) successfully.

## Decision

- Sync domain CRUD stays on **Bun + Hono** services.
- Async / LLM / scraper / ingest work runs in **Python** workers with **DBOS** durable queues.
- Shell/BFF enqueues jobs and returns **202 + job id**; never waits on full scrape/ingest in the user request.
- Shared Python bootstrap lives in `packages/python-kit` (service token, logging, DBOS).

## Consequences

- Continuity with prod operational knowledge.
- Per-carrier / per-mode logic ships as plugins inside workers, not new monorepo apps for every carrier.
- Temporal is not introduced unless DBOS proves insufficient.
