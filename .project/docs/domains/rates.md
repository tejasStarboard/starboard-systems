# Domain: rates

|         |                                   |
| ------- | --------------------------------- |
| Service | `services/rates`                  |
| Schema  | `rates.*`                         |
| Status  | Live (catalog CRUD + soft-delete) |

## Owns

Normalized contract / ad-hoc rate catalog with validity windows. Soft port
UN/LOCODEs and CRM customer ids (opaque text, no cross-schema FKs). Written by
manual UI and by ingestion/spot extensions via `source` (HTTP into this
service — workers never dual-write `rates.*`).

## API

Default port: `3104` (`RATES_SERVICE_URL`).

Service-token + `X-Organization-Id`:

- `GET /rates` — list/search (`q`, `origin`, `destination`, `customerId`, `validAt`, `includeInactive`)
- `POST /rates` — create catalog rate (`isActive: true`)
- `GET /rates/:id` — get by id (org-scoped)
- `PATCH /rates/:id` — update fields and/or soft-delete (`isActive: false`) / reactivate
- `DELETE /rates/:id` — permanent delete

Default list excludes inactive rates. Apply-to-lane (quote sheet) uses the
default list, so deactivated rates do not appear.

BFF: `apps/web/lib/domain/rates/*`, `/api/rates`, `/api/rates/:rateId`.

Workbench: driving built-in **`rates.catalog`** contributes Rates activity +
list/detail editors (`/rates`, `/rates/catalog/:id`) and still contributes
`quoting.slots.rateSources` for apply-to-lane. It **defines**
`rates.slots.ingestActions` (stub host; **087** / `ingestion.fcl_v6` will
inject upload UI). Kernel anchors only — no catalog product imports.

## Ingestion writes

Extension `ingestion.fcl_v6` (Temporal OSS workflow) POSTs rates with
`source: "ingestion"` after a blocking gate. Upload deep link remains
`/rates/upload` until fully moved into `rates.slots.ingestActions`.
