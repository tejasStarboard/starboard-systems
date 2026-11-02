---
id: 072
wave: 06-product
title: Quote charge-line economics parity (markup, sell, Split, guardrails)
status: open
depends_on: [071, 070]
epic: SYS-PRICING
docs:
  - .project/docs/domains/pricing.md
  - .project/docs/domains/quotes.md
  - .project/docs/reference/rewrite-coverage-2026-11-01.md
---

# Quote charge-line economics parity (markup, sell, Split, guardrails)

## Principle

Refactor parity with QV2 charge-row economics after **071** restores the grid shape. Do not invent a simpler markup product.

## Prod reference

- Per-rate / dial markup; **per-container** markup footers on multi-CT FCL (`deriveFclRateTotals`, ChargeTable multi-container markup)
- Row **buy** + **sell**, Include + **Split** (Split → `is_visible` / absorb vs standalone)
- **scope_override** force include/exclude vs Incoterm (`ChargeTableRow`, SB-5254)
- Usage free / min / max editors + badges
- Row FX display when currencies differ
- Equipment / “default” column on lines

## Rewrite today

- Lane-level `$`/`%` markup on rolled buy only
- Surcharge `rate` + Include; no Split UI; `buyAmount`/`sellAmount`/`scopeOverride` mostly unused in form
- Engine has free/min/max; no form fields
- No row FX; no equipment column

## Goal

Port the QV2 charge-row money UX onto the **071** grid, driven by `@starboard/lib-pricing` + fixtures from `shared-fixtures/qv2` where they exist.

## Non-goals

- Full `surcharge_matrix.json` every tier edge (document deferred cells)
- PDF layout; CargoWise codes
- Replacing **070** Incoterm matrix (wire scope_override UI once 070 exists)

## Acceptance criteria

- [ ] Markup matches prod for single-CT and multi-CT FCL footers (or documented lean subset with fixture proof)
- [ ] Include + Split behavior matches prod visibility/absorb rules
- [ ] Editable buy/sell (or dial) on rows; totals use sell path like prod
- [ ] scope_override UI when Incoterm scope active (**070**)
- [ ] free/min/max usage fields on add/edit charge
- [ ] Domain docs + fixtures updated

## Out of scope

Outlook twin; LCL-only tier surfaces if FCL path is complete
