# Roadmap

Lexical order under [../tickets/todo/](../tickets/todo/) is execution order. Move tickets through `todo/` → `in_progress/` → `done/`.

Cursor skills: [../../.agents/README.md](../../.agents/README.md).

**Priority:** harden the **extension foundation** ([ADR 0005](adr/0005-extension-foundation.md)) before more product extensions or quote-loop features that depend on contribution/job patterns.

## Wave 0 — Shell foundation

| Ticket                                                  | Title                                      | Status |
| ------------------------------------------------------- | ------------------------------------------ | ------ |
| [001](../tickets/done/001-extension-host-skeleton.md)   | Extension host skeleton                    | done   |
| [002](../tickets/done/002-quote-lane-persistence.md)    | Quote lane/cargo/rate persistence          | done   |
| [003](../tickets/done/003-geography-ports-api.md)       | Geography ports/locations API              | done   |
| [004](../tickets/done/004-crm-under-org.md)             | CRM under Better Auth org                  | done   |
| [005](../tickets/done/005-billing-plan-stubs.md)        | Billing plan stubs (credit + enterprise)   | done   |
| [006](../tickets/done/006-fix-ui-phosphor-typecheck.md) | Fix UI Phosphor icons / full typecheck     | done   |
| [007](../tickets/done/007-geo-facility-gazetteer.md)    | Geo facility gazetteer redesign (ADR 0004) | done   |

## Wave 1 — Quoting / pricing

| Ticket                                         | Title                       | Status |
| ---------------------------------------------- | --------------------------- | ------ |
| [010](../tickets/done/010-packages-pricing.md) | `packages/pricing` ONE MATH | done   |

## Wave 2–4 — Extension vertical stubs (thin)

| Ticket                                                                | Title                          | Status |
| --------------------------------------------------------------------- | ------------------------------ | ------ |
| [020](../tickets/done/020-services-rates.md)                          | `services/rates` catalog       | done   |
| [021](../tickets/done/021-ext-ingestion-fcl-v6.md)                    | Extension `ingestion.fcl_v6`   | done   |
| [030](../tickets/done/030-ext-messaging-msgraph.md)                   | Extension `messaging.msgraph`  | done   |
| [040](../tickets/done/040-spot-extension-host.md)                     | Spot extension host            | done   |
| [041](../tickets/done/041-ext-spot-maersk.md)                         | Extension `spot.maersk`        | done   |
| [042](../tickets/done/042-ext-spot-cma.md)                            | Extension `spot.cma`           | done   |
| [050](../tickets/done/050-platform-admin-extensions-impersonation.md) | Platform admin + impersonation | done   |

## Wave 5 — Extension foundation (CURRENT)

| Ticket                                                           | Title                                                | Status      |
| ---------------------------------------------------------------- | ---------------------------------------------------- | ----------- |
| [055](../tickets/done/055-extension-foundation-hardening.md)     | Extension foundation hardening (UI / BFF / Temporal) | done        |
| [056](../tickets/in_progress/056-extension-dev-workflow-docs.md) | Extension developer cookbook + skill sync            | in_progress |
| [057](../tickets/todo/057-extension-settings-schema.md)          | Extension settings schema + persistence              | open        |
| [058](../tickets/todo/058-admin-extension-settings-ui.md)        | Admin collapsible extension settings UI              | open        |

## Next product wave (after Wave 5)

**Depends on 055 + 056** (hardened host + developer cookbook). Draft only — create tickets when foundation lands:

- Apply catalog/spot rate → quote lane (+ pricing)
- Messaging production path (real Graph OAuth + Neon)
- Settings / team shell pages
- CRM contacts + richer customer fields
- Live spot strategies; Excel/PDF ingest
- Further ingest modes as separate extensions

## Later

- Outlook add-in / Gmail / Companion
- Public API, ML, admin node-graph, ERP/OS
