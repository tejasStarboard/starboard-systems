---
id: 020
wave: 02-rates-ingest
title: services/rates catalog
status: open
depends_on: [002, 003]
epic: SYS-RATES
docs:
  - .project/docs/domains/rates.md
  - .project/docs/architecture.md
---

# services/rates catalog

## Goal

Create `services/rates` with a normalized rate catalog schema (org-scoped), list/search/create APIs, contracts, and a thin BFF client. Manual rate entry can write here; ingestion/spot extensions will write later.

## Non-goals

- FCL v6 ingestion (021)
- Spot plugins
- Full surcharge matrix UI

## Files to touch

- `packages/database` — `rates` schema
- `packages/contracts`
- `services/rates/**`
- `apps/web` client + minimal rates list or quote rate picker stub
- Docker/turbo workspace entries

## Acceptance criteria

- [ ] CRUD or create+list+get for rates scoped by org
- [ ] Soft IDs for ports/customers as opaque text
- [ ] Bun layering + service token auth
- [ ] Documented in domain md

## Fixtures / tests

- Org isolation + contract tests

## Out of scope

LLM parsing; carrier scrapers
