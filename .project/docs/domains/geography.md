# Domain: geography

|           |                                                          |
| --------- | -------------------------------------------------------- |
| Service   | `services/geography`                                     |
| Schema    | `geo.*`                                                  |
| Contracts | `@starboard/lib-contracts` geography                     |
| Status    | Currencies + facility gazetteer search; locations unused |

## Owns

Countries / states / cities (reference), **facilities** (UN/LOCODE and/or IATA gazetteer), currencies. Soft opaque codes only for quotes/rates/CRM — no cross-schema FKs.

## APIs

- `GET/POST /currencies` — list / ensure currency codes (service token)
- `GET /ports?q=` — search facilities by UN/LOCODE or IATA prefix, name, or alias (service token); empty `q` returns capped list. Response: `{ ports: FacilityOption[] }` (`value`, `label`, optional `types`, `country`)
- `GET /locations?q=` — search **places** (city/locality gazetteer) for quote pickup/delivery; min 2 chars. `?ids=` resolves soft ids to labels. Response: `{ locations: FormOption[] }` (`value` = place id, `label` e.g. `Mississauga, ON, CA`)
- `GET /health` — open

## Schema notes (ADR 0004)

- Master entity: `geo.facility` (replaced `geo.port`). No required zipcode or state/city FKs.
- At least one of `unlocode` / `iata` (DB check + `facilityInputSchema`).
- Country/subdivision remain reference tables for filters/display — not required FKs on every facility.
- `geo.address` / learned mappings deferred.

## Migration (007)

Early rewrite had seed-only `geo.port` data (required zip + state FK). **Clear-and-reseed:** drop `geo.port`, create `geo.facility`, run `pnpm --filter @starboard/lib-db db:push` then `db:seed`. Soft codes already stored on quotes/rates are unchanged.

### Neon (primary)

App `POSTGRES_URL` points at Neon. Facility search uses the seeded/imported `geo.facility` rows that fit Free tier. Full city-boundary / place dumps are not loaded on Neon.

Door pickup/delivery use **Google Places** (not a local gazetteer); snapshots persist on `quotes.lane.pickup_address` / `delivery_address`.

`createDb` uses **@neondatabase/serverless** for Neon hosts (override with `DATABASE_DRIVER=pg` if needed).

## Next tickets

Learned mappings, Elasticsearch (derived only), optional city-boundary cartage data deferred.
