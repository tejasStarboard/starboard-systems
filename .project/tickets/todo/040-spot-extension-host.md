---
id: 040
wave: 04-spot
title: Spot extension host (DBOS foundry)
status: open
depends_on: [001, 020]
epic: SYS-EXT-SPOT
docs:
  - .project/docs/domains/spot.md
  - .project/docs/adr/0002-python-dbos-extensions.md
  - .project/docs/extensions.md
---

# Spot extension host (DBOS foundry)

## Goal

Create the Python spot/carriers worker with a plugin interface, DBOS queues (foundry-style), credential port, and normalization into rates/quote DTOs. No carrier-specific logic beyond a no-op or fake plugin for tests.

## Non-goals

- Implementing Maersk/CMA scrapers (041/042)
- Companion desktop
- Precache of global transit matrix

## Files to touch

- `services/spot` (or `services/carriers`) Python
- Plugin interface: `search(request) -> rates`
- BFF enqueue `POST` → 202
- Extension-host job contribution type `spot.search`

## Acceptance criteria

- [ ] Plugin registry loads carrier plugins by id
- [ ] Fake plugin returns deterministic rates in tests
- [ ] Job durability via DBOS (or documented interim queue with clear follow-up)
- [ ] Shell rate-source slot can list spot extensions from manifests

## Fixtures / tests

- Fake plugin integration test

## Out of scope

Real carrier credentials; Playwright scrapers
