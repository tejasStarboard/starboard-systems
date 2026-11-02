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

| Export                      | Role                                                    |
| --------------------------- | ------------------------------------------------------- |
| `roundMoney`                | Half-up money rounding (default 2 dp)                   |
| `computeManualLaneTotals`   | Canonical `{ buy, markup, sell }` for manual rate lines |
| `calculateManualRateTotals` | UI alias `{ subtotal, markup, total }`                  |
| `isIncludedInTotal`         | Surcharge inclusion predicate (sell / buy / rollup_buy) |
| `deriveExcludedBuckets`     | Door presence → `origin` / `destination` exclusions     |
| `getEffectiveUsageAmount`   | free → min → max usage → billable qty                   |
| `calculateSurchargeAmount`  | Unit / flat / % of base freight → `{ buy, sell }`       |
| `isBaseFreightRow`          | Stamp or name-allowlist base-freight predicate          |
| `findBaseFreightRow`        | Elect base freight from a surcharge list                |

`computeManualLaneTotals` accepts optional `scope.excluded_buckets` and quote-level `globalCharges` (`source: "global"` — immune to bucket scope). Schemas for quote/catalog charge lines live in `@starboard/lib-contracts` (`surchargeLineSchema`). Persistence: ticket **065** (`quotes.surcharge`), **068** (`quotes.global_charge`). Amount engine: **066**.

## Fixtures

Under `packages/pricing/fixtures/`:

- `manual-rate-totals.json` — rewrite golden cases for lane totals
- `total-inclusion-test-cases.json` — copied from legacy `shared-fixtures/qv2`
- `surcharge-min-mechanics.json` — copied from legacy `shared-fixtures/qv2` (rows 1–10)
- `base-freight-row-identity.json` — copied from legacy `shared-fixtures/qv2` (SB-6190)
- `surcharge-amount-cases.json` — lean rewrite cases for unit / flat / % freight
- `global-scope-totals.json` — globals + door-bucket scope rollup cases

## Schema push (surcharge tables)

```bash
pnpm --filter @starboard/lib-db db:push
```

Creates/updates `quotes.surcharge`, `quotes.global_charge`, and `rates.surcharge` (drizzle-kit push; no versioned SQL migrations).

## Deferred (named — not silent product cuts)

- FX converters / display-currency paths → with **072** or follow-up
- Full `surcharge_matrix.json` parity (tiers, dollar min/max beyond lean) — document cells left out
- Full Incoterm × role matrix — **[070](../../tickets/todo/070-incoterm-bucket-scope.md)** (068 = door → bucket only; **product deviation until 070**)
- QV2 charge grid / rate alternatives / base flat·per-eq — **[071](../../tickets/todo/071-quote-charge-table-prod-parity.md)**
- Row economics (markup, sell, Split, guardrails) — **[072](../../tickets/todo/072-quote-charge-line-economics-parity.md)**
- Org settings rate-item admin stamp for globals

## Next tickets

Execution: [build-priority](../reference/build-priority-2026-11-01.md) — **071 → 070 → 072** (parity), then **073** mounts via quote-defined points. Spot quirks stay out of ONE MATH.
