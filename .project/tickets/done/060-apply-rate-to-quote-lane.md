---
id: 060
wave: 06-product
title: Apply catalog/spot rate to quote lane
status: done
depends_on: [002, 010, 020, 055]
epic: SYS-QUOTES
docs:
  - .project/docs/domains/quotes.md
  - .project/docs/domains/rates.md
  - .project/docs/domains/pricing.md
---

# Apply catalog/spot rate to quote lane

## Goal

Close the core quote loop: from the rates search sheet, **apply** a catalog rate or a completed spot result onto the active quote lane, persist via quotes service, and price with `@starboard/lib-pricing`.

## Non-goals

- Live carrier strategies (062)
- PDF / email send
- Full surcharge/FX engine beyond what pricing package already supports

## Acceptance criteria

- [x] User can select a catalog rate from the sheet and apply it to the current lane
- [x] After spot job `completed`, user can apply an offer from `result` to the lane
- [x] Lane rates persist and reload; totals use pricing package
- [x] Works with extensions off for catalog-only path; spot apply only when spot sources active
- [x] Clear errors if job failed / no offers

## Files to touch

- `apps/web/components/quotes/rates-search-sheet.tsx` (+ quote form wiring)
- `services/quotes` save path for lane rates if needed
- `packages/pricing` usage from BFF/UI
- Domain docs for quotes/rates

## Out of scope

CRM; messaging; Excel ingest
