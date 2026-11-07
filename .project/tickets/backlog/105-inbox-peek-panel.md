---
id: 105
wave: 13-workbench-panel
title: Inbox peek bottom panel (messaging)
status: backlog
depends_on: [103]
epic: SYS-MESSAGING
docs:
  - .project/docs/domains/messaging.md
  - .project/docs/extension-points.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/git-workflow.md
---

# Inbox peek bottom panel (messaging)

Org-scoped **Inbox** peek in the bottom panel for non-technical users. Soft dependency: messaging production path ([063](../done/063-messaging-production-path.md)) already done.

## Goal

Extend **`messaging.msgraph`** (and/or a thin UI package next to it) to contribute a `workbench.panel` tab that shows a short peek of recent inbox items for the active org (Workspace State).

Optional: when a quote editor is active and message↔quote links exist, prefer or filter related threads — do not block v1 on that.

## Extension model

| | |
| -- | -- |
| **Package / id** | `messaging.msgraph` (+ UI factory registration if needed) |
| **Contributes** | `workbench.panel` → Inbox |
| **Reads** | Workspace State `organizationId` (+ optional active quote) |
| **Data** | Existing messaging BFF / `/api/extensions/messaging.msgraph/…` — org-scoped session |
| **Unplug** | Inbox panel tab gone |

## Non-goals

- Full messaging inbox editor redesign (existing `/messaging/inbox` path)
- Help tips / aux chat
- End-user log/output panel

## Acceptance

- [ ] Inbox panel tab only when messaging extension is active for the org/plan
- [ ] Lists recent messages in plain language; opens deeper view via host `openEditor` / route when available
- [ ] No peer calls into quoting internals — Workspace State + own APIs only (invoke **107** only if messaging exposes a documented handler; default = own BFF from panel UI)
- [ ] Tests: contribution + entitlement/unplug

## Out of scope

- **103** foundation (prerequisite)
- Activity feed (**104**), quote notes (**106**)
- Replacing slot UI context model (props/callbacks) — N/A for this panel
