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

Each lane stores `manualRates: ManualRateLine[]` (`label` + `amount` + nested `surcharges`). Persist shape:

- `quotes.rate` — base rate line (label/amount)
- `quotes.surcharge` — lean charge rows FK → `quotes.rate` (`leg`, `usage_unit`, rate / rate_percentage, inclusion flags, usage bounds, buy/sell amounts)

Save path is still full lane-tree replace (`replaceLanes`); deleting a lane cascades rates → surcharges.

### Schema push

After pulling schema changes:

```bash
pnpm --filter @starboard/lib-db db:push
```

`quotes` is in drizzle `schemaFilter`. New table: `quotes.surcharge`. No checked-in SQL migrations — push is the path (same as CI `db:push:ci`).

## Apply rate → lane

From `RatesSearchSheet`, catalog rows and completed spot offers **Apply to lane** by appending a `ManualRateLine` (`label` + `amount`) on the active lane. Totals use `@starboard/lib-pricing`; persist via existing quote save (no catalog/spot FK on `quotes.rate`). Spot UI only when active spot sources are present; catalog path works with extensions off. Mapping source charge lines into nested surcharges is ticket **067**.

## Current gaps

- No status-transition rules, delete, PDF, email send
- No provenance link from lane rate back to catalog/spot offer id
- Geography doors via Places (007); facility gazetteer still evolving
- Surcharge amount engine (**066**) and quote UI (**067**) not wired yet

## Next tickets

Surcharge engine/UI/globals (`066`–`068`).
