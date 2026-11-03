---
id: 096
wave: 09-rates-catalog-ux
title: Rates activity IA — Search / Sheets / Sell / Spot sidebar shells
status: done
depends_on: [086, 095]
epic: SYS-RATES-UX
docs:
  - .project/docs/reference/rates-catalog-ux-2026-11-03.md
  - .project/docs/domains/rates.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/extension-points.md
  - .project/docs/git-workflow.md
---

# Rates activity IA — Search / Sheets / Sell / Spot sidebar shells

## Extension model

|                  |                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Package / id** | **`rates.catalog`** (`@starboard/ext-rates-catalog`) — driving built-in                                                    |
| **Layer**        | Built-in. Owns Rates activity IA; keeps contributing `quoting.slots.rateSources`                                           |
| **Defines**      | Keep `rates.slots.ingestActions`; declare `rates.slots.spotSearch` stub host if needed for 098 (empty until Spot fills it) |
| **Contributes**  | Four `views` entries under activity `rates` + matching `editors` / deep links                                              |
| **Unplug test**  | Catalog off → no Rates activity or these editors; quote rateSources loses catalog panel                                    |

Thin `app/(app)/rates/...` anchors only (null children when editor provided). **Not** a long-lived kernel page tree.

## Prod context

starboard-2 Rate Management uses three **top tabs** (Search Rates, Rate Sheets, Sell Your Rates). Rewrite maps those into the **Rates activity left sidebar** and adds **Spot search**. This ticket only remaps navigation and opens placeholder editors; Search filters, Spot offers, and Sheets/Sell product UI land in 097–099. Full IA table: [rates-catalog-ux-2026-11-03.md](../../docs/reference/rates-catalog-ux-2026-11-03.md).

## Goal

1. Replace the single “Rate catalog” sidebar entry with four entries: Search Rates, Rate Sheets, Sell Rates, Spot search.
2. Register editors + deep links that do not collide with `/rates/upload` or `/rates/catalog/:resourceId` (suggested: `/rates/search`, `/rates/sheets`, `/rates/sell`, `/rates/spot`).
3. Migrate the existing catalog list CRUD into the Rate Sheets shell (or a temporary “All rates” sub-entry under Sheets) so nothing is orphaned.
4. Leave Search / Spot / Sell shells as titled placeholders (or Sheets hosting current list) until later slices fill them.

## Non-goals

- FCL search filter/results UI (**097**)
- Standalone Spot offer search (**098**)
- Rate Sheets manage cards / Sell marketplace shell polish (**099**)
- Marketplace publish APIs; non-FCL modes

## Files to touch (approx)

- `extensions/builtins/rates-catalog/src/manifest.ts` — views entries + editors
- `extensions/builtins/rates-catalog/src/editors/*` — thin shells; move/reuse `rates-list` under Sheets
- `apps/web` — deep-link route anchors only (no product imports)
- `.project/docs/domains/rates.md` — document new IA if not already synced
- Inventory / extension-points if `rates.slots.spotSearch` is declared here

## Acceptance

- [x] Rates activity sidebar shows four entries matching the design doc labels
- [x] Each entry opens its editor via contribution deep link; no collision with upload/detail routes
- [x] Existing catalog list CRUD remains reachable (under Rate Sheets)
- [x] Unplug `rates.catalog` → Rates activity gone; quote still opens
- [x] `quoting.slots.rateSources` catalog contribution unchanged
- [x] `pnpm run ci` green

## Out of scope

Pixel-perfect prod chrome; Search/Spot/Sheets/Sell product bodies beyond shells
