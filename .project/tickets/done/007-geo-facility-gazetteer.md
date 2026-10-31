---
id: 007
wave: 00-shell
title: Geo facility gazetteer redesign
status: done
depends_on: [003]
epic: SYS-GEO
docs:
  - .project/docs/adr/0004-geo-facility-gazetteer.md
  - .project/docs/domains/geography.md
  - docs/architecture.md
---

# Geo facility gazetteer redesign

## Goal

Replace the rigid `country → state → city → port(+required zip)` model with a **facility gazetteer** aligned to ADR 0004: UN/LOCODE and/or IATA, name, facility types, country code, optional admin1/city, aliases, coordinates, ranking flags. Keep quote/rate soft codes (opaque unlocode/IATA strings). Evolve `@starboard/svc-geography` search + contracts; seed a minimal real facility set.

Also delivered with this ticket: Google Places door pickup/delivery on quote lanes (denormalized `DoorAddress` JSON), quote form UX hardening (no SSR port seed; port combobox client search with debounce/abort/loading spinner; stable money formatting), and package naming/layout hygiene tied to the geography cutover.

## Non-goals

- Elasticsearch index
- Full UN/LOCODE world dump in CI (subset seed OK; document import path)
- `geo.learned_mapping` / review UI (follow-up ticket)
- OSM city polygons / PostGIS polygons (points lat/lng enough for this ticket)
- Carrier-specific geo caches (Maersk/CMA tables)
- Changing quote lane column names beyond soft codes + door address JSON fields

## What shipped

- `geo.facility` gazetteer schema + seed; `GET /ports` fuzzy search (pg_trgm; code-first fast path)
- Contracts: facility options + `DoorAddress` for lane pickup/delivery
- Quote port pickers via client `/api/geography/ports` (debounced); address combobox via Places
- BFF does not join across schemas; soft codes + door snapshots only
- Domain doc / ADR / deprecations updated; monorepo `tooling/` + `extensions/` + `@starboard/{app,lib,svc,ext,tool}-*` naming

## Files touched (high level)

- `packages/database` — `facility` schema + seed
- `packages/contracts` — geography + door-address
- `services/geography` — DAO/search, Places integration, auth on `/ports` + `/addresses`
- `apps/web` — geography client, port/address comboboxes, quote lane fields, form options
- `.project/docs/domains/geography.md`, ADR 0004, deprecations

## Acceptance criteria

- [x] ADR 0004 decisions reflected in schema (facility codes optional but at least one of unlocode/iata required in app validation)
- [x] No required `zipcode` on ocean ports
- [x] `GET /ports` search returns facilities by code prefix and name; service-token protected
- [x] Quote create/save still stores origin/destination as soft codes; BFF does not join across schemas
- [x] Migration path documented: clear-and-reseed / expand from `geo.port` (see domain doc + deprecations)
- [x] Domain doc updated; deprecations note if old city-required port shape is retired
- [x] Door Addresses via Google Places persisted on lanes; port combobox debounced with loading state

## Fixtures / tests

- Contract tests for search response
- Service tests: find by unlocode, by IATA, fuzzy name stand-in; Places mocked; geo is global (not tenant-scoped)

## Out of scope (remaining)

CRM address books; learned mappings; full UN/LOCODE import pipeline UI
