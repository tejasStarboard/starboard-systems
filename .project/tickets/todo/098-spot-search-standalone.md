---
id: 098
wave: 09-rates-catalog-ux
title: Spot search — standalone Rates workbench editor
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

# Spot search — standalone Rates workbench editor

## Extension model

|                  |                                                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Package / id** | **`rates.catalog`** hosts editor; **`spot.*`** extras contribute offer UI into the new point                                       |
| **Layer**        | Built-in defines point; optional spot packages contribute (unplug spot → empty/disabled Spot search, Rates activity still present) |
| **Defines**      | **`rates.slots.spotSearch`** — host for standalone spot offer search (no quote document context)                                   |
| **Contributes**  | Spot search editor shell at `/rates/spot`; **unchanged** `quoting.slots.rateSources` spot contribution for apply-to-lane           |
| **Unplug test**  | Spot extras off → Spot search shows empty/gated state; quote may lose spot rateSources panel; catalog Search/Sheets still work     |

## Prod context

Prod **Search Rates** hard-codes spot off; users get spot only inside a quote’s Rates step. Rewrite adds a **Rates sidebar “Spot search”** entry so operators can query live/fixture spot offers **without** creating a quote. Entitlements match spot-on-quote plan gates. Summary: [rates-catalog-ux-2026-11-03.md](../../docs/reference/rates-catalog-ux-2026-11-03.md) § Spot search. Reuse patterns from catalog `spot-source` / existing spot offer search used on quotes — do not invent a second offer protocol.

## Goal

1. Fill the Spot search editor from **096** with a working offer search UI that does not require a quote document id.
2. Define and host `rates.slots.spotSearch`; wire `spot.*` contributions (or shared catalog spot panel) into that slot.
3. Keep quote apply-to-lane via `quoting.slots.rateSources` working as today.
4. Respect org credentials / plan gates already used for spot on quotes (**069** / spot settings).

## Non-goals

- “Create quote from this spot row” / deep-link apply without a quote (follow-on)
- Changing Search Rates (**097**) to include spot
- New carrier scrapers; marketplace
- Pixel-perfect prod (no prod Rate Management Spot tab exists)

## Files to touch (approx)

- `extensions/builtins/rates-catalog` — editor, `defines` + slot host for `rates.slots.spotSearch`; refactor shared bits from `slots/spot-source.tsx` if useful
- `extensions/spot/*` manifests — contribute to `rates.slots.spotSearch` where applicable
- `.project/docs/extension-points.md` — document the new point
- BFF / spot job APIs only as needed for search-without-quote (prefer existing endpoints)

## Acceptance

- [ ] Spot search sidebar entry opens a usable offer search without opening a quote
- [ ] `rates.slots.spotSearch` defined; spot extras can contribute; unplug spot → graceful empty/gated UI
- [ ] Quote `rateSources` spot path unchanged when spot on
- [ ] Plan/credential gating consistent with spot-on-quote
- [ ] `pnpm run ci` green

## Out of scope

Create-quote-from-spot; Search Rates FCL; Rate Sheets; Sell Rates
