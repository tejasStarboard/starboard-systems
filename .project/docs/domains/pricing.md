# Domain: pricing

|         |                                               |
| ------- | --------------------------------------------- |
| Package | `packages/pricing` (`@starboard/lib-pricing`) |
| Status  | Started — tickets 010 + 066 ONE MATH          |

## Owns

ONE MATH: buy/sell, surcharge inclusion, FX, margin, rounding, incoterm scope helpers used by quotes UI and services.

## Rule

Single implementation + fixture conformance suite. No TS/Python/add-in twins.

## Exported API

| Export                      | Role                                                    |
| --------------------------- | ------------------------------------------------------- |
| `roundMoney`                | Half-up money rounding (default 2 dp)                   |
| `computeManualLaneTotals`   | Canonical `{ buy, markup, sell }` for manual rate lines |
| `calculateManualRateTotals` | UI alias `{ subtotal, markup, total }`                  |
| `isIncludedInTotal`         | Surcharge inclusion predicate (sell / buy / rollup_buy) |
| `getEffectiveUsageAmount`   | free → min → max usage → billable qty                   |
| `calculateSurchargeAmount`  | Unit / flat / % of base freight → `{ buy, sell }`       |
| `isBaseFreightRow`          | Stamp or name-allowlist base-freight predicate          |
| `findBaseFreightRow`        | Elect base freight from a surcharge list                |

Schemas for quote/catalog charge lines live in `@starboard/lib-contracts` (`surchargeLineSchema`). Persistence: ticket **065** (`quotes.surcharge`, prepared `rates.surcharge`). Amount engine: **066**.

## Fixtures

Under `packages/pricing/fixtures/`:

- `manual-rate-totals.json` — rewrite golden cases for lane totals
- `total-inclusion-test-cases.json` — copied from legacy `shared-fixtures/qv2`
- `surcharge-min-mechanics.json` — copied from legacy `shared-fixtures/qv2` (rows 1–10)
- `base-freight-row-identity.json` — copied from legacy `shared-fixtures/qv2` (SB-6190)
- `surcharge-amount-cases.json` — lean rewrite cases for unit / flat / % freight

## Schema push (surcharge tables)

```bash
pnpm --filter @starboard/lib-db db:push
```

Creates/updates `quotes.surcharge` and `rates.surcharge` (drizzle-kit push; no versioned SQL migrations).

## Deferred

- FX converters / display-currency paths
- Full `surcharge_matrix.json` parity (tiers, dollar min/max/free charge, user overrides)
- Incoterm scope helpers beyond inclusion flags already in `isIncludedInTotal` — **068**
- Auto-margin / tier constraints
- Quote UI for charge lines — **067**

## Next tickets

**067** quote UI; **068** globals / incoterm scope. Spot/carrier quirks stay out of ONE MATH.
