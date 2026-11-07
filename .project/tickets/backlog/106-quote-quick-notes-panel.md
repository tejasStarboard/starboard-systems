---
id: 106
wave: 13-workbench-panel
title: Quick notes per quote (panel extension)
status: backlog
depends_on: [103]
epic: SYS-QUOTING
docs:
  - .project/docs/domains/quotes.md
  - .project/docs/extension-points.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/git-workflow.md
---

# Quick notes per quote (panel extension)

Scratch-pad **Notes** for the active quote — ops-friendly bottom panel tab.

## Goal

New extension (e.g. **`quoting.notes`**) that:

1. Contributes a `workbench.panel` tab “Notes”
2. Enables / focuses content when Workspace State `activeEditor.viewType === "quote"`
3. Persists notes keyed by **org + quote resource id** (row UUID) via BFF + a small store (schema chosen at implement time; one-writer rules apply)

Empty / disabled messaging when no quote tab is focused (“Open a quote to add notes”).

## Extension model

|                  |                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Package / id** | `quoting.notes` (optional or default-on built-in — decide at implement)                                                                                                        |
| **Contributes**  | `workbench.panel` → Notes                                                                                                                                                      |
| **Reads**        | Workspace State active quote id (shell) — not `quoting.document` slot props                                                                                                    |
| **Data**         | Own BFF routes; must **not** mutate quote aggregate via undocumented coupling — soft FK to quote id only. Host does not RPC into notes for v1; notes UI calls its BFF directly |
| **Unplug**       | Notes tab gone; quote editor unchanged                                                                                                                                         |

## Non-goals

- Notes on customers/rates in v1
- Right-side help chat
- Peer RPC into `quoting.document` internals (use Workspace State only for “which quote”)

## Acceptance

- [ ] Notes tab contributed; unplug removes it
- [ ] Create / edit / reload notes for the active quote; org-isolated
- [ ] Switching quote tabs loads the matching notes
- [ ] Tests: contribution, persistence round-trip, no-quote empty state

## Out of scope

- **103** foundation (prerequisite)
- Activity (**104**), inbox peek (**105**)
