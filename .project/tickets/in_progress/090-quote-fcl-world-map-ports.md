---
id: 090
wave: 08-quote-builder-ux
title: FCL world-map seaport picker + geo lat/lng country filter
status: in_progress
depends_on: [089, 007, 003]
epic: SYS-QUOTE-UX
docs:
  - .project/docs/reference/quote-builder-ux-2026-11-03.md
  - .project/docs/domains/geography.md
  - .project/docs/domains/quotes.md
  - .project/docs/extension-points.md
  - .project/docs/git-workflow.md
---

# FCL world-map seaport picker + geo lat/lng country filter

## Git

| Rule    | Detail                                                                   |
| ------- | ------------------------------------------------------------------------ |
| Base    | `origin/quote-flow` — `git checkout --no-track -b 090 origin/quote-flow` |
| PR      | Into **`quote-flow` only**                                               |
| Landing | No direct commits on `quote-flow`                                        |

## Extension model

|                 |                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Packages**    | **`geo.gazetteer`** (port/map UI + API client) contributing into document Route step; geography service contracts |
| **Layer**       | Built-in geo + `quoting.document` Route step host                                                                 |
| **Defines**     | Optional `quoting.slots.laneRoute` if map should be a contribution point                                          |
| **Contributes** | Map + country→seaport flow into Route step (FCL only)                                                             |
| **Unplug test** | Geo off / map contribution off → Route step falls back to `PortCombobox`                                          |
| **Math**        | N/A                                                                                                               |

## Goal

1. **Geography API / contracts:** expose `latitude` / `longitude` on port search hits; add **country** filter (`GET /ports?country=XX` and/or scoped `q`). Data already on `geo.facility`.
2. **FCL Route step:** stylized world map (animated imitation). Hover country → highlight; click → searchable seaport combobox for that country. Selected countries highlighted; curve joins origin/destination.
3. After both ports: zoom/pan so both countries fit; reveal origin-via / destination-via; if lat/lng present, draw port→via→port curve with via checkpoints.
4. Door pickup/delivery remain available (collapsed). Always keep **Find port** search fallback.
5. **LCL / Air:** keep existing `PortCombobox` (no map).

## Non-goals

- GIS-accurate routing / real shipping lanes
- Air/LCL map
- Changing UNLOCODE persistence on the lane

## Files to touch (approx)

- `packages/contracts` geography — `FacilityOption` + ports query schema
- `services/geography` DAO/controller — country filter + lat/lng in response
- BFF `apps/web/app/api/geography/ports`
- `extensions/builtins/geo-gazetteer` — map component + PortCombobox country mode
- `quoting-document` Route step host wiring
- Optional map dependency (e.g. topojson / world-atlas) in the geo package only

## Acceptance

- [ ] Port search returns lat/lng when stored; `country` filter returns seaports for that country
- [ ] FCL: map country → port selection sets lane origin/destination; curve + zoom behavior per design doc
- [ ] Vias appear after both ports; curve updates when vias + coords exist
- [ ] LCL/Air unchanged (combobox); Find port fallback works on FCL
- [ ] Branch from `quote-flow`; PR targets `quote-flow`; `pnpm run ci` green

## Out of scope

Rate cards; live preview; catalog schedule fields; merge to `dev`
