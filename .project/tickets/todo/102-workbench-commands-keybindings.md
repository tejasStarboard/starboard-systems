---
id: 102
wave: 12-workbench-commands
title: Workbench commands + keybindings contributions
status: todo
depends_on: []
epic: SYS-WORKBENCH
docs:
  - .project/docs/extension-points.md
  - .project/docs/extensions.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/git-workflow.md
---

# Workbench commands + keybindings contributions

## Goal

Let extensions register **commands** and optional **keybindings** so actions are invokable globally in the workbench (palette / New Tab / hotkeys) without kernel hardcoding product shortcuts.

Follow the VS Code pattern:

1. `contributes.commands` — `{ id, title }` (+ client handler wiring)
2. `contributes.keybindings` — `{ command, key, mac?, when? }` targeting a command id
3. Shell owns a single global dispatcher, conflict resolution, and chord display

Manifest already has a lean `commands` schema (`extensions/host`); extend with keybindings and wire the host + web shell.

## Non-goals

- Full command palette UI polish (may be a thin stub / reuse later)
- Per-editor `quoting.commands` slot redesign (already exists for quote toolbar)
- User-customizable keybinding editor / settings UI
- Hardcoding New Tab shortcuts inside ticket **101**
- Defining the contribution **invoke RPC** schema (ticket **[107](../backlog/107-contribution-invoke-rpc.md)**) — commands may call invoke once 107 exists; client-only handlers are enough for v1 of this ticket

## Files to touch (approx)

- `extensions/host/src/manifest.ts` — `keybindings` contribution schema + validation
- `extensions/host` merge / `getActiveWorkbenchContributions` — surface `commands` + `keybindings`
- `apps/web` workbench — global keydown dispatcher, command registry / handlers
- Built-in manifests (e.g. `quoting.document`, `rates.catalog`, `crm.parties`) — seed a few global commands
- `.project/docs/extension-points.md` / `extensions.md` — document the point

## Acceptance

- [ ] Extensions can contribute `commands` and `keybindings` via manifest; inactive / unplugged extensions drop both
- [ ] Shell registers handlers and runs the matching command on keydown (no per-extension listeners)
- [ ] Key chord conflicts are deterministic (documented: first active wins or explicit precedence)
- [ ] At least one built-in ships a global command + binding end-to-end (e.g. new quote)
- [ ] Unit tests cover schema, merge, and conflict / unplug behavior

## Fixtures

- Kernel-only: no product commands/keybindings
- Credit plan with quoting on: sample binding fires handler
- Quoting rolled out off: binding no-ops / unbound

## Out of scope

- Ticket **101** New Tab visual polish beyond consuming contributed commands later
- Menus / toolbars contribution surfaces (listed in extension-points; separate tickets)
- Child BFF invoke contract (**107**); slot props / `onApplyRate`-style UI (**073**)
