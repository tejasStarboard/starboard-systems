# Domain: pricing

|         |                                               |
| ------- | --------------------------------------------- |
| Package | `packages/pricing` (`@starboard/lib-pricing`) |
| Status  | Started — tickets 010 + 066–068 ONE MATH      |

## Owns

ONE MATH: buy/sell, surcharge inclusion, FX, margin, rounding, incoterm / door-bucket scope helpers used by quotes UI and services.

## Rule

Single implementation + fixture conformance suite. No TS/Python/add-in twins.

## Exported API

| Export                       | Role                                                           |
| ---------------------------- | -------------------------------------------------------------- |
| `roundMoney`                 | Half-up money rounding (default 2 dp)                          |
| `computeManualLaneTotals`    | Canonical `{ buy, markup, sell }` for manual rate lines        |
| `calculateManualRateTotals`  | UI alias `{ subtotal, markup, total }`                         |
| `isIncludedInTotal`          | Surcharge inclusion predicate (sell / buy / rollup_buy)        |
| `deriveExcludedBuckets`      | Legacy door presence helper (068). Quote UI no longer calls it |
| `excludedBucketsForIncoterm` | Incoterm × shipper/consignee → excluded buckets (070)          |
| `getEffectiveUsageAmount`    | free → min → max usage → billable qty                          |
| `calculateSurchargeAmount`   | Unit / flat / % of base freight → `{ buy, sell }`              |
| `isBaseFreightRow`           | Stamp or name-allowlist base-freight predicate                 |
| `findBaseFreightRow`         | Elect base freight from a surcharge list                       |

`computeManualLaneTotals` accepts optional `scope.excluded_buckets` and quote-level `globalCharges` (`source: "global"` — immune to bucket scope). The quote UI passes **one** selected rate line. `baseMode: "per_eq"` multiplies `amount` by container count, or sums `equipmentAmounts` (`amount × count`) when those rows are present. Flat mode ignores container count. One lane `$` / `%` markup dial applies to that rolled buy for a single container and for mixed equipment. A finite `sellAmount` replaces that row’s calculated sell; the gap vs buy is included in `markup` so `sell = buy + markup`. `isVisible` does not change the total (Split off absorbs the line into the total). Schemas for quote/catalog charge lines live in `@starboard/lib-contracts` (`surchargeLineSchema`). Persistence: ticket **065** (`quotes.surcharge`), **068** (`quotes.global_charge`), **071** (`quotes.lane.selected_rate_id`, `quotes.rate.base_mode`, `quotes.rate.equipment_amounts`). Amount engine: **066**. Row sell / Split / usage bounds: **072**.

## Fixtures

Under `packages/pricing/fixtures/`:

- `manual-rate-totals.json` — rewrite golden cases for lane totals
- `total-inclusion-test-cases.json` — copied from legacy `shared-fixtures/qv2`
- `surcharge-min-mechanics.json` — copied from legacy `shared-fixtures/qv2` (rows 1–10)
- `base-freight-row-identity.json` — copied from legacy `shared-fixtures/qv2` (SB-6190)
- `surcharge-amount-cases.json` — lean rewrite cases for unit / flat / % freight
- `global-scope-totals.json` — globals + door-bucket scope rollup cases
- `charge-line-economics.json` — lane markup (single-CT and mixed equipment), sell override, Split-off still in the total, Include off, free usage

## Schema push (surcharge tables)

```bash
pnpm --filter @starboard/lib-db db:push
```

Creates/updates `quotes.surcharge`, `quotes.global_charge`, and `rates.surcharge` (drizzle-kit push; no versioned SQL migrations).

## Deferred (named — not silent product cuts)

- FX converters / display-currency paths — still deferred after **072** (rows stay in the quote currency; no row FX popover)
- Full `surcharge_matrix.json` parity (tiers, dollar min/max beyond lean free/min/max usage) — cells left out
- **070** is the quote default: Incoterm × role excludes buckets. **068** door-only `deriveExcludedBuckets` remains in the package and is not used by the quote form. Globals (`source: global`) stay in the total. Deferred: trucking remaps and non-ocean incoterms.
- QV2 charge grid / rate alternatives / base flat·per-eq — **[071](../../tickets/done/071-quote-charge-table-prod-parity.md)** shipped
- Row economics — **[072](../../tickets/in_progress/072-quote-charge-line-economics-parity.md)** lean subset: editable buy rate, line `sellAmount`, Include, Split (`isVisible`, presentation only), `scopeOverride` when an Incoterm bucket is excluded, free/min/max. Deferred: a distinct markup dial per container type (the fixture uses one lane dial), surcharge-line equipment “default” column (`equipmentAmounts` stay on the rate), row FX
- Org settings rate-item admin stamp for globals

## Next tickets

Execution: [build-priority](../reference/build-priority-2026-11-01.md) — **071** and **070** shipped; **072** is the lean row-economics subset above. **073** mounts via quote-defined points. Spot quirks stay out of ONE MATH.
