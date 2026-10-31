---
id: 067
wave: 06-product
title: Surcharges in quote UI and apply-rate path
status: open
depends_on: [066, 060]
epic: SYS-QUOTES
docs:
  - .project/docs/domains/quotes.md
  - .project/docs/reference/build-priority-2026-11-01.md
---

# Surcharges in quote UI and apply-rate path

## Goal

Show and edit surcharge lines on a quote lane grouped by origin / freight / destination; persist via quotes service; totals use pricing engine. When applying a catalog/spot rate (060), map charge lines when present.

## Non-goals

- Global charges UI (068)
- Incoterm auto-exclude (068)
- Full prod RateDetails parity

## Acceptance criteria

- [ ] Add/edit/remove surcharge lines with unit + leg
- [ ] Lane totals reflect inclusion flags + units
- [ ] Apply-rate path can attach surcharges from source when available
- [ ] Works with extensions off (manual + catalog)

## Out of scope

PDF layout of surcharge tables
