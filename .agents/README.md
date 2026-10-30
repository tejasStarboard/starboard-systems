# Agent skills — Starboard Systems

Project skills for Cursor. Prefer **one skill per task**. Do not add root `AGENTS.md` inside skill folders (token bloat).

## Rewrite / product skills (local)

| Skill                                                            | When to use                                               |
| ---------------------------------------------------------------- | --------------------------------------------------------- |
| [starboard-ticket](skills/starboard-ticket/SKILL.md)             | Implementing a `.project/tickets/**` ticket               |
| [starboard-orchestrator](skills/starboard-orchestrator/SKILL.md) | Planning waves, writing tickets/docs, reviewing agent PRs |
| [starboard-bun-service](skills/starboard-bun-service/SKILL.md)   | New or changed Bun + Hono domain service                  |
| [starboard-extension](skills/starboard-extension/SKILL.md)       | Extension manifests, workers, plug/unplug                 |
| [starboard-shell-bff](skills/starboard-shell-bff/SKILL.md)       | Next.js shell BFF, Better Auth org, orchestrators         |

## Auth pack (vendored)

Better Auth skills under `skills/better-auth-*`, `create-auth`, etc. Use when touching auth/org plugins.

## Source of truth

- Program: `.project/docs/`
- Tickets: `.project/tickets/todo/` → `in_progress/` → `done/`
- Runtime: `docs/architecture.md`
