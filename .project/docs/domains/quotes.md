# Domain: quotes

|           |                                                                  |
| --------- | ---------------------------------------------------------------- |
| Service   | `services/quotes`                                                |
| Schema    | `quotes.*`                                                       |
| Contracts | `@starboard/lib-contracts` quotes                                |
| Status    | Partial — header + lanes/cargo/rates persist; catalog/spot apply |

## Owns

Quote aggregate: header, lanes, cargo, selected rates, stages, validity, numbering.

## Does not own

Pricing math (`packages/pricing`), geography resolution, CRM customer records, spot fetch, rate-doc ingest.

## Apply rate → lane

From `RatesSearchSheet`, catalog rows and completed spot offers **Apply to lane** by appending a `ManualRateLine` (`label` + `amount`) on the active lane. Totals use `@starboard/lib-pricing`; persist via existing quote save (no catalog/spot FK on `quotes.rate`). Spot UI only when active spot sources are present; catalog path works with extensions off.

## Current gaps

- No status-transition rules, delete, PDF, email send
- No provenance link from lane rate back to catalog/spot offer id
- Geography doors via Places (007); facility gazetteer still evolving

## Next tickets

Wave 6 product backlog (`060+`); surcharge model (`065`–`068`).
