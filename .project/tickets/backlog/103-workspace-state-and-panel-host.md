---
id: 103
wave: 13-workbench-panel
title: Workspace State API + workbench.panel host
status: backlog
depends_on: []
epic: SYS-WORKBENCH
docs:
  - .project/docs/extension-points.md
  - .project/docs/extensions.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/git-workflow.md
---

# Workspace State API + workbench.panel host

Foundation for end-user-friendly bottom panel extensions (activity, inbox peek, notes). **No peer extension-to-extension gateway** — panel views read kernel Workspace State and call their own BFF routes.

**Not** the channel for in-document slot context (that stays **host slot props + callbacks**). **Not** the invoke RPC path (host → child BFF with args — ticket **[107](./107-contribution-invoke-rpc.md)**). Workspace State is thin shell chrome: `organizationId` + `activeEditor` only. See [extension-points.md §5](../../docs/extension-points.md#5-context-for-child-contributions--ui-props-vs-invoke-rpc).

## Goal

1. **Workspace State (shell runtime)** — subscribe/get read-only workspace context from the web kernel:
   - `organizationId` (from auth/org session; do not invent a second org store)
   - `activeEditor` — `{ viewType, resourceId, title }` from workbench tabs (already tracked in `WorkbenchProvider`)
2. **`workbench.panel` contributions** — extensions register bottom-panel tabs (`id`, `label`, `order`, `component` / factory key).
3. Wire [`bottom-panel.tsx`](../../../apps/web/components/workbench/bottom-panel.tsx) to contributed views (replace the stub “No panel views contributed”).

## Where state lives

| Layer | Role |
| ----- | ---- |
| `apps/web` WorkbenchProvider / host API | **Runtime owner** of Workspace State |
| Auth / org session | Source of truth for active org |
| `@starboard/ext-host` | **`contributes.panel` schema + merge only** — not a focused-tab process |
| Optional shared types package (later) | Types importable by builtins without importing `apps/web` |

## Non-goals

- Right-side aux / help chat panel (later)
- Raw logs / technical Output for end users
- Extension↔extension RPC or bus inside ext-host
- Implementing activity / inbox / notes UIs (104–106)

## Files to touch (approx)

- `apps/web/components/workbench/workbench-context.tsx` — expose Workspace State
- `apps/web/components/workbench/bottom-panel.tsx` — host contributed panel tabs
- `apps/web/lib/workbench/*` — types / merge panel contributions
- `extensions/host/src/manifest.ts` + `workbench.ts` — `contributes.panel`
- `.project/docs/extension-points.md`, ADR 0006 note if needed

## Acceptance

- [ ] Shell exposes subscribe/get for `organizationId` + `activeEditor`
- [ ] Extensions can contribute `panel` entries; inactive/unplugged extensions drop their tabs
- [ ] Bottom panel renders contributed tabs (empty state when none)
- [ ] BuiltinHost (or equivalent) can pass Workspace State into panel factories without panel packages importing `apps/web` routes
- [ ] Unit tests: schema, merge, unplug; shell state updates when active tab changes
- [ ] Docs: `workbench.panel` listed under kernel points; Workspace State documented as shell-owned

## Out of scope

- Tickets **104** / **105** / **106** feature UIs
- Ticket **102** commands/keybindings
