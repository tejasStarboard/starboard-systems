---
id: 104
wave: 13-workbench-panel
title: Recent activity panel extension (org + quote)
status: backlog
depends_on: [103]
epic: SYS-WORKBENCH
docs:
  - .project/docs/extension-points.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/git-workflow.md
---

# Recent activity panel extension (org + quote)

End-user-friendly **Activity** tab in the bottom panel — not technical logs.

## Goal

Ship a panel extension (e.g. `activity.feed` / `workbench.activity`) that contributes a `workbench.panel` tab and shows plain-language recent events for:

- **Org scope** — always (from Workspace State `organizationId`)
- **Quote scope** — when `activeEditor.viewType === "quote"`, optionally filter or highlight events for that `resourceId`

Examples: “Created quote AB12CD”, “Saved customer Acme”, “Opened Search Rates” — no stack traces, Temporal IDs, or raw worker output.

## Extension model

|                  |                                                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Package / id** | New built-in or optional (decide at implement time; default-on if thin)                                                                            |
| **Contributes**  | `workbench.panel` → Activity                                                                                                                       |
| **Reads**        | Workspace State from shell (**103**)                                                                                                               |
| **Data**         | Own BFF + store or event stream; do **not** call other extensions’ internals. Optional later: host events via **107** invoke — not required for v1 |
| **Unplug**       | Activity tab disappears; workbench intact                                                                                                          |

Context: Workspace State (**103**) only — not quote slot props.

## Non-goals

- Developer Output / Jobs console for end users (staff/admin later if needed)
- Help tips / right chat panel
- Peer extension bus (use own BFF / optional **107** invoke instead)

## Acceptance

- [ ] Panel tab appears when extension active; gone when unplugged
- [ ] Feed scopes by org; reacts to active quote from Workspace State
- [ ] Copy is ops-friendly (no technical jargon in the default UI)
- [ ] Tests: contribution merge + unplug; state-driven filter smoke

## Out of scope

- Implementing **103** itself (must be done first)
- Inbox peek (**105**), quote notes (**106**)
