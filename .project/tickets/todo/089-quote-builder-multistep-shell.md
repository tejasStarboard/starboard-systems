---
id: 089
wave: 08-quote-builder-ux
title: Quote builder multistep shell + preview chrome
status: todo
depends_on: [077, 073, 082, 088]
epic: SYS-QUOTE-UX
docs:
  - .project/docs/reference/quote-builder-ux-2026-11-03.md
  - .project/docs/domains/quotes.md
  - .project/docs/extension-points.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/git-workflow.md
---

# Quote builder multistep shell + preview chrome

## Git

| Rule | Detail |
|------|--------|
| Base | `origin/quote-flow` — `git checkout --no-track -b 089 origin/quote-flow` |
| PR | Into **`quote-flow` only** (not `dev` / `main`) |
| Landing | No direct commits on `quote-flow` |

## Extension model

|                  |                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Package / id** | **`quoting.document`** (`@starboard/ext-quoting-document`)                                                                      |
| **Layer**        | Driving built-in                                                                                                                |
| **Defines**      | Step host + optional `quoting.slots.preview` (and/or step region points) if needed for 090–092 contributions                    |
| **Contributes**  | N/A (owns chrome); existing slots (`lifecycle`, `headerFields`, `chargeTable`, `totals`, `rateSources`, `commands`) remounted by step |
| **Unplug test**  | Document off → no editor (unchanged). Preview stub empty when no 092 contributor                                                |
| **Math**         | Unchanged — totals still ONE MATH                                                                                               |

## Goal

1. Replace the single long-page quote form layout with a **5-step** shell: Basics → Route → Cargo → Rates → Build.
2. Desktop: left step controls + right sticky **Preview** pane (tabs PDF \| Email) with stub/empty states.
3. Mobile/tablet: stepper + preview via sheet or step-end toggle.
4. Keep multi-lane strip; Step 1 quote-level; Steps 2–5 per active lane.
5. Preserve save, lifecycle chrome, terminal-stage read-only (082). Stub previews OK — **092** fills them.

## Non-goals

- World map (090), rate cards (091), live PDF/email render (092)
- Changing charge/Incoterm/pricing semantics
- Kernel-owned quote UI trees

## Files to touch (approx)

- `extensions/builtins/quoting-document/src/components/quote-form*.tsx` — desktop/tablet/mobile shells
- Lane editor / header field hosting remounted by step
- Slot types if new preview/step points are defined
- Design-doc-aligned empty states for preview pane

## Acceptance

- [ ] Stepper navigates five steps; validation gates Next where design doc requires (e.g. ports before rates)
- [ ] Preview pane chrome present on desktop; stubs acceptable
- [ ] Existing slots still mount in the correct step; optionals unplug cleanly
- [ ] Branch from `quote-flow`; PR targets `quote-flow`; `pnpm run ci` green

## Out of scope

Map SVG; rate card redesign; react-email template; merge to `dev`
