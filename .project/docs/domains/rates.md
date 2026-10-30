# Domain: rates

|         |                                |
| ------- | ------------------------------ |
| Service | `services/rates`               |
| Schema  | `rates.*`                      |
| Status  | Live (catalog create/list/get) |

## Owns

Normalized contract / ad-hoc rate catalog with validity windows. Soft port
UN/LOCODEs and CRM customer ids (opaque text, no cross-schema FKs). Written by
manual UI (and later by ingestion/spot extensions via `source`).

## API

Default port: `3104` (`RATES_SERVICE_URL`).

Service-token + `X-Organization-Id`:

- `GET /rates` — list/search (`q`, `origin`, `destination`, `customerId`, `validAt`)
- `POST /rates` — create catalog rate
- `GET /rates/:id` — get by id (org-scoped)

BFF: `apps/web/lib/clients/rates-client.ts`, `/api/rates`, quote
`RatesSearchSheet` lists matches for the selected lane.

## Next tickets

[021](../../tickets/todo/021-ext-ingestion-fcl-v6.md) (writes via ingestion)
