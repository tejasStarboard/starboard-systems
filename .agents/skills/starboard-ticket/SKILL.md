---
name: starboard-ticket
description: >-
  Implement one Starboard Systems rewrite ticket from .project/tickets.
  Use when coding a ticket already selected, or with starboard-dev-workflow
  for the default plan → branch → PR loop.
---

# Implement a Starboard ticket

Default git/ticket lifecycle (select ticket, sync `origin/dev`, reconcile
`done/`, plan, `--no-track` branch, PR + auto-merge):
[starboard-dev-workflow](../starboard-dev-workflow/SKILL.md).

## Before coding

1. Read **only** the assigned ticket under `.project/tickets/` (`todo/` or `in_progress/`).
2. Read every path listed in the ticket’s `docs:` frontmatter (under `.project/docs/`).
3. Read [deprecations.md](../../../.project/docs/deprecations.md) — do not port dead lineages.
4. Skim [docs/architecture.md](../../../docs/architecture.md) for BFF ↔ service token rules.
5. Load **at most one** extra skill if needed:
   - Bun service → `starboard-bun-service`
   - Extension → `starboard-extension`
   - Shell/BFF/auth → `starboard-shell-bff`
   - Better Auth details → existing `better-auth-*` / `organization-best-practices`

## Hard rules

- **Scope = ticket acceptance criteria only.** No drive-by refactors.
- Shell stays usable without optional extensions.
- Domain services: service token + `X-Organization-Id`; never cookies/Better Auth inside Bun/Python workers.
- One writer per Postgres schema; no dual-write from Next into domain tables.
- Soft cross-domain IDs (opaque text); BFF enforces integrity.
- ~300 LOC soft cap per file; follow existing package patterns.
- FCL **v6 only** for ocean ingest; never resurrect v3–v5.

## Implement

1. Ticket already in `in_progress/` on branch `{id}` (e.g. `001`; see dev-workflow).
2. Vertical slice: contracts → db schema (if any) → service → BFF client/orchestrator → UI.
3. Build/typecheck touched packages; add the tests the ticket asks for.
4. After merge (dev-workflow §7): acceptance checked; ticket in `done/`; update linked `.project/docs/domains/*.md` if behavior changed.

## Agent reply style

Short. Link the ticket path. List files changed. Do not paste the whole skill or orchestrator prompt.
