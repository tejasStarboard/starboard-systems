---
id: 092
wave: 08-quote-builder-ux
title: Live quote PDF + react-email preview
status: in_progress
depends_on: [089, 083]
epic: SYS-QUOTE-UX
docs:
  - .project/docs/reference/quote-builder-ux-2026-11-03.md
  - .project/docs/domains/quotes.md
  - .project/docs/extension-points.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/git-workflow.md
---

# Live quote PDF + react-email preview

## Git

| Rule    | Detail                                                                   |
| ------- | ------------------------------------------------------------------------ |
| Base    | `origin/quote-flow` — `git checkout --no-track -b 092 origin/quote-flow` |
| PR      | Into **`quote-flow` only**                                               |
| Landing | No direct commits on `quote-flow`                                        |

## Extension model

|                 |                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Packages**    | **`quoting.pdf`** (live PDF blob into preview); email template via `packages/email` and/or `quoting.pdf` / thin `quoting.email` contribution |
| **Layer**       | Built-in contributions into document-owned **preview** slot (089)                                                                            |
| **Defines**     | None required (unless email defines template hooks later)                                                                                    |
| **Contributes** | PDF preview pane + Email preview pane; Export PDF command remains                                                                            |
| **Unplug test** | `quoting.pdf` off → PDF tab empty / no export; email contribution off → Email tab stub; editor intact                                        |
| **Math**        | Preview totals **only** via `@starboard/lib-pricing` / same model as 083 — no twin pricing                                                   |

## Goal

1. Fill the **089** Preview pane with live **PDF** (reuse `buildQuotePdfModel` / render path; blob URL or equivalent) debounced on form changes (~300ms).
2. Add a **quote email** template with `@react-email/components` (+ Tailwind as used in `packages/email`) and render HTML preview in the Email tab.
3. Empty states when insufficient data (“Select ports…” etc.).
4. Build-step actions: Save · stage controls · Export PDF · Copy email HTML / open draft. **Send** via messaging stays out of scope.
5. Preview may be available earlier than export stage gates; **download Export PDF** keeps existing status gates (review|sent|win|loss) unless design doc explicitly relaxes — default: keep 083 gates for export command.

## Non-goals

- Outlook/Gmail send / RFQ ingest
- Pixel-perfect prod PDF
- Per-org branded template editor
- Blocking the form on every preview regen

## Files to touch (approx)

- `extensions/builtins/quoting-pdf` — preview contribution + shared model
- `packages/email` — quote draft template
- BFF preview route if needed (e.g. HTML or PDF bytes) under quotes / extension API
- `quoting-document` preview slot host wiring from 089
- Tests with fixture quote (totals match ONE MATH)

## Acceptance

- [ ] PDF tab updates from current form/editor-context without full page reload (debounced)
- [ ] Email tab shows react-email quote HTML; Copy HTML works
- [ ] Totals in preview match ONE MATH for a golden fixture (Incoterm exclusions honored)
- [ ] Unplug pdf → no PDF preview/export affordance; document still works
- [ ] Branch from `quote-flow`; PR targets `quote-flow`; `pnpm run ci` green

## Out of scope

Messaging send; map; rate cards; merge to `dev` (epic promote PR later)
