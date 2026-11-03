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

| Export                                | Role                                                             |
| ------------------------------------- | ---------------------------------------------------------------- |
| `roundMoney`                          | Half-up money rounding (default 2 dp)                            |
| `computeManualLaneTotals`             | Canonical `{ buy, markup, sell }` for manual rate lines          |
| `calculateManualRateTotals`           | UI alias `{ subtotal, markup, total }`                           |
| `isIncludedInTotal`                   | Surcharge inclusion predicate (sell / buy / rollup_buy)          |
| `deriveExcludedBuckets`               | Legacy door presence helper (068). Quote UI no longer calls it   |
| `excludedBucketsForIncoterm`          | Incoterm × shipper/consignee → excluded buckets (070)            |
| `getEffectiveUsageAmount`             | free → min → max usage → billable qty                            |
| `calculateSurchargeAmount`            | Unit / flat / % of base freight → `{ buy, sell }`                |
| `isBaseFreightRow`                    | Stamp or name-allowlist base-freight predicate                   |
| `findBaseFreightRow`                  | Elect base freight from a surcharge list                         |
| `tryGetFxRate` / `tryConvertCurrency` | Quote FX lookup + convert (085; starboard-2 port)                |
| `mergeBaseFxRates`                    | Merge live Frankfurter rates into `exchangeRates` base row (093) |
| `surchargeAppliesToEquipment`         | Default vs CT filter for surcharge lines                         |

`computeManualLaneTotals` accepts optional `scope.excluded_buckets`, quote-level `globalCharges`, `quoteCurrency`, and `fxRates`. The quote UI passes **one** selected rate line. `baseMode: "per_eq"` with `equipmentAmounts` prices each CT like starboard-2 (`unit buy + dial` × count); surcharge `equipmentType` filters per CT. Flat / no-equipment keeps one lane dial on the rolled buy. A finite `sellAmount` replaces that row’s calculated sell; the gap vs buy is included in `markup` so `sell = buy + markup`. `isVisible` does not change the total. Schemas: `@starboard/lib-contracts` (`surchargeLineSchema`). Live FX (**093**): Frankfurter rates (`1 base = rate × code`, fetched server-side by geography) land in `exchangeRates[base]`; `tryGetFxRate` uses the inverse for `line → base`, so no second totals engine and no invented rates (missing → existing missing-FX behavior). Persistence: **065** / **068** / **071** / **085** (`equipment_type`, `exchange_rates`, per-CT dial fields on `equipment_amounts`).

## Fixtures

Under `packages/pricing/fixtures/`:

- `manual-rate-totals.json` — rewrite golden cases for lane totals
- `total-inclusion-test-cases.json` — copied from legacy `shared-fixtures/qv2`
- `surcharge-min-mechanics.json` — copied from legacy `shared-fixtures/qv2` (rows 1–10)
- `base-freight-row-identity.json` — copied from legacy `shared-fixtures/qv2` (SB-6190)
- `surcharge-amount-cases.json` — lean rewrite cases for unit / flat / % freight
- `global-scope-totals.json` — globals + door-bucket scope rollup cases
- `charge-line-economics.json` — per-CT dials, equipmentType filter, row FX, sell override, Split / Include / free usage

## Schema push (surcharge tables)

```bash
pnpm --filter @starboard/lib-db db:push
```

Creates/updates `quotes.surcharge`, `quotes.global_charge`, and `rates.surcharge` (drizzle-kit push; no versioned SQL migrations).

## Deferred (named — not silent product cuts)

- Full `surcharge_matrix.json` parity (tiers, dollar min/max beyond lean free/min/max usage) — cells left out
- **070** is the quote default: Incoterm × role excludes buckets. **068** door-only `deriveExcludedBuckets` remains in the package and is not used by the quote form. Globals (`source: global`) stay in the total. Deferred: trucking remaps and non-ocean incoterms.
- QV2 charge grid / rate alternatives / base flat·per-eq — **[071](../../tickets/done/071-quote-charge-table-prod-parity.md)** shipped
- Row economics — **[072](../../tickets/done/072-quote-charge-line-economics-parity.md)** + **[085](../../tickets/in_progress/085-qv2-money-follow-ons-charges.md)**: multi-CT FCL prices each CT like starboard-2 `deriveFclRateTotals` (unit × count) with per-CT dials on `equipmentAmounts`; surcharge `equipmentType` (Default vs CT); row FX via quote `exchangeRates` (`tryConvertCurrency`). Still deferred: full finStore live FX / frozen-send corpus, CT-filtered global replication quirks, surcharge_matrix tiers
- Org settings rate-item admin stamp for globals

## Next tickets

Execution: [build-priority](../reference/build-priority-2026-11-01.md) — **085** money follow-ons in `quoting.charges` / markup. Spot quirks stay out of ONE MATH.
