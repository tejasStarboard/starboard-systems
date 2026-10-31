# Domain: spot

|            |                                                                |
| ---------- | -------------------------------------------------------------- |
| Service    | `extensions/spot` (Python + Temporal OSS)                      |
| Extensions | Host: `spot.fake`; carriers: `spot.maersk`, `spot.cma`, …      |
| Status     | Host online (`040`); Maersk online (`041`); CMA online (`042`) |

## Owns

Carrier adapter host, credentials interface, queueing, normalization into rates/quote DTOs. Each carrier is a plugin with API and/or scraper strategies.

## Credentials

Today Maersk/CMA credential ports read org maps from env (`SPOT_MAERSK_CREDENTIALS` / `SPOT_CMA_CREDENTIALS`). Target ([069](../../tickets/todo/069-org-carrier-credentials-settings.md)): org-scoped secret settings in the shell, **encrypted at rest** with an app secret (Better Auth–style), plus a post-save **per-carrier `validate`** (stub: ~5s → ok; real API/login probes with 062). Env remains a local/dev fallback.

## Next tickets

[069](../../tickets/todo/069-org-carrier-credentials-settings.md) org credentials → [062](../../tickets/todo/062-live-spot-strategies.md) live strategies. Done host plugins: [040](../../tickets/done/040-spot-extension-host.md), [041](../../tickets/done/041-ext-spot-maersk.md), [042](../../tickets/done/042-ext-spot-cma.md).
