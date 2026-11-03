---
id: 091
wave: 08-quote-builder-ux
title: Uber-style quote rate cards
status: todo
depends_on: [089, 060]
epic: SYS-QUOTE-UX
docs:
  - .project/docs/reference/quote-builder-ux-2026-11-03.md
  - .project/docs/domains/quotes.md
  - .project/docs/domains/rates.md
  - .project/docs/extension-points.md
  - .project/docs/git-workflow.md
---

# Uber-style quote rate cards

## Git

| Rule | Detail |
|------|--------|
| Base | `origin/quote-flow` — `git checkout --no-track -b 091 origin/quote-flow` |
| PR | Into **`quote-flow` only** |
| Landing | No direct commits on `quote-flow` |

## Extension model

|                  |                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------- |
| **Packages**     | **`rates.catalog`** (+ spot sources when active) into `quoting.slots.rateSources`       |
| **Layer**        | Built-in / optional spot contributors; document Rates step hosts the slot               |
| **Defines**      | None required                                                                           |
| **Contributes**  | Card UI replacing dense list in rate search / Rates step                                |
| **Unplug test**  | Catalog off → no catalog cards; spot off → no spot cards; manual add rate still works   |
| **Math**         | Apply-to-lane unchanged (ManualRateLine + surcharges); ONE MATH on totals               |

## Goal

1. In the Rates step (089), present catalog + spot offers as **Uber-style rate cards**: carrier logo (monogram fallback), carrier name, amount, currency.
2. Show schedule/route **chips only when fields exist** on the payload (cargo drop-off, cutoff, ETD, ETA, transit, route / alt route). Never invent data.
3. Primary CTA **Select** applies rate to lane (existing apply path); selected card elevates.
4. Keep **Add manual rate**.
5. Mobile: horizontal card scroll; prefer sort by price then ETD when present.

## Non-goals

- Expanding catalog schema with ETD/ETA/cutoff (follow-up ticket if product requires)
- Carrier logo CDN / org logo management productization
- Changing surcharge nesting on apply

## Files to touch (approx)

- `extensions/builtins/rates-catalog` — list → card components
- Spot source UIs under `extensions/` that contribute `rateSources`
- `quoting-document` Rates step host / `RatesSearchSheet` layout as needed
- Optional static monogram / logo map keyed by carrier string

## Acceptance

- [ ] Rate offers render as cards with amount + carrier; Select applies to lane
- [ ] Chips omit when fields absent; spot richer fields show when available
- [ ] Manual add rate still available; unplug catalog/spot behaves as today
- [ ] Branch from `quote-flow`; PR targets `quote-flow`; `pnpm run ci` green

## Out of scope

World map; live PDF/email; catalog schedule DB columns; merge to `dev`
