---
id: 088
wave: 08-quote-builder-ux
title: Quote builder UX epic (multistep + map + rate cards + live preview)
status: done
depends_on: [077, 073, 082, 083]
epic: SYS-QUOTE-UX
docs:
  - .project/docs/reference/quote-builder-ux-2026-11-03.md
  - .project/docs/reference/build-priority-2026-11-01.md
  - .project/docs/domains/quotes.md
  - .project/docs/git-workflow.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/extension-points.md
---

# Quote builder UX epic

**Orchestration / docs ticket — not an implementation slice.** Feature chats implement **089–092** only.

## Git (epic exception)

| Rule | Detail |
|------|--------|
| Integration branch | **`quote-flow`** (off `dev`) |
| Slice branches | `git checkout --no-track -b {id} origin/quote-flow` |
| PR base | **`quote-flow` only** |
| Landing | **No direct commits on `quote-flow`** — PR + CI only |
| Promote | `quote-flow` → `dev` when epic ready (not per-slice) |

## Goal

1. Point all quote-builder UX work at [quote-builder-ux-2026-11-03.md](../../docs/reference/quote-builder-ux-2026-11-03.md).
2. Sequence vertical slices: **089** shell → **090** map / **091** rate cards (parallel after 089) → **092** live preview.
3. Keep money + stage semantics; redesign chrome and progressive disclosure only.
4. Ensure every slice documents Extension model and lands via PR into `quote-flow`.

## Slices

| Id | Title | Notes |
| -- | ----- | ----- |
| [089](089-quote-builder-multistep-shell.md) | Multistep shell + preview chrome | Stubs OK for PDF/email panes |
| [090](090-quote-fcl-world-map-ports.md) | FCL world-map seaport picker | Geo lat/lng + country filter |
| [091](091-quote-rate-cards.md) | Uber-style rate cards | Hide schedule chips when absent |
| [092](092-quote-live-pdf-email-preview.md) | Live PDF + react-email preview | Fills 089 preview slot |

```text
088 epic
089 shell ──► 090 map
         └──► 091 rate cards
089 + 083 ──► 092 live preview
```

## Non-goals

- Implementing product UI in this ticket
- Air/LCL map; GIS-accurate routing; messaging send
- Merging slices directly to `dev`
- Catalog schedule schema expansion (follow-up if needed)

## Acceptance

- [x] Design doc published and linked from build-priority Phase E + quotes domain “Next tickets”
- [x] Slice tickets **089–092** exist under `todo/` with `quote-flow` git rules
- [x] Feature chats are pointed at **one** slice ticket + design doc — not this epic for coding

## Out of scope

Product code; creating `quote-flow` remote branch (ops / first landing PR); Linear
