---
id: 070
wave: 06-product
title: Incoterm-driven charge bucket scope (legacy parity)
status: open
depends_on: [068, 071]
epic: SYS-PRICING
docs:
  - .project/docs/domains/pricing.md
  - .project/docs/domains/quotes.md
  - .project/docs/reference/build-priority-2026-11-01.md
  - .project/docs/extension-points.md
---


# Incoterm-driven charge bucket scope (legacy parity)

## Context (from quote-form discussion)

**068** shipped **door → bucket** scope only (no pickup → exclude `origin`; no delivery → exclude `destination`). There is **no Incoterm field** on the quote form.

Legacy **starboard-2** lets you add origin/destination surcharges without doors; they stay in the total unless an **Incoterm × customer role** matrix puts that bucket in `excluded_buckets`.

Product decision: follow **legacy prod** — allow charges in any bucket; **knock them out of totals based on selected Incoterm** (not door presence alone).

## Goal

1. Add `incoterm` (and role if needed) on the quote header / form.
2. Port lean **Incoterm × role → excluded_buckets** matrix from starboard-2 (enough for FCL ocean; document gaps).
3. Change `deriveExcludedBuckets` (or successor) so **Incoterm drives sell/rollup exclusion**; door presence may still inform UX but must **not** be the sole knock-out rule for rate-level origin/destination charges.
4. Keep quote-level **global charges** policy explicit (prod: globals usually stay; document rewrite rule after decision).
5. Update UI copy so users see why a line is excluded (e.g. “Excluded by Incoterm”).

## Non-goals

- Reverting global charges table
- Full trucking remapping edge cases
- Changing unit / % freight amount engine

## Acceptance criteria

- [ ] Quote form has an Incoterm control; value persists on quote
- [ ] Port-to-port (no doors) + Incoterm that includes origin → origin rate surcharges **count** in total
- [ ] Same quote + Incoterm that excludes origin → origin surcharges **do not** count (rows may remain visible)
- [ ] Fixture/oracle cases for matrix cells used in UI
- [ ] Domain docs: 068 = door lean shipped; **070** = Incoterm parity
- [ ] Deprecate or narrow door-only exclusion once Incoterm path is default

## Files to touch (expected)

- `packages/contracts` — incoterm enum / quote field
- `packages/database` — quote column
- `packages/pricing` — scope matrix + `deriveExcludedBuckets` / totals
- `apps/web` quote form + lane totals wiring
- `services/quotes` persist/load

## Out of scope

PDF layout; full prod SCOPE_MATRIX every edge case in v1 (document deferred cells)
