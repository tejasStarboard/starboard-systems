# Domain: pricing

|         |                                           |
| ------- | ----------------------------------------- |
| Package | `packages/pricing` (`@starboard/pricing`) |
| Status  | Started — ticket 010 ONE MATH core        |

## Owns

ONE MATH: buy/sell, surcharge inclusion, FX, margin, rounding, incoterm scope helpers used by quotes UI and services.

## Rule

Single implementation + fixture conformance suite. No TS/Python/add-in twins.

## Exported API (010)

| Export                      | Role                                                    |
| --------------------------- | ------------------------------------------------------- |
| `roundMoney`                | Half-up money rounding (default 2 dp)                   |
| `computeManualLaneTotals`   | Canonical `{ buy, markup, sell }` for manual rate lines |
| `calculateManualRateTotals` | UI alias `{ subtotal, markup, total }`                  |
| `isIncludedInTotal`         | Surcharge inclusion predicate (sell / buy / rollup_buy) |
| `getEffectiveUsageAmount`   | free → min → max usage → billable qty                   |

Schemas for quote forms stay in `@starboard/contracts`. Consumers: `apps/web` quote form (manual rate totals).

## Fixtures

Under `packages/pricing/fixtures/`:

- `manual-rate-totals.json` — rewrite golden cases for lane totals
- `total-inclusion-test-cases.json` — copied from legacy `shared-fixtures/qv2`
- `surcharge-min-mechanics.json` — copied from legacy `shared-fixtures/qv2` (rows 1–10)

## Deferred

- FX converters / display-currency paths
- Full surcharge row engine (`surcharge_matrix.json`)
- Incoterm scope helpers beyond inclusion flags already in `isIncludedInTotal`
- Auto-margin / tier constraints
- Quotes service buy/sell persistence (when rates domain lands)

## Next tickets

Rates catalog (`020`) will consume more of this package; spot/carrier quirks stay out of ONE MATH.
