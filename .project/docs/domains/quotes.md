# Domain: quotes

|           |                                                              |
| --------- | ------------------------------------------------------------ |
| Service   | `services/quotes`                                            |
| Schema    | `quotes.*`                                                   |
| Contracts | `@starboard/contracts` quotes                                |
| Status    | Partial — header CRUD works; lanes/cargo/rates not persisted |

## Owns

Quote aggregate: header, lanes, cargo, selected rates, stages, validity, numbering.

## Does not own

Pricing math (`packages/pricing`), geography resolution, CRM customer records, spot fetch, rate-doc ingest.

## Current gaps

- `findFormValues` returns empty lane; `save` drops lanes
- No status-transition rules, delete, PDF, email send
- Rate search UI stub

## Next tickets

[002](../../tickets/todo/002-quote-lane-persistence.md), [010](../../tickets/todo/010-packages-pricing.md)
