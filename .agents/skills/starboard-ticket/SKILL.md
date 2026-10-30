---
name: starboard-ticket
description: >-
  Implement one Starboard Systems rewrite ticket from .project/tickets.
  Use when the user points at a ticket file, says implement ticket NNN,
  pick next ticket, or work a SYS-* epic slice in this monorepo.
---

# Implement a Starboard ticket

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

## Workflow

1. Move ticket `todo/` → `in_progress/` and set `status: in_progress` (if not already).
2. Branch from **`dev`**: `ticket/{id}-{slug}`. Never commit to `dev` or `main` directly. See [.project/docs/git-workflow.md](../../../.project/docs/git-workflow.md).
3. Implement vertical slice: contracts → db schema (if any) → service → BFF client/orchestrator → UI.
4. Build/typecheck the touched packages; add the tests the ticket asks for.
5. Open PR with **`--base dev`**. Do not PR into `main` (promote later via cherry-pick).
6. When merged: check off acceptance; move ticket to `tickets/done/`; set `status: done`.
7. Update the linked `.project/docs/domains/*.md` status line if behavior changed.

## Agent reply style

Short. Link the ticket path. List files changed. Do not paste the whole skill or orchestrator prompt.
