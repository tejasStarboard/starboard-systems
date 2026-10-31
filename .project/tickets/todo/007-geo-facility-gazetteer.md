---
id: 007
wave: 00-shell
title: Geo facility gazetteer redesign
status: open
depends_on: [003]
epic: SYS-GEO
docs:
  - .project/docs/adr/0004-geo-facility-gazetteer.md
  - .project/docs/domains/geography.md
  - docs/architecture.md
---

# Geo facility gazetteer redesign

## Goal

Replace the rigid `country → state → city → port(+required zip)` model with a **facility gazetteer** aligned to ADR 0004: UN/LOCODE and/or IATA, name, facility types, country code, optional admin1/city, aliases, coordinates, ranking flags. Keep quote/rate soft codes (opaque unlocode strings). Evolve `services/geography` search + contracts; seed a minimal real facility set.

## Non-goals

- Elasticsearch index
- Full UN/LOCODE world dump in CI (subset seed OK; document import path)
- `geo.learned_mapping` / review UI (follow-up ticket)
- OSM city polygons / PostGIS polygons (points lat/lng enough for this ticket)
- Carrier-specific geo caches (Maersk/CMA tables)
- Changing quote lane column names beyond ensuring they still store soft codes + optional labels if already present

## Files to touch

- `packages/database/src/schema/geography.ts` — introduce `facility` (or evolve `port`); relax/remove required zip/state FKs; optional `address` table stub or defer address to follow-up if unused
- `packages/contracts/src/geography.ts` — facility search DTO (code, label, types, country)
- `services/geography` — DAO/search by unlocode/IATA/name/alias; keep currencies
- Seed script / SQL under `packages/database` for a small port+airport set
- `apps/web` geography client + quote port pickers if response shape changes
- `.project/docs/domains/geography.md` status

## Acceptance criteria

- [ ] ADR 0004 decisions reflected in schema (facility codes optional but at least one of unlocode/iata required in app validation)
- [ ] No required `zipcode` on ocean ports
- [ ] `GET /ports` (or `/facilities`) search returns facilities by code prefix and name; service-token protected
- [ ] Quote create/save still stores origin/destination as soft codes; BFF does not join across schemas
- [ ] Migration path documented: expand/contract from current `geo.port` (or clear-and-reseed if still empty of prod data)
- [ ] Domain doc updated; deprecations note if old city-required port shape is retired

## Fixtures / tests

- Contract tests for search response
- Service tests: find by unlocode, by IATA, org-irrelevant (geo is not tenant-scoped master data unless you add org overlays — default **global gazetteer**)

## Out of scope

CRM address books; door geocoding Google integration; learned mappings
