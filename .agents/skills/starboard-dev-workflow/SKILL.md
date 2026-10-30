---
name: starboard-dev-workflow
description: >-
  Default Starboard ticket development loop: select a .project ticket (asked
  or next todo), sync origin/dev, reconcile merged tickets into done, plan on
  latest dev, branch without tracking dev, implement, run pnpm run ci (mirrors
  GitHub CI) before opening an auto-merge PR to dev. Use when starting ticket
  work, picking next ticket, planning/implementing a SYS-* slice, or syncing
  ticket folders after merges.
---

# Starboard development workflow

Default unless the user asks for something else (plan-only, promote to `main`, orchestrator, etc.).

Implementation details for coding a ticket: [starboard-ticket](../starboard-ticket/SKILL.md).  
Git/branch policy: [.project/docs/git-workflow.md](../../../.project/docs/git-workflow.md).

## 1. Select ticket

1. If the user named a ticket (`001`, path under `.project/tickets/`): use that file in `todo/` or `in_progress/`.
2. Else: next open ticket in `.project/tickets/todo/` by **lexical filename** (lowest `NNN-…`). Skip if `depends_on` tickets are not in `done/`.
3. Read **only** that ticket + its `docs:` frontmatter paths. Do not dump `.project`.

## 2. Sync `origin/dev` and reconcile done

Before planning or branching:

```bash
git fetch origin
git log --oneline origin/dev -30
```

From recent `origin/dev` history (merge commits, `ticket NNN`, branch names `{id}` / `001`):

- For each ticket id clearly merged to `dev`, if the file still lives in `todo/` or `in_progress/`:
  - move → `.project/tickets/done/`
  - set frontmatter `status: done`
  - check off acceptance criteria when the merge covered them
- Do **not** invent merges from local unpushed branches.

If the selected ticket is now in `done/`, stop and pick the next todo (or ask).

## 3. Plan on latest `dev`

1. Work against **current** `origin/dev` tree (read files via `origin/dev:path` or a clean local `dev` updated with `git pull` on `dev` only when needed for browsing).
2. Plan the implementation (Plan mode / short plan): acceptance only, files to touch, tests.
3. Load at most one domain skill after the ticket (`starboard-bun-service` | `starboard-extension` | `starboard-shell-bff` | auth skills).

Do not start a feature branch until the plan is agreed (or the user said skip planning / implement now).

## 4. Branch (never track `dev`)

```bash
git fetch origin
git checkout --no-track -b {id} origin/dev
```

- Name: **ticket id only** (e.g. `001`), matching the numeric id in `.project/tickets/…/{id}-*.md`. No slug prefix.
- **Do not** set upstream to `dev` / `origin/dev` (`--no-track` is required).
- Never commit on `dev` or `main`.

Then move ticket `todo/` → `in_progress/` and set `status: in_progress` (if not already).

## 5. Implement

Follow [starboard-ticket](../starboard-ticket/SKILL.md): acceptance only; add the tests the ticket asks for.

### Commit titles

Ticket work — every commit subject must be:

```text
{feat|fix|chore}({id}) - {commit title}
```

Examples: `feat(001) - extension host skeleton`, `fix(002) - quote save validation`, `chore(001) - mark ticket done`.

- Same `{feat|fix|chore}` + ticket `{id}` pattern as the PR title.
- Non-ticket meta/docs only (no `.project` ticket): `chore - {commit title}` (no id).
- One logical change per commit when practical; each subject still uses this format.
- Use a HEREDOC for the message (`git commit -m "$(cat <<'EOF' … EOF)"`).

## 6. Local CI gate (required before PR)

Mirror [.github/workflows/ci.yml](../../../.github/workflows/ci.yml) locally. **Do not push or open a PR until this passes.**

```bash
pnpm run ci
```

Use **`pnpm run ci`** (not bare `pnpm ci` — that is pnpm’s clean-install command). Same sequence as GitHub: `format:check` → `lint` → `typecheck:ci` → `test` → `build`.

- If it fails: fix, re-run `pnpm run ci`, only then continue.
- Prefer full `pnpm run ci` over package-only checks before PR (package filters are fine while iterating).
- If Next env validation fails locally, use the same dummy env values as the CI workflow (or `apps/web/.env` from that job).

## 7. PR into `dev` + auto-merge

Only after §6 is green:

```bash
git push -u origin HEAD
gh pr create --base dev --title "{type}({id}) - {brief title}" --body "$(cat <<'EOF'
## Summary
…

## What it covers
- …

## Out of Scope
- …

## QA Instructions
- [ ] `pnpm run ci` passed locally
- [ ] …

EOF
)"
gh pr merge --auto --merge
```

**Title:** `{fix|feat|chore}({id}) - {brief title}` — e.g. `feat(001) - extension host skeleton`. Pick `feat` / `fix` / `chore` from the change; `{id}` is the ticket id.

**Body sections (required):** Summary · What it covers · Out of Scope · QA Instructions.

- Base **`dev` only** (never `main`).
- `-u origin HEAD` tracks the **ticket branch**, not `dev`.
- Always enable auto-merge when available; remote CI job name: `Lint · typecheck · test · build`.

## 8. After merge (when asked or on next workflow run)

Re-run §2: move ticket `in_progress/` → `done/`, `status: done`, update linked `.project/docs/domains/*.md` if behavior changed.

## Hard rules

- One ticket per branch / PR.
- Commit subjects and PR titles: `{feat|fix|chore}({id}) - …`.
- **Never open/push a ticket PR without a green local `pnpm run ci`.**
- No Linear unless the user asks.
- No direct push to `dev`/`main`; promote to `main` only via separate cherry-pick PR (git-workflow.md) when asked.
- Keep replies short: ticket path, branch, PR URL, local CI result.
