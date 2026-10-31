# Starboard Systems — rewrite program

Greenfield rewrite of production Starboard (`../starboard-2`) into this monorepo.

## Layout

| Path                                               | Purpose                                                 |
| -------------------------------------------------- | ------------------------------------------------------- |
| [docs/](docs/)                                     | Program architecture, ADRs, domain status, deprecations |
| [tickets/todo/](tickets/todo/)                     | Open tickets (lexical order = priority)                 |
| [tickets/in_progress/](tickets/in_progress/)       | Actively being implemented                              |
| [tickets/done/](tickets/done/)                     | Accepted / merged                                       |
| [../.agents/](../.agents/)                         | Cursor skills for feature + orchestrator agents         |
| [../docs/architecture.md](../docs/architecture.md) | Runtime deploy note                                     |
| [docs/git-workflow.md](docs/git-workflow.md)       | `dev` / `main`, ticket branches, cherry-pick promote    |

## How to pick the next ticket

Default loop: skill **starboard-dev-workflow** (sync `origin/dev`, reconcile `done/`, plan, `--no-track` branch, implement via **starboard-ticket**, PR to `dev` + auto-merge). See also [git-workflow.md](docs/git-workflow.md). Code is proprietary — see root `LICENSE`.

1. List `.project/tickets/todo/*.md` in lexical order.
2. Take the **lowest-numbered** ticket whose `depends_on` are all in `done/` (or have `status: done`).
3. After plan: `git checkout --no-track -b {id} origin/dev` (branch name = ticket id, e.g. `001`); move ticket to `in_progress/`.
4. PR **into `dev` only** (auto-merge after CI); promote to `main` via cherry-pick PR when asked.

**Current focus:** Wave 5 extension foundation is merged ([055](tickets/done/055-extension-foundation-hardening.md)–[058](tickets/done/058-admin-extension-settings-ui.md), [ADR 0005](docs/adr/0005-extension-foundation.md)). Next work is the product wave in [docs/roadmap.md](docs/roadmap.md).

## Status legend

| Folder / status         | Meaning                          |
| ----------------------- | -------------------------------- |
| `todo` + `open`         | Ready when dependencies are done |
| `in_progress`           | Someone is implementing          |
| `blocked` (frontmatter) | Waiting — note why in the ticket |
| `done/` + `done`        | Merged; domain docs updated      |

## Agent prompt (copy)

```text
Use the starboard-dev-workflow skill (then starboard-ticket for coding).
Work the ticket I name, or the next todo. Plan on latest origin/dev, then implement.
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
