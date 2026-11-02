# Domain: quotes

|           |                                                                |
| --------- | -------------------------------------------------------------- |
| Service   | `services/quotes`                                              |
| Schema    | `quotes.*`                                                     |
| Contracts | `@starboard/lib-contracts` quotes                              |
| Status    | Partial — header + lanes/cargo/rates + surcharge lines persist |

## Owns

Quote aggregate: header, lanes, cargo, selected rates, charge lines under rates, stages, validity, numbering.

## Does not own

Pricing math (`packages/pricing`), geography resolution, CRM customer records, spot fetch, rate-doc ingest.

## Rates + surcharges

Each lane stores `manualRates: ManualRateLine[]` (`label` + `amount` + nested `surcharges`). Quote also stores `globalCharges` (quote-level). Persist shape:

- `quotes.rate` — base rate line (label/amount)
- `quotes.surcharge` — lean charge rows FK → `quotes.rate` (`leg`, `usage_unit`, rate / rate_percentage, inclusion flags, usage bounds, buy/sell amounts)
- `quotes.global_charge` — quote-level charges (`source: global`); immune to door bucket scope

Save path is still full lane-tree replace (`replaceLanes`, which also replaces globals); deleting a lane cascades rates → surcharges.

### Schema push

After pulling schema changes:

```bash
pnpm --filter @starboard/lib-db db:push
```

`quotes` is in drizzle `schemaFilter`. Tables: `quotes.surcharge`, `quotes.global_charge`. No checked-in SQL migrations — push is the path (same as CI `db:push:ci`).

## Apply rate → lane

From `RatesSearchSheet`, catalog rows and completed spot offers **Apply to lane** by appending a `ManualRateLine` (`label` + `amount` + nested `surcharges` when the source has charge lines) on the active lane. Totals use `@starboard/lib-pricing` (base + included surcharge amounts by unit / % freight + globals; door absence excludes origin/destination buckets); persist via existing quote save (no catalog/spot FK on `quotes.rate`). Spot UI only when active spot sources are present; catalog + manual surcharge editing work with extensions off.

## Product model

Quote UI/data activation is the driving built-in **`quoting.document`** (not kernel). It **defines** extension points (`quoting.slots.*`, menus) that charges / Incoterm / markup / spot contribute into — [extension-points.md](../extension-points.md), [ADR 0006](../adr/0006-shell-built-ins-extensions.md).

## Product parity (refactor rule)

Match **starboard-2 QV2** quote money UX/semantics. Architecture may differ (ONE MATH package, `global_charge` table); **user-visible behavior must not**. Silent simplifications are bugs until ticketed.

## Current gaps (vs prod QV2)

See [build-priority](../reference/build-priority-2026-11-01.md) · [migration inventory](../reference/extension-migration-inventory-2026-11-02.md).

**Phase A:** workbench (**074**) → host (**075**) → scaffold (**076**) → migrate quote (**077**) → slots (**073**).  
**Phase B:** charge grid (**071**) → Incoterm (**070**) → economics (**072**).

Also: no quote stages/PDF/delete yet; no catalog/spot provenance FK.

## Next tickets

After money + workbench wiring: quote stages / validity / PDF.
