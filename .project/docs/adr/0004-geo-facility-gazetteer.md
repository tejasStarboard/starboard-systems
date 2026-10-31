# ADR 0004 — Geography facility gazetteer (not rigid hierarchy)

## Status

Accepted

## Context

Production Starboard (`starboard-2`) centers geography on `geo_ports` (facility gazetteer: UN/LOCODE, IATA, aliases, coords, ranking) and stores soft codes + labels on quotes — not hard FKs. It also duplicates identity in Elasticsearch and carries city-boundary / dual-source drift.

This monorepo’s early `geo.*` schema used a strict `country → state → city → port` tree with **required zipcode** on ports. That does not match freight master data (many LOCODEs have no zip; airports need IATA; admin1 is not universal) and fights how quote lanes already store opaque unlocodes (`quotes.lane.origin` etc.).

## Decision

1. **Master entity = facility** (table name `geo.facility` or evolved `geo.port`): optional `unlocode`, optional `iata`, `name`, `facility_types[]`, `country_code`, optional `admin1` / `city_name`, `aliases[]`, lat/lng, ranking flags (`is_primary`, TEU or equivalent later). Natural identity is the code(s), not a mandatory city FK.
2. **Country / subdivision** remain reference tables for filters and display — **not** required foreign keys on every facility.
3. **Door addresses** are a separate table (`geo.address`): street + lat/lng + optional nearest facility codes. Do not overload facility rows for door-to-door.
4. **Quotes, rates, CRM** keep **soft opaque codes + label snapshots** (no cross-schema FK to `geo.*`). Same soft-ID rule as today.
5. **Search** starts with Postgres (trigram / ILIKE; PostGIS later). Elasticsearch, if ever added, is a **derived** index — Postgres remains source of truth.
6. **Learned mappings** (`geo.learned_mapping`) come when ingestion/RFQ need human/AI confirmations — do not mutate facility rows from review events.
7. **Do not port** starboard-2 ES dual-write, carrier geo tables as the main model, or fat untyped JSONB location blobs without contracts.

## Consequences

- Ticket `003` ports API must be evolved (or replaced) to search facilities; migrate/drop required `zipcode` / required `stateId` on ports.
- Seed/import path can ingest UN/LOCODE (+ IATA) dumps into `facility` without inventing fake cities/zips.
- Spot / rates / quote pickers keep using unlocode/IATA strings via geography service contracts.
- Aligns with shell + Bun geography service ownership (`geo` schema).

## References

- Domain: `.project/docs/domains/geography.md`
- Ticket: `.project/tickets/in_progress/007-geo-facility-gazetteer.md`
- Runtime: `docs/architecture.md` (BFF soft IDs)
