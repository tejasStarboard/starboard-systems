---
id: 086
wave: 07-quote-loop
title: Rates catalog CRUD via rates.catalog workbench contributions
status: done
depends_on: [073, 080]
epic: SYS-RATES
docs:
  - .project/docs/domains/rates.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/extension-points.md
  - .project/docs/reference/extension-migration-inventory-2026-11-02.md
---

# Rates catalog CRUD via rates.catalog workbench contributions

## Extension model

|                        |                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package / id**       | **`rates.catalog`** (existing `@starboard/ext-rates-catalog`) — **driving built-in**                                                        |
| **Layer**              | Built-in. Owns catalog browser UX; keeps contributing `quoting.slots.rateSources` for apply-to-lane                                         |
| **Defines** (optional) | `rates.slots.ingestActions` (or similar) so **087** / ingest extras can inject upload actions without coupling                              |
| **Contributes**        | `workbench.activity` / `views` / `editors` for catalog list + detail (deep links e.g. `/rates`, `/rates/:id`) — same pattern as CRM **078** |
| **Unplug test**        | Catalog off → no Rates activity/editors; quote rateSources loses catalog panel; spot/manual quote still work                                |

Thin `app/(app)/rates/...` anchors only (null children when editor provided), like customers/settings. **Not** a long-term kernel page tree.

## Goal

1. First-class catalog browse/create/edit/delete (or soft-delete) against `services/rates`.
2. Wire workbench contributions so catalog is reachable without opening a quote.
3. Keep apply-to-lane path via existing `rateSources` contribution.

## Non-goals

- Excel/PDF ingest pipeline (**087**)
- Spot credential UX (**069** done)
- Rate marketplace (won't port)

## Files to touch (approx)

- `extensions/builtins/rates-catalog` — editors/views + BFF client usage
- Manifest workbench contributions; optional `defines` for ingest actions
- `apps/web` — deep-link anchors + `/api` rates BFF only
- Inventory + rates domain doc

## Acceptance

- [x] Catalog CRUD usable from workbench when built-in active
- [x] Contributions registered; kernel has no catalog product imports
- [x] Unplug → no catalog activity; quote still opens
- [x] `rateSources` apply path still works when catalog on
- [x] `pnpm run ci` green

## Out of scope

Air/LCL catalogs; amendments workflows
