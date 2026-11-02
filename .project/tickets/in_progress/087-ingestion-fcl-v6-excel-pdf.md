---
id: 087
wave: 07-quote-loop
title: FCL v6 Excel/PDF ingest (optional ingestion.fcl_v6)
status: in_progress
depends_on: [021, 080, 086]
epic: SYS-EXT-INGEST
docs:
  - .project/docs/deprecations.md
  - .project/docs/extensions.md
  - .project/docs/adr/0002-python-temporal-extensions.md
  - .project/docs/reference/extension-migration-inventory-2026-11-02.md
---

# FCL v6 Excel/PDF ingest (optional ingestion.fcl_v6)

## Extension model

|                  |                                                                                                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package / id** | **`ingestion.fcl_v6`** — **optional extension** (extra), already Temporal worker                                                                                                                         |
| **Layer**        | Optional. Unplug freely; quoting/catalog must work without it                                                                                                                                            |
| **Contributes**  | Existing jobs/API + rates upload editor; prefer injecting actions via `rates.catalog` **defines** (`rates.slots.ingestActions`) from **086** when present; else keep `/rates/upload` editor contribution |
| **Must not**     | Port FCL v3/v4/v5 or frozen v5-inside-v6 (**deprecations.md**)                                                                                                                                           |

## Goal

1. Accept **Excel and/or PDF** ocean FCL rate sheets through the v6 gate-first pipeline (CSV remains supported).
2. Same Temporal **202 + job status** pattern; failed gates do not save rates.
3. UI entry stays extension-owned (upload editor / catalog ingest slot) — not a kernel page.

## Non-goals

- Air / LCL / cartage ingest (separate future extras)
- Coding-agent full parity with prod's every carrier template
- Reviving legacy parsers under `parsers/ocean/`

## Files to touch (approx)

- `extensions/ingestion` — parsers/gates for xlsx/pdf; worker wiring
- Manifest job/API docs; upload UI accept types
- Tests/fixtures for at least one Excel and one PDF happy path + one gate fail
- Inventory + extensions cookbook

## Acceptance

- [ ] Excel and/or PDF (ticket picks both or phased with checklist) enqueue → status → rates on success
- [ ] Gate failure → no partial rate write; error on job status
- [ ] Extension off → no upload activity/API; catalog/quoting OK
- [ ] No v3–v5 code paths introduced
- [ ] `pnpm run ci` / Python tests green as applicable

## Out of scope

Amendments workflows; rate marketplace
