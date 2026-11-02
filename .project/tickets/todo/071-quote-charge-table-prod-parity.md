---
id: 071
wave: 06-product
title: Quote charge table prod parity (QV2 grid + rate alternatives)
status: open
depends_on: [067, 068, 073]
epic: SYS-PRICING
docs:
  - .project/docs/domains/quotes.md
  - .project/docs/domains/pricing.md
  - .project/docs/reference/build-priority-2026-11-01.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
---

# Quote charge table prod parity (QV2 grid + rate alternatives)

## Principle

This rewrite is a **code refactor**, not a product redesign. QV2 Ocean FCL charge UX and money semantics must match prod unless a ticket explicitly defers a named gap. Execution order: [build-priority](../../docs/reference/build-priority-2026-11-01.md) (after/alongside **074**). Prefer a grid shape **073** can mount via `quoting.document` slots — avoid new hard-coded shell page trees.

## Prod reference (starboard-2)

- One **ChargeTable** per **selected** rate (`ChargeTable.tsx`); Origin / Freight / Destination / Globals sections
- **RateTabList** — multiple rates are alternatives; only the selected rate prices the lane
- “+ Add Charge” → surcharge **row** (`AddChargeModal.tsx`), not a second base tree
- Manual FCL: **Flat rate** toggle **or** per-equipment buys (`FclBody.tsx`, `usage_unit: EQ`)
- Units: Per Eq / Per File / Per Day / Per KG / …
- Globals are rows in the same table (`source: global`), not a separate editor only

## Rewrite today (deviation)

- `manualRates[]` → stacked Charge cards; “+ Add charge” appends another **base** block
- **All** `manualRates` **summed** in lane totals (no select-one)
- Base = scalar `amount` only
- Globals = separate `GlobalChargesEditor`
- Unit labels diverge (`Container` vs Per Eq)

## Goal

1. Single charge grid for the **selected** rate: base freight + surcharge rows with leg ∈ {origin, freight, destination, global}
2. Rate alternatives = tabs/cards like prod; totals from **selected** rate only (Apply catalog/spot appends an alternative, does not stack into one sum)
3. Base freight: flat **or** per-eq; multi-CT equipment-specific amounts like prod FCL body (lean v1 OK if documented + fixture-backed)
4. Align unit labels/enums with prod vocabulary used in FCL UI
5. Keep math in `@starboard/lib-pricing`

## Non-goals (→ **072** or later)

- Per-row buy/sell dial, Split/Hide, FX popover, free/min/max editors, full tier/min-charge matrix
- Incoterm matrix (**070**)
- PDF / Outlook

## Acceptance criteria

- [ ] One charge table for selected rate; “+ Add charge” adds a **line**
- [ ] Multiple rates are alternatives; UI selects one; totals do not sum all rates
- [ ] Base flat vs per-eq (+ equipment-specific path or explicit lean subset)
- [ ] Globals appear as grid section/leg (persistence may keep `global_charge` table)
- [ ] Domain + coverage docs updated; no “invoice-style multi charge cards” as product intent

## Out of scope

Detention product rules; full TEU equipment table beyond lean count
