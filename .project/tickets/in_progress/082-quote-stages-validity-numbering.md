---
id: 082
wave: 07-quote-loop
title: Quote stages, validity, and numbering (quoting.document)
status: in_progress
depends_on: [073, 077]
epic: SYS-QUOTE
docs:
  - .project/docs/domains/quotes.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/extension-points.md
  - .project/docs/reference/build-priority-2026-11-01.md
---

# Quote stages, validity, and numbering (quoting.document)

## Extension model

|                   |                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package / id**  | `quoting.document` (`@starboard/ext-quoting-document`) — **driving built-in**                                                                                                                     |
| **Layer**         | Built-in (default-on). Not optional; quoting without stages is incomplete QV2.                                                                                                                    |
| **Defines** (new) | `quoting.slots.lifecycle` (stage/validity chrome) and/or `quoting.commands` (stage transitions, duplicate, …) so PDF/send (**083**) can contribute actions without importing the document package |
| **Contributes**   | UI into its own lifecycle slot (or header); kernel `workbench.editors` unchanged                                                                                                                  |
| **Unplug test**   | Built-in off → no quote editor (existing). Lifecycle UI must not live in `apps/web`                                                                                                               |

Kernel stays unaware of stage enums. Persist on `quotes` schema via existing BFF (`/api/quotes/**`); no new kernel pages.

## Goal

1. Persist **stage** (lean QV2 set: e.g. draft → sent → won / lost / expired — document exact enum vs prod), **validity** window, and **quote number** on the quote aggregate.
2. Surface controls in the quote editor via a **defined slot** (not a hard-coded kernel widget).
3. Gate destructive/export actions by stage where prod does (document rules).

## Non-goals

- PDF rendering (**083**)
- Email send / RFQ extract
- Full prod stage machine edge cases (document deferred transitions)
- CargoWise / external numbering services

## Files to touch (approx)

- `extensions/builtins/quoting-document` — manifest `defines` + lifecycle UI contribution; editor hosts slot
- `packages/db` / `services/quotes` / contracts — stage, validity, number columns + API
- `apps/web` — BFF only; no product stage page
- Domain docs: `quotes.md`, `extension-points.md` (new point ids)

## Acceptance

- [x] Schema + API round-trip for stage, validity, number
- [x] `quoting.document` **defines** lifecycle/commands points; UI mounts only via contribution/slot host
- [x] Inactive `quoting.document` → no lifecycle UI; kernel has no stage imports
- [x] Numbering rule documented (org-scoped sequence or equivalent lean rule)
- [x] Inventory + quotes domain doc updated
- [x] `pnpm run ci` green

## Out of scope

Outlook twin; client portal stages
