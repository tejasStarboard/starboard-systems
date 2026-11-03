---
id: 094
wave: 08-quote-builder-ux
title: react-pdf + react-email preview extensions with tenant template schema
status: done
depends_on: [092, 083]
epic: SYS-QUOTE-UX
docs:
  - .project/docs/reference/quote-builder-ux-2026-11-03.md
  - .project/docs/domains/quotes.md
  - .project/docs/extension-points.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/git-workflow.md
---

# react-pdf + react-email preview extensions with tenant template schema

## Git

| Rule    | Detail                                                                   |
| ------- | ------------------------------------------------------------------------ |
| Base    | `origin/quote-flow` — `git checkout --no-track -b 094 origin/quote-flow` |
| PR      | Into **`quote-flow` only**                                               |
| Landing | No direct commits on `quote-flow`                                        |

## Extension model

|                 |                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Packages**    | **`quoting.pdf`** (PDF preview + export via **`@react-pdf/renderer`**); **`quoting.email`** (email preview via **`@react-email/components`**). Document owns `quoting.slots.preview`. |
| **Layer**       | Driving built-ins (default-on). Product UI **not** in kernel `apps/web` beyond thin BFF auth/gate routes.                                                                             |
| **Defines**     | Each package **defines** a template registry point, e.g. `quoting.pdf.templates` / `quoting.email.templates`, so tenants/extensions can register custom designs.                      |
| **Contributes** | Default template(s) into those points; preview tab into `quoting.slots.preview`; Export PDF into `quoting.commands`.                                                                  |
| **Unplug test** | `quoting.pdf` off → no PDF tab/export; `quoting.email` off → Email tab stub; document intact.                                                                                         |
| **Math**        | View-model totals **only** via `@starboard/lib-pricing` — no twin pricing. Templates are display-only.                                                                                |

## Problem

1. PDF preview/export today uses **pdf-lib** imperative drawing — hard to customize letterhead / layout per tenant.
2. Product wants **react-pdf** to compose the PDF document and render it in the preview pane; **react-email** for the email pane (already partially true).
3. Preview product logic must stay in **extensions**, not grow in the webapp. BFF stays a thin session/gate/delegate boundary.
4. Each tenant wants their own letterhead and layout (table placement, route block, etc.) → need a **stable data schema** that any custom template can bind to, plus a way to **register/select** templates.

## Goal

1. **Stable document schema** (`QuoteDocumentView` or equivalent in contracts / shared module): org branding hooks, quote header, customer, lanes/route, cargo, selected-rate charges (O/F/D + globals), totals, validity, Incoterm notes — built once from form/saved quote via ONE MATH. Both PDF and email templates consume **this schema only** (no ad-hoc form scraping inside templates).
2. **PDF via `@react-pdf/renderer`:** default template is a React-PDF `<Document>`; preview renders to blob/URL (or react-pdf viewer) in the PDF tab; Export PDF uses the same template + schema. **Remove pdf-lib** from the quote PDF path (or leave unused / delete).
3. **Email via react-email:** default template binds to the same schema (migrate/adapt `QuoteDraftEmail`); preview HTML + Copy HTML / Open draft unchanged in spirit.
4. **Template extension points:** `quoting.pdf` / `quoting.email` define contribution points for templates (`id`, `label`, `render(view)`). Ship one **default** template each. Org (or extension settings) can select active template id; missing selection → default.
5. **Custom templates (v1):** document + implement the contribution API so a second template can register (include a thin **branded/letterhead** example that reads org name/logo URL from the schema if present). Full WYSIWYG template designer is **out of scope**.
6. **Kernel thin:** no preview React UI under `apps/web/components`. Keep only BFF routes that authenticate, check extension active, and call extension server helpers.
7. Update domain docs + extension-points cookbook.

## Non-goals

- WYSIWYG template builder UI
- Messaging send / Outlook attach
- Pixel-perfect prod QV2 clone
- Per-user (vs org) template unless already the settings model
- Merge to `dev`

## Files to touch (approx)

- `packages/contracts` (or shared lib) — `QuoteDocumentView` schema + builder input types
- `extensions/builtins/quoting-pdf` — react-pdf default template, preview slot, export, template registry/`defines`
- `extensions/builtins/quoting-email` — schema-bound react-email template, template registry
- `packages/email` — quote template adapted to schema (or moved under quoting-email if cleaner)
- `quoting.document` — preview host unchanged aside from props if schema id/selection needed
- `apps/web` — thin BFF only; `builtin-editors` registry
- `extensions/host` — register defines/tests
- Docs: quotes, extension-points, build-priority

## Acceptance

- [x] PDF preview + export built with `@react-pdf/renderer` against `QuoteDocumentView` (no pdf-lib on quote path)
- [x] Email preview built with react-email against the **same** schema
- [x] `quoting.pdf` / `quoting.email` define template contribution points; default templates registered; org can select template (settings or metadata) with fallback to default
- [x] At least one alternate/branded template contribution demonstrates letterhead/custom layout binding to schema fields
- [x] Preview UI remains extension-owned; apps/web has no product preview components
- [x] Totals still ONE MATH; unplug tests pass
- [x] Branch from `quote-flow`; PR targets `quote-flow`; `pnpm run ci` green

## Out of scope

Template marketplace; historical PDF snapshots; promote `quote-flow` → `dev`
