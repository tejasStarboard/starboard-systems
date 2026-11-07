---
id: 099
wave: 09-rates-catalog-ux
title: Rate Sheets manage UI + Sell Rates gated marketplace shell
status: backlog
depends_on: [096]
epic: SYS-RATES-UX
docs:
  - .project/docs/reference/rates-catalog-ux-2026-11-03.md
  - .project/docs/domains/rates.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/extension-points.md
  - .project/docs/reference/rewrite-coverage-2026-11-01.md
  - .project/docs/git-workflow.md
---

# Rate Sheets manage UI + Sell Rates gated marketplace shell

Soft dependency: [087](../done/087-ingestion-fcl-v6-excel-pdf.md) (or done) for richer ingest job status on sheet cards. Ship with whatever ingest status APIs exist; do not block on full Excel/PDF agent parity.

## Extension model

|                  |                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Package / id** | **`rates.catalog`** hosts Sheets + Sell editors; **`ingestion.fcl_v6`** contributes upload via `rates.slots.ingestActions` |
| **Layer**        | Built-in shells + optional ingest extra                                                                                    |
| **Defines**      | Existing `rates.slots.ingestActions` (toolbar / upload on Sheets)                                                          |
| **Contributes**  | Rate Sheets + Sell Rates editors; catalog list CRUD remains under Sheets                                                   |
| **Unplug test**  | Ingest off → Sheets loses upload contribution but manage shell remains; Sell shell remains (gated banner)                  |

## Prod context

**Rate Sheets:** Upload dropzone (“Drop rate sheets… Excel/PDF/Word”) + Manage section with status chips (All / In progress / Needs review / Saved), filename search, filter grid, and file cards (agent/carrier/service/upload meta, needs-help / failed / repaired actions).

**Sell Your Rates:** Marketplace overview, seller stats, listings list; when selling is off, prod shows a banner that marketplace isn’t switched on for the company. Rewrite coverage marks marketplace **Won’t / deferred** — ship the **gated shell + banner + empty states only**; no publish/unlist APIs.

Detail: [rates-catalog-ux-2026-11-03.md](../../docs/reference/rates-catalog-ux-2026-11-03.md) § Rate Sheets / Sell Your Rates.

## Goal

### A — Rate Sheets

1. Prod-shaped Upload + Manage chrome on the Rate Sheets editor from **096**.
2. Wire upload through `rates.slots.ingestActions` (keep `/rates/upload` deep link working or redirect into Sheets).
3. Status chips + sheet cards driven by ingest job / sheet metadata when available; otherwise honest empty/partial states.
4. Keep existing catalog rate list reachable (sub-section or linked from Sheets).

### B — Sell Rates

1. Gated shell: informational banner (selling not enabled) + empty “Your listings” / “Your rate sheets” overview matching prod structure at a lean level.
2. **No** marketplace publish, margin, or buyer analytics APIs.

## Non-goals

- Full Starboard Marketplace (listings, margin, buyer views, times quoted live metrics)
- Air/LCL/drayage/cartage ingest pipelines
- Pixel-perfect prod CSS
- Search Rates / Spot search product work (**097** / **098**)

## Files to touch (approx)

- `extensions/builtins/rates-catalog` — Sheets + Sell editors/components; ingestActions host
- `extensions/.../ingestion.fcl_v6` — contribute upload / status into Sheets if not already
- Ingest job list BFF routes as needed (prefer existing)
- `.project/docs/domains/rates.md` / rewrite-coverage note that Sell remains deferred beyond shell

## Acceptance

### Rate Sheets

- [ ] Upload dropzone / browse reachable from Rate Sheets via ingest contribution
- [ ] Manage UI shows status chips + card list (or clear empty state when no jobs)
- [ ] Catalog CRUD from 086 still reachable under Sheets
- [ ] Unplug ingest → Sheets shell remains without upload contribution

### Sell Rates

- [ ] Sell Rates sidebar opens gated banner + empty marketplace overview
- [ ] No publish/unlist API calls or marketplace schema work
- [ ] Rewrite-coverage remains Won’t/deferred for full marketplace

### Shared

- [ ] Kernel has no Sheets/Sell product imports
- [ ] `pnpm run ci` green

## Out of scope

Marketplace product; non-FCL Search; Spot search; creating quotes from sheets
