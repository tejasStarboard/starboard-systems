---
id: 042
wave: 04-spot
title: Extension spot.cma
status: in_progress
depends_on: [040]
epic: SYS-EXT-SPOT
docs:
  - .project/docs/domains/spot.md
  - .project/docs/extensions.md
---

# Extension spot.cma

## Goal

Implement `spot.cma` (CMA CGM) as a separate extension plugin — prefer official API strategy first, scraper only if required. Same host interface as Maersk.

## Non-goals

- Maersk work (041)
- Full referential sync / canary from prod in one ticket

## Files to touch

- Spot worker `plugins/cma/**`
- Manifest `spot.cma`
- Org credential config

## Acceptance criteria

- [x] Search job returns structured rates or structured error
- [x] Independently disableable from `spot.maersk`
- [x] Clean plugin boundary; no shell edits beyond registry enable

## Fixtures / tests

- API fixture/mocks for CI

## Out of scope

Other carriers; Companion
