# Rates catalog UX — 2026-11-03

**Product upgrade** of the Rates workbench activity to match starboard-2 **Rate Management** information architecture, plus a new **Spot search** entry. Catalog money/API semantics stay; chrome moves from a single flat “Rate catalog” list to a four-entry sidebar.

Tickets: [095](../../tickets/done/095-rates-catalog-ux-epic.md) (epic) · [096](../../tickets/todo/096-rates-activity-ia.md) · [097](../../tickets/todo/097-search-rates-ocean-fcl.md) · [098](../../tickets/todo/098-spot-search-standalone.md) · [099](../../tickets/todo/099-rate-sheets-and-sell-shell.md).

Domain: [rates.md](../domains/rates.md) · Priority: [build-priority](build-priority-2026-11-01.md) Phase F · ADR: [0006](../adr/0006-shell-built-ins-extensions.md) · Points: [extension-points.md](../extension-points.md).

---

## Problem

Rewrite `rates.catalog` today exposes one sidebar entry (“Rate catalog”) with generic CRUD and a separate `/rates/upload` ingest deep link. Production Rate Management uses **top tabs** — Search Rates, Rate Sheets, Sell Your Rates — with mode-specific search UIs and a sheet lifecycle. Spot rates are available on the quote Rates step but **not** as a standalone catalog search (prod Search Rates keeps spot off). Users need to find spot offers without opening a quote.

## Goals

1. Map prod top tabs into the **Rates activity left sidebar**: Search Rates · Rate Sheets · Sell Rates · **Spot search** (new).
2. Ship **Ocean FCL Search Rates** first (prod-shaped filters + results); other modes visible but disabled.
3. Evolve Rate Sheets toward upload + manage (status chips, sheet cards) via `rates.slots.ingestActions` / ingest jobs.
4. Sell Rates = **gated shell** only (marketplace Won’t/deferred).
5. Spot search = workbench editor **without** a quote document; keep `quoting.slots.rateSources` for apply-to-lane.
6. All UI in `rates.catalog` (and contributing extras) — no long-lived kernel `app/(app)/rates` product trees.

## Non-goals

- Full rate marketplace (buy/sell, listings, margin, seller stats)
- Ocean LCL / Drayage / Cartage / Air search backends (UI stubs only in 097)
- Pixel-perfect starboard-2 CSS
- Creating a quote from a Spot search row (follow-on)
- Dumping `../starboard-2` into feature chats — this doc + tickets are the brief

## Git

Normal program flow ([git-workflow.md](../git-workflow.md)):

| Rule            | Detail                                                    |
| --------------- | --------------------------------------------------------- |
| Base branch     | `origin/dev`                                              |
| Ticket branches | `git checkout --no-track -b {id} origin/dev` (e.g. `096`) |
| PR base         | **`dev` only**                                            |
| No exception    | Unlike quote-builder Phase E, **no** `quote-flow` branch  |

---

## Sidebar IA (Rates activity)

| Sidebar entry | viewType (approx) | Deep link (approx) | Slice |
| ------------- | ----------------- | ------------------ | ----: |
| Search Rates  | `rate.search`     | `/rates/search`    |   097 |
| Rate Sheets   | `rate.sheets`     | `/rates/sheets`    |   099 |
| Sell Rates    | `rate.sell`       | `/rates/sell`      |   099 |
| Spot search   | `rate.spotSearch` | `/rates/spot`      |   098 |

Avoid colliding with existing `/rates/upload` (ingest) and `/rates/catalog/:resourceId` (detail). IA shells land in **096**; fill Search / Spot / Sheets+Sell in later slices.

Current flat catalog list migrates under **Rate Sheets** (or a temporary “All rates” sub-entry) so CRUD is not orphaned.

```text
Rates activity
├── Search Rates     → FCL filters + results (097); mode tabs stub non-FCL
├── Rate Sheets      → upload + manage (099); ingestActions slot
├── Sell Rates       → gated marketplace shell (099)
└── Spot search      → standalone spot offers (098); rates.slots.spotSearch
```

