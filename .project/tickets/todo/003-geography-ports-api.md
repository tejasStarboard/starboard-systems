---
id: 003
wave: 00-shell
title: Geography ports and locations API
status: open
depends_on: []
epic: SYS-GEO
docs:
  - .project/docs/domains/geography.md
  - docs/architecture.md
---

# Geography ports and locations API

## Goal

Expose ports (and basic location search) on `services/geography` using existing `geo.*` tables; wire contracts + web client so quote origin/destination can use structured ports instead of free text only.

## Non-goals

- Full geocoding / Google fallback
- OSM polygons / transit matrix
- Seed of entire UN/LOCODE world (minimal seed OK)

## Files to touch

- `packages/contracts` — port list/search schemas (`listPortsResponseSchema` may already exist)
- `packages/database` — confirm port/location schema
- `services/geography` — controller/service/DAO for ports (+ locations if trivial)
- `apps/web/lib/clients/geography-client.ts` + quote form pickers

## Acceptance criteria

- [ ] `GET` ports search (query string) behind service token
- [ ] Idempotent ensure/create not required for ports unless needed for seed
- [ ] Web can select a port and store opaque id/unlocode on the lane
- [ ] `/health` remains open; port routes require service token

## Fixtures / tests

- Contract parse test for response
- Service test with seeded ports

## Out of scope

Currency work (already done); CRM; ingestion geo-review
