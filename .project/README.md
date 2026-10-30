# Starboard Systems — rewrite program

Greenfield rewrite of production Starboard (`../starboard-2`) into this monorepo.

## Layout

| Path | Purpose |
|------|---------|
| [docs/](docs/) | Program architecture, ADRs, domain status, deprecations |
| [tickets/todo/](tickets/todo/) | Open tickets (lexical order = priority) |
| [tickets/in_progress/](tickets/in_progress/) | Actively being implemented |
| [tickets/done/](tickets/done/) | Accepted / merged |
| [../.agents/](../.agents/) | Cursor skills for feature + orchestrator agents |
| [../docs/architecture.md](../docs/architecture.md) | Runtime deploy note |

## How to pick the next ticket

1. List `.project/tickets/todo/*.md` in lexical order.
2. Take the **lowest-numbered** ticket whose `depends_on` are all in `done/` (or have `status: done`).
3. Move it to `tickets/in_progress/` and set `status: in_progress`.
4. Open a feature chat with skill **starboard-ticket** and that file only (+ its `docs:` links).

## Status legend

| Folder / status | Meaning |
|-----------------|---------|
| `todo` + `open` | Ready when dependencies are done |
| `in_progress` | Someone is implementing |
| `blocked` (frontmatter) | Waiting — note why in the ticket |
| `done/` + `done` | Merged; domain docs updated |

## Agent prompt (copy)

```text
Use the starboard-ticket skill.
Implement only .project/tickets/in_progress/<file>.md (or the todo file I name).
Read its docs: links under .project/docs/. Do not expand scope.
Do not port deprecated lineages (.project/docs/deprecations.md).
```

## Orchestrator prompt (copy)

```text
Use the starboard-orchestrator skill.
Follow .project/docs/orchestrator.md. Manage .project docs/tickets only unless I ask to code.
```

## Epics

`SYS-SHELL` · `SYS-EXT-HOST` · `SYS-QUOTES` · `SYS-CRM` · `SYS-GEO` · `SYS-PRICING` · `SYS-RATES` · `SYS-EXT-FCL-V6` · `SYS-EXT-MSGRAPH` · `SYS-EXT-SPOT` · `SYS-BILLING`
