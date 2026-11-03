# Quote builder UX — 2026-11-03

**Product redesign** of the quote editor chrome and flow. Money semantics, ONE MATH, and extension slots stay; the form becomes a multistep builder with live PDF/email preview.

Tickets: [088](../../tickets/done/088-quote-builder-ux-epic.md) (epic) · [089](../../tickets/todo/089-quote-builder-multistep-shell.md) · [090](../../tickets/todo/090-quote-fcl-world-map-ports.md) · [091](../../tickets/todo/091-quote-rate-cards.md) · [092](../../tickets/todo/092-quote-live-pdf-email-preview.md).

Domain: [quotes.md](../domains/quotes.md) · Geography: [geography.md](../domains/geography.md) · Priority: [build-priority](build-priority-2026-11-01.md) Phase E.

---

## Problem

The current quote editor (`quoting.document`) is a single long page: ports, cargo, rates sheet, and charge grid compete for attention. The customer-facing artifact is a **PDF or email draft**, so the UI should feel like composing that artifact (Sejda-style live canvas), not dense CRUD.

## Goals

1. Progressive disclosure via a **5-step** flow (Basics → Route → Cargo → Rates → Build).
2. Continuous **PDF | Email** preview while building (debounced).
3. **FCL ocean** route step: stylized world map → country → seaport combobox; vias + port–port curve when lat/lng exist.
4. **Uber-style rate cards** with carrier logo fallback and schedule chips when data exists.
5. Keep work in built-ins / contributions — no long-lived kernel `app/(app)/…` product trees.

## Non-goals

- Pixel-perfect prod QV2 clone
- GIS-accurate routing / real nautical paths
- Air / LCL map (keep `PortCombobox`)
- Outlook/Gmail send (RFQ / messaging later)
- Carrier logo CDN productization beyond simple assets + monogram fallback
- Catalog schedule schema expansion (separate ticket if product requires ETD/ETA on catalog rows)
- Silent money/behavior changes (Incoterm, charge economics, stage gates unchanged)

---

## Git integration branch (`quote-flow`)

Program default remains PR → `dev` ([git-workflow.md](../git-workflow.md)). **This epic is an exception:**

| Rule | Detail |
|------|--------|
| Integration branch | `quote-flow` — long-lived feature branch off `dev` |
| Ticket branches | `git checkout --no-track -b {id} origin/quote-flow` (e.g. `089`) |
| PR base | **`quote-flow` only** — never open slice PRs to `dev` / `main` |
| Landing | **No direct commits / pushes to `quote-flow`**. Every change lands via PR + review/CI |
| Promote to `dev` | Separate PR `quote-flow` → `dev` when the epic is ready — not per-slice |

---

## Layout principle (all steps)

- **Left / main:** focused step controls (one job).
- **Right (desktop ≥ lg):** sticky **Preview pane** — tabs `PDF` | `Email`, Sejda-like document frame; updates as form state changes (debounce ~300ms). Tablet/mobile: bottom sheet or step-end preview toggle.
- **Top:** compact stepper (`Basics → Route → Cargo → Rates → Build`) + quote ID / stage / validity (`quoting.slots.lifecycle`) + Save.
- **Lane strip:** keep multi-lane; each lane walks Steps 2–5 independently; Step 1 is quote-level.

```text
┌─────────────────────────────────────────────────────────────┐
│ [Basics] [Route] [Cargo] [Rates] [Build]   ID · stage · Save │
├──────────────────────────────┬──────────────────────────────┤
│ Step controls                │ Preview  [PDF] [Email]       │
│ (one job)                    │  ┌────────────────────────┐  │
│                              │  │  document frame        │  │
│                              │  └────────────────────────┘  │
└──────────────────────────────┴──────────────────────────────┘
```

---

## Step flow

### Step 1 — Basics (quote-level)

Customer, currency, Incoterm/role (existing slots), optional notes. No ports. Preview shows branded letterhead + customer/currency skeleton.

### Step 2 — Route

**FCL ocean (map — ticket 090):**

1. Stylized world map (animated imitation, not GIS-accurate). Hover country → highlight; click → popover **combobox of seaports in that country** (searchable). Selected origin/destination countries stay highlighted; a **great-circle-style curve** joins them.
2. After both ports set: **zoom/pan** so both countries fit; rest overflows.
3. Reveal **Origin via / Destination via** comboboxes. If lat/lng available, redraw curve **port → via → port** with via checkpoints.
4. Optional door: Pickup / Delivery under collapsed “Door moves” (`AddressCombobox`).
5. Always offer a **Find port** search fallback for power users who skip the map.

**LCL / Air:** classic `PortCombobox` (no map in v1).

**Geo API:** expose `latitude` / `longitude` on port search; add country filter (`GET /ports?country=XX`). Data already on `geo.facility`.

### Step 3 — Cargo

FCL container table or LCL/Air weight/volume. Preview updates equipment lines. Advance when lane ready + cargo valid.

### Step 4 — Rates (ticket 091)

Uber-style **rate cards** from catalog + spot (`quoting.slots.rateSources`):

- Carrier logo (monogram fallback), name, sell/base amount, currency.
- Chips when present: cargo drop-off, cutoff, ETD, ETA, transit, route (incl. alt routes). **Hide chips if absent** — no fake data.
- CTA **Select**; selected card elevates; **Add manual rate** remains.

Catalog today: `carrier`, amounts, validity — not schedule fields. Spot may have richer payloads.

### Step 5 — Build + live preview (ticket 092)

- **Left:** charge table (globals + O/F/D) via `quoting.slots.chargeTable` + markup/totals — same math, clearer section headers.
- **Right:** live PDF (`quoting.pdf` / blob) and Email (`@react-email/components` quote template).
- Actions: Save draft · Mark review · Export PDF · Copy email HTML / open draft. Send via messaging stays later RFQ work.

Terminal stages (`win` / `loss` / `expired`): commercial body read-only (082 rules unchanged).

---

## Extension model notes

- Owner: **`quoting.document`**. Contributors: `geo-gazetteer`, `rates.catalog` / spot, `quoting.charges`, `quoting.pdf`, email package / preview contribution.
- New slots only if needed (e.g. `quoting.slots.preview`, `quoting.slots.laneRoute`) — each implementation ticket documents Extension model.
- Kernel stays thin; no hard-coded quote feature tree under `apps/web/app/(app)/…` as product owner.

---

## Implementation polish

- **Map:** SVG countries (`topojson` / world-atlas style) + CSS/SVG animation; curve = quadratic/cubic Bezier between centroids or projected lat/lng; zoom via viewBox tween.
- **Rate cards:** horizontal scroll on mobile; sort by price then ETD when present.
- **Preview:** empty states (“Select ports to see route on the quote”); never block typing on regen.
- **Keyboard:** stepper Next/Back.

---

## Ticket map

| Id | Slice | Depends on |
| -- | ----- | ---------- |
| 088 | Epic / orchestration (docs) | — |
| 089 | Multistep shell + preview chrome (stubs OK) | 077, 073 |
| 090 | FCL world-map ports + geo lat/lng + country filter | 089 |
| 091 | Rate cards | 089 |
| 092 | Live PDF + email preview | 089, 083 |

Promote `quote-flow` → `dev` only after slices intended for the epic merge are in.
