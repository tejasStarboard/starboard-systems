# Domain: spot

|            |                                                                 |
| ---------- | --------------------------------------------------------------- |
| Service    | `services/spot` (Python + Temporal OSS)                         |
| Extensions | Host: `spot.fake`; carriers: `spot.maersk`, `spot.cma`, …       |
| Status     | Host online (`040`); Maersk online (`041`); CMA planned (`042`) |

## Owns

Carrier adapter host, credentials interface, queueing, normalization into rates/quote DTOs. Each carrier is a plugin with API and/or scraper strategies.

## Next tickets

[040](../../tickets/done/040-spot-extension-host.md), [041](../../tickets/in_progress/041-ext-spot-maersk.md), [042](../../tickets/todo/042-ext-spot-cma.md)
