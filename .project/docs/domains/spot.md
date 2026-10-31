# Domain: spot

|            |                                                                                         |
| ---------- | --------------------------------------------------------------------------------------- |
| Service    | `extensions/spot` (Python + Temporal OSS)                                               |
| Extensions | Host: `spot.fake`; carriers: `spot.maersk`, `spot.cma`, …                               |
| Status     | Host online (`040`); Maersk online (`041`); CMA online (`042`); live strategies (`062`) |

## Owns

Carrier adapter host, credentials interface, queueing, normalization into rates/quote DTOs. Each carrier is a plugin with API and/or scraper strategies.

## Live strategies (062)

Platform admin `live_strategy` (default false) on `spot.maersk` / `spot.cma` is forwarded on the job body as `liveStrategy`. When false/unset, plugins use recorded fixtures. When true, `LiveOfferStrategy` calls carrier HTTPS endpoints (`httpx`; base URL overridable via `SPOT_MAERSK_API_BASE_URL` / `SPOT_CMA_API_BASE_URL`). CI mocks HTTP — no live network. Camoufox / proxy pools remain out of scope.

Structured carrier failures return as activity `{ rates: [], error: { code, message } }` (e.g. `carrier_error`, `missing_credentials`); fixture path behavior is unchanged when live is off.

## Credentials

Today Maersk/CMA credential ports read org maps from env (`SPOT_MAERSK_CREDENTIALS` / `SPOT_CMA_CREDENTIALS`). Target ([069](../../tickets/todo/069-org-carrier-credentials-settings.md)): org-scoped secret settings in the shell, **encrypted at rest** with an app secret (Better Auth–style), plus a post-save **per-carrier `validate`** (stub: ~5s → ok; real API/login probes can reuse live clients). Env remains a local/dev fallback.

## Next tickets

[069](../../tickets/todo/069-org-carrier-credentials-settings.md) org credentials (settings-backed ports). Done: [040](../../tickets/done/040-spot-extension-host.md), [041](../../tickets/done/041-ext-spot-maersk.md), [042](../../tickets/done/042-ext-spot-cma.md), [062](../../tickets/in_progress/062-live-spot-strategies.md) live strategies.
