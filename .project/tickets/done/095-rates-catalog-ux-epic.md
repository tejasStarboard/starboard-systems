---
id: 095
wave: 09-rates-catalog-ux
title: Rates catalog UX epic (Search / Sheets / Sell / Spot sidebar)
status: done
depends_on: [086]
epic: SYS-RATES-UX
docs:
  - .project/docs/reference/rates-catalog-ux-2026-11-03.md
  - .project/docs/reference/build-priority-2026-11-01.md
  - .project/docs/domains/rates.md
  - .project/docs/git-workflow.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/extension-points.md
---

# Rates catalog UX epic

**Orchestration / docs ticket — not an implementation slice.** Feature chats implement **096–099** only.

Soft parallel: [087](../done/087-ingestion-fcl-v6-excel-pdf.md) (done) deepens ingest for Rate Sheets manage (099); do not block IA/Search/Spot on 087.

## Git

Normal program rules ([git-workflow.md](../../docs/git-workflow.md)) — **no** `quote-flow`-style integration branch:

| Rule            | Detail                                                    |
| --------------- | --------------------------------------------------------- |
| Base            | `origin/dev`                                              |
| Slice branches  | `git checkout --no-track -b {id} origin/dev`              |
| PR base         | **`dev` only**                                            |
| Never push      | `dev` / `main` directly                                   |

## Goal

1. Point all Rates catalog UX work at [rates-catalog-ux-2026-11-03.md](../../docs/reference/rates-catalog-ux-2026-11-03.md).
2. Sequence vertical slices: **096** IA shells → **097** Search FCL / **098** Spot / **099** Sheets+Sell (parallel after 096 OK).
3. Map prod Rate Management top tabs into Rates activity sidebar + add Spot search.
4. Keep marketplace full port and non-FCL search backends out of this phase.

## Slices

| Id                                                           | Title                                      | Notes                                      |
| ------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------ |
| [096](../todo/096-rates-activity-ia.md)                      | Rates activity IA + editor shells          | Four sidebar entries; migrate flat list    |
| [097](../todo/097-search-rates-ocean-fcl.md)                 | Search Rates (Ocean FCL)                   | Mode tabs stub non-FCL                     |
| [098](../todo/098-spot-search-standalone.md)                 | Spot search (standalone)                   | No quote required; `rates.slots.spotSearch` |
| [099](../todo/099-rate-sheets-and-sell-shell.md)             | Rate Sheets manage + Sell Rates gated shell | Soft-dep 087 for richer ingest status     |

```text
095 epic
096 IA shells ──► 097 Search FCL
               ├──► 098 Spot search
               └──► 099 Sheets + Sell gated
087 ingest ── soft-dep for 099 status
```

## Non-goals

- Implementing product UI in this ticket
- Full marketplace; LCL/Drayage/Cartage/Air search backends
- Linear

## Acceptance

- [x] Design doc published and linked from build-priority Phase F + rates domain
- [x] Slice tickets **096–099** exist under `todo/` with Extension model + prod context
- [x] Feature chats are pointed at **one** slice ticket + design doc — not this epic for coding

## Out of scope

Product code; creating Linear issues
