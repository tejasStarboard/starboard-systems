# Deprecations — do not port

Anything listed here must not appear as tickets or PRs without an explicit orchestrator decision to revive it.

| Legacy (starboard-2)                                                | Status                                                                                                     |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Ocean FCL v3 / v4 / v5 (+ frozen v5-inside-v6 copy as a dependency) | **Dead** — only a clean `ingestion.fcl_v6` extension                                                       |
| `parsers/ocean/` legacy Excel/PDF/LCL                               | **Dead**                                                                                                   |
| `rfq/` (pre-qv2)                                                    | **Dead** — quotes domain only                                                                              |
| `air/` v1                                                           | **Dead** — if air returns, use air_v2 concepts as its own extension                                        |
| Dual / triple pricing twins (Python ↔ webapp ↔ add-in)              | **Dead** — `packages/pricing` once                                                                         |
| Legacy `job_scheduler` / non-Temporal queues                        | **Dead** — Temporal OSS for async extension workflows ([ADR 0002](adr/0002-python-temporal-extensions.md)) |
| Modeling CRM customers as Better Auth organizations                 | **Dead** — org = tenant; CRM rows belong to org                                                            |
| FCL v6 “includes” LCL/air/cartage                                   | **False** — those are separate pipelines → separate extensions later                                       |
| Rigid `geo.port` with required zipcode + state/city FKs             | **Dead** — facility gazetteer (`geo.facility`, ADR 0004); soft codes on quotes/rates                       |

## Deferred (not deprecated)

| Item                                      | Notes                                  |
| ----------------------------------------- | -------------------------------------- |
| FFW OS (shipments, AR/AP, e-manifest)     | After quoting core                     |
| Public API                                | Later                                  |
| Admin node-graph command center           | After extension registry exists        |
| Outlook / Gmail add-in hosts              | After shell + MS Graph messaging       |
| Companion desktop                         | After spot host                        |
| Auto-margin / rate-choice / freight index | Optional intelligence extensions later |
