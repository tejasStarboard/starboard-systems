# Domain: geography

|           |                                                          |
| --------- | -------------------------------------------------------- |
| Service   | `services/geography`                                     |
| Schema    | `geo.*`                                                  |
| Contracts | `@starboard/contracts` geography                         |
| Status    | Currencies + facility gazetteer search; locations unused |

## Owns

Countries / states / cities (reference), **facilities** (UN/LOCODE and/or IATA gazetteer), currencies. Soft opaque codes only for quotes/rates/CRM — no cross-schema FKs.

## APIs

- `GET/POST /currencies` — list / ensure currency codes (service token)
- `GET /ports?q=` — search facilities by UN/LOCODE or IATA prefix, name, or alias (service token); empty `q` returns capped list. Response: `{ ports: FacilityOption[] }` (`value`, `label`, optional `types`, `country`)
- `GET /health` — open

## Schema notes (ADR 0004)

- Master entity: `geo.facility` (replaced `geo.port`). No required zipcode or state/city FKs.
- At least one of `unlocode` / `iata` (DB check + `facilityInputSchema`).
- Country/subdivision remain reference tables for filters/display — not required FKs on every facility.
- `geo.address` / learned mappings deferred.

## Migration (007)

Early rewrite had seed-only `geo.port` data (required zip + state FK). **Clear-and-reseed:** drop `geo.port`, create `geo.facility`, run `pnpm --filter @starboard/db db:push` then `db:seed`. Soft codes already stored on quotes/rates are unchanged.

### Import path (later)

Ingest UN/LOCODE (+ IATA) dumps into `geo.facility` without inventing fake cities/zips. Do not load a full world dump in CI — keep a small seed set.

## Next tickets

Door addresses, learned mappings, Elasticsearch (derived only) deferred.
