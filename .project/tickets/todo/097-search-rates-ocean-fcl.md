---
id: 097
wave: 09-rates-catalog-ux
title: Search Rates — Ocean FCL filters + results table
status: todo
depends_on: [096]
epic: SYS-RATES-UX
docs:
  - .project/docs/reference/rates-catalog-ux-2026-11-03.md
  - .project/docs/domains/rates.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/extension-points.md
  - .project/docs/git-workflow.md
---

# Search Rates — Ocean FCL filters + results table

## Extension model

|                        |                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| **Package / id**       | **`rates.catalog`** — driving built-in                                                               |
| **Layer**              | Built-in. Fills `rate.search` editor from **096**                                                    |
| **Defines**            | None new (optional later: `rates.slots.searchModes` for LCL/Air packages — **not** this ticket)      |
| **Contributes**        | Search Rates editor UI; still `quoting.slots.rateSources` for quote apply                            |
| **Unplug test**        | Catalog off → Search Rates gone with Rates activity                                                  |

## Prod context

Prod **Search Rates** (Ocean FCL): mode icon bar; Origin/Destination port + swap; Valid between; Equipment; Agent; Carrier; Document ID; Search / Clear; results with Lane · Agent · Carrier · Validity · Transit · CT rate columns (20GP, 40GP, 40HC, …) · View. Other modes (LCL, Drayage, Cartage, Air) have different field sets — show tabs disabled with tooltip. Field/column detail: [rates-catalog-ux-2026-11-03.md](../../docs/reference/rates-catalog-ux-2026-11-03.md) § Ocean FCL.

## Goal

1. Replace the Search Rates placeholder with a prod-shaped **Ocean FCL** filter bar + results table.
2. Query via existing BFF / `services/rates` (`GET /rates`); extend query params only as needed (origin, destination, validity window, equipment/carrier when schema supports).
3. **View** opens the existing rate detail editor (`/rates/catalog/:id`).
4. Mode tabs for LCL / Drayage / Cartage / Air: visible, **disabled** (coming soon).
5. Sort can be client-side first; Export lean or stubbed.

## Non-goals

- Implementing LCL/Drayage/Cartage/Air search backends or filter UIs beyond disabled tabs
- Pixel-perfect prod CSS; full Export productization
- Agent/marketplace filters beyond what rates/CRM APIs already expose
- Spot inside Search Rates (Spot is **098**)

## Files to touch (approx)

- `extensions/builtins/rates-catalog/src/editors/*` / `components/*` — Search Rates FCL UI
- `apps/web/lib/domain/rates/*` + `/api/rates` — query param passthrough if extended
- `services/rates` — only if list filters are missing (prefer existing `origin` / `destination` / `validAt` / `q` first)
- Geo combobox reuse (`geo.gazetteer` / existing port pickers) where available

## Acceptance

- [ ] Search Rates editor shows FCL filters + results against live catalog API for the org
- [ ] Mode tabs for non-FCL are present and disabled
- [ ] View navigates to existing rate detail contribution
- [ ] Clear resets filters; Search triggers list refresh
- [ ] No kernel product imports of catalog UI
- [ ] `pnpm run ci` green

## Out of scope

Non-FCL modes; marketplace; Spot search; Rate Sheets manage UX
