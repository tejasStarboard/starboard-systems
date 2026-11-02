# Starboard Systems — rewrite program

Greenfield rewrite of production Starboard (`../starboard-2`).

## Layout

| Path                                         | Purpose                                                |
| -------------------------------------------- | ------------------------------------------------------ |
| [docs/](docs/)                               | Architecture, ADRs, extension-points                   |
| [docs/reference/](docs/reference/)           | Inventory, coverage, **build priority**, migration map |
| [tickets/](tickets/)                         | `todo` / `in_progress` / `done`                        |
| [../.agents/](../.agents/)                   | Skills                                                 |
| [docs/git-workflow.md](docs/git-workflow.md) | Branches / `dev` / `main`                              |

## How to pick the next ticket

Follow **[docs/reference/build-priority-2026-11-01.md](docs/reference/build-priority-2026-11-01.md)** (not raw `todo/` sort).

**Now (Phase A):** [074](tickets/todo/074-workbench-shell.md) → [075](tickets/todo/075-extension-host-workbench-contributions.md) → [076](tickets/todo/076-builtin-extension-packages-scaffold.md) → [077](tickets/todo/077-migrate-quoting-document-builtin.md) → [078](tickets/todo/078-migrate-crm-settings-builtins.md) → [073](tickets/todo/073-quote-contribution-points.md).

Then Phase B QV2 parity (**071→070→072**), then **069**.

See [migration inventory](docs/reference/extension-migration-inventory-2026-11-02.md) · [ADR 0006](docs/adr/0006-shell-built-ins-extensions.md).

## Agent / orchestrator

Default loop: **starboard-dev-workflow** + **starboard-ticket**. Orchestrator: **starboard-orchestrator**.