---

## Prod UI summary (for implementers)

### Search Rates — shared chrome

- Title: “Search Rates” · subtitle about finding vendor rates across modes.
- **Mode selector** (horizontal icons): Ocean FCL · Ocean LCL · Drayage · Cartage · Air.
- Primary actions: **Search rates** · **Clear**. Optional “More filters” (via ports, transit) — lean/omit in first FCL slice.
- Results header: count · sort dropdown · Export (client sort first; export can be lean).

### Ocean FCL (097 scope)

- Fields: Origin port · Destination port · swap · Valid between · Equipment · Agent · Carrier · Document ID.
- Results columns: Lane · Agent · Carrier · Validity · Transit · equipment rate columns (20GP, 40GP, 40HC, …) · View.

### Ocean LCL / Drayage / Cartage / Air (stub only)

Documented so ModeTabs can match prod labels; **disabled** until later tickets:

| Mode    | Distinct filters (prod)                         | Distinct result columns (prod)           |
| ------- | ----------------------------------------------- | ---------------------------------------- |
| LCL     | Origin/dest port, validity, agent, carrier, doc | Per CBM                                  |
| Drayage | Port, address, equipment, agent, doc            | Equipment, Base, Fuel surcharge          |
| Cartage | Port, address, cargo size kg, service area      | Service, weight break, rate / kg         |
| Air     | Origin/dest airport, commodity, agent, airline  | Currency tiers (Min, Normal, +kg breaks) |

### Rate Sheets

- **Upload** dropzone (Excel / PDF / Word) — agent reads sheet into searchable rates.
- **Manage**: status chips All / In progress / Needs review / Saved · search file names · filters (agent, carrier, service, uploaded, validity, marketplace, document ID).
- **Cards**: filename, agent/carrier/service/upload meta, status (needs help / failed / repaired), overflow menu.

### Sell Your Rates

- Marketplace overview (“For sale on Starboard Marketplace”), FAQ / how-rates-look, seller stats.
- Prod shows **company not enabled** banner when selling is off — rewrite ships this gated shell only; **no** publish APIs (coverage: Won’t/deferred).

### Spot search (new vs prod Rate Management)

- Prod Search Rates does not surface spot; quote Rates step does via spot extras.
- Rewrite: dedicated Rates sidebar entry to query spot offers **without** a quote. Entitlements match spot-on-quote gates. Apply-to-lane remains on the quote document via `quoting.slots.rateSources`.

---

## Package model (ADR 0006)

|                  |                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| **Package / id** | **`rates.catalog`** (`@starboard/ext-rates-catalog`) — driving built-in                                 |
| **Defines**      | Existing `rates.slots.ingestActions`; add `rates.slots.spotSearch` (098)                                |
| **Contributes**  | Rates activity + four view entries + editors; still `quoting.slots.rateSources`                         |
| **Extras**       | `ingestion.fcl_v6` → ingestActions / sheets; `spot.*` → spotSearch + quote rateSources                  |
| **Unplug**       | Catalog off → no Rates activity/editors; quote loses catalog panel; spot quote path OK if spot still on |

Kernel: thin deep-link anchors only.

---

## Slice sequence

```text
095 epic (docs)
096 IA shells ──► 097 Search FCL
               ├──► 098 Spot search
               └──► 099 Rate Sheets manage + Sell gated shell
087 ingest Excel/PDF (done) ── soft-dep for richer 099 status
```

`096` before `097` / `098` / `099`. `097`–`099` may proceed in parallel after `096` if staffing allows; prefer Search then Spot then Sheets+Sell when serial.

---

## Out of scope (phase)

Air/LCL/drayage/cartage search APIs · marketplace publish · amendments · catalog schedule schema for ETD/ETA on catalog rows · RFQ email → draft quote.
