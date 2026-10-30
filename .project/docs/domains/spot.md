# Domain: spot

|            |                                                                 |
| ---------- | --------------------------------------------------------------- |
| Service    | `services/spot` or `services/carriers` (Python + DBOS, planned) |
| Extensions | Per carrier: `spot.maersk`, `spot.cma`, …                       |
| Status     | Not started                                                     |

## Owns

Carrier adapter host, credentials interface, queueing, normalization into rates/quote DTOs. Each carrier is a plugin with API and/or scraper strategies.

## Next tickets

[040](../../tickets/todo/040-spot-extension-host.md), [041](../../tickets/todo/041-ext-spot-maersk.md), [042](../../tickets/todo/042-ext-spot-cma.md)
