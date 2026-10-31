# Domain: quotes

|           |                                                     |
| --------- | --------------------------------------------------- |
| Service   | `services/quotes`                                   |
| Schema    | `quotes.*`                                          |
| Contracts | `@starboard/lib-contracts` quotes                       |
| Status    | Partial — header + lanes/cargo/manual rates persist |

## Owns

Quote aggregate: header, lanes, cargo, selected rates, stages, validity, numbering.

## Does not own

Pricing math (`packages/pricing`), geography resolution, CRM customer records, spot fetch, rate-doc ingest.

## Current gaps

- No status-transition rules, delete, PDF, email send
- Rate search UI stub (manual rates on lane persist)
- Geography pickup/delivery still opaque strings (ticket 003)

## Next tickets

[010](../../tickets/todo/010-packages-pricing.md)
