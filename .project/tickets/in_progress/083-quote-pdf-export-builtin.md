---
id: 083
wave: 07-quote-loop
title: Quote PDF export as quoting.pdf built-in
status: in_progress
depends_on: [082, 066]
epic: SYS-QUOTE
docs:
  - .project/docs/domains/quotes.md
  - .project/docs/domains/pricing.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/extension-points.md
---

# Quote PDF export as quoting.pdf built-in

## Extension model

|                  |                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package / id** | **`quoting.pdf`** (new `@starboard/ext-quoting-pdf`) — **driving built-in** (default-on)                                                                   |
| **Layer**        | Built-in so credit orgs get PDF with optionals off. May later tighten `requiredPlan` — not an optional unplug for v1.                                      |
| **Defines**      | None required (unless template hooks later)                                                                                                                |
| **Contributes**  | Actions into points **owned by** `quoting.document` (`quoting.commands` and/or toolbar/menu from **082**); optional preview editor viewType only if needed |
| **Unplug test**  | `quoting.pdf` off → quote editor works; no Export PDF control. Document still loads.                                                                       |
| **Math**         | Totals **only** via `@starboard/lib-pricing` / editor-context payload — **no twin pricing**                                                                |

Do **not** add `app/(app)/quotes/.../pdf` as product owner. BFF route under quotes or `/api/extensions/quoting.pdf/...` is fine.

## Goal

1. Scaffold `extensions/builtins/quoting-pdf` (manifest + registry like **076**).
2. Generate a lean QV2-shaped PDF (header, lanes, selected-rate charges, globals, Incoterm exclusions reflected like UI).
3. Wire **Export PDF** (download and/or open blob) via contribution into document commands — never `if (ext === 'pdf')` in kernel.

## Non-goals

- Pixel-perfect prod template parity (document known gaps)
- Excel export; email-with-PDF attach (later messaging)
- Per-org branded templates (follow-up)
- Making PDF an optional extra in v1

## Files to touch (approx)

- `extensions/builtins/quoting-pdf/` — package, manifest, render + command contribution
- `extensions/host` — register builtin
- `quoting.document` — ensure command/menu point exists (**082**) for contribution target
- BFF route for render/download; tests with fixture quote
- Inventory + extension-points cookbook

## Acceptance

- [x] Package registered; default-on for credit + enterprise
- [x] Contributes only to `quoting.document`-owned points; kernel has no PDF UI imports
- [x] PDF totals match ONE MATH for a golden fixture (Incoterm exclusions honored)
- [x] Unplug `quoting.pdf` → no export affordance; quote editor intact
- [x] `pnpm run ci` green

## Out of scope

Outlook add-in print; client portal PDF
