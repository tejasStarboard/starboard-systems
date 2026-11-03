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
Search / Sheets / Sell / Spot editors and still contributes
`quoting.slots.rateSources` for apply-to-lane. It **defines**
`rates.slots.ingestActions` (**087** / `ingestion.fcl_v6` injects upload UI)
and `rates.slots.spotSearch` (**098** standalone offer UI; `spot.*` contribute
`rates.spotSource`). Kernel anchors only — no catalog product imports.

### Rates activity IA (Phase F — **095–099**)

Design: [rates-catalog-ux-2026-11-03.md](../reference/rates-catalog-ux-2026-11-03.md).

Prod Rate Management top tabs map to Rates **sidebar** entries (plus Spot):

| Entry        | Deep link (target) | Ticket |
| ------------ | ------------------ | -----: |
| Search Rates | `/rates/search`    |    097 |
| Rate Sheets  | `/rates/sheets`    |    099 |
| Sell Rates   | `/rates/sell`      |    099 |
| Spot search  | `/rates/spot`      |    098 |

IA shells landed in **096** (placeholders for Search / Sell / Spot; catalog
list CRUD under Rate Sheets). Detail editor stays `/rates/catalog/:id`. Upload
remains `/rates/upload` until fully folded into Sheets via `ingestActions`.
Sell Rates is a **gated shell** only (marketplace Won’t/deferred). Spot search
does **not** require a quote; quote apply path stays on `rateSources`.

**Done:** [097](../../tickets/done/097-search-rates-ocean-fcl.md) Search Rates FCL.
**In progress:** [098](../../tickets/in_progress/098-spot-search-standalone.md) Spot search.
Next: [099](../../tickets/todo/099-rate-sheets-and-sell-shell.md).

## Ingestion writes

Extension `ingestion.fcl_v6` (Temporal OSS workflow) POSTs rates with
`source: "ingestion"` after a blocking gate. Upload deep link remains
`/rates/upload` until fully moved into `rates.slots.ingestActions`.
