# Git workflow

## Branches

| Branch | Role                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------- |
| `dev`  | **Default / primary.** Integration branch. All ticket PRs target `dev`.                         |
| `main` | Production-stable. Updated by **cherry-pick** (or promote PR) from `dev`, never by feature PRs. |

Both `dev` and `main` must be treated as **protected**: no direct pushes; changes only via pull request.

### License

This repository is **public for visibility only**. See root [`LICENSE`](../../LICENSE): proprietary, **UNLICENSED**, no permission to use the code for any purpose.

### Branch protection and auto-merge (`dev`)

On public repos, GitHub Free supports branch protection / rulesets:

1. **`dev` and `main`**: pull request required; no direct push; no force-push/delete.
2. **`dev`**: required status check **`Lint · typecheck · test · build`** (CI job name).
3. Repo **auto-merge** enabled; PRs into `dev` are queued to merge when CI passes (see also [`.github/workflows/automerge-dev.yml`](../../.github/workflows/automerge-dev.yml) as a fallback).

Local guard (optional, still useful):

```bash
ln -sf ../../scripts/git-hooks/pre-push .git/hooks/pre-push
```

## Per-ticket flow

Agent default: skill **starboard-dev-workflow**.

1. Sync: `git fetch origin` (inspect `git log origin/dev`; reconcile `.project/tickets` → `done/` for merged ids).
2. Branch from **`origin/dev` without tracking it**:
   ```bash
   git checkout --no-track -b 001 origin/dev
   ```
   Naming: **ticket id only** (e.g. `001`), matching `.project/tickets/…/{id}-*.md`. Do **not** set `dev` as the branch upstream.
3. Implement the ticket; keep the branch scoped to that ticket.
4. Push and open a PR **into `dev`** (enable auto-merge):
   ```bash
   git push -u origin HEAD
   gh pr create --base dev --title "feat(001) - …" --body "…"   # title: {fix|feat|chore}({id}) - brief title
   # body sections: Summary · What it covers · Out of Scope · QA Instructions
   gh pr merge --auto --merge
   ```
5. After merge to `dev`: move ticket `in_progress/` → `done/`.

## Promote to `main` (cherry-pick)

Do **not** open feature PRs against `main`.

1. Identify commit(s) on `dev` to release (often the merge commit or squash SHA).
2. Branch from `main`:
   ```bash
   git fetch origin
   git checkout main && git pull
   git checkout -b promote/001-extension-host-skeleton
   git cherry-pick -x <sha>   # repeat as needed
   git push -u origin HEAD
   gh pr create --base main --title "promote: ticket 001 …" --body "Cherry-picked from dev"
   ```
3. Merge the promote PR into `main`.

Batching several ticket SHAs into one promote PR is fine when releasing a wave.

## CI

PRs and pushes to `dev` / `main` run [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml):

`format:check` → `lint` → `typecheck:ci` → `test` → `build`

(`typecheck:ci` skips `@workspace/ui` until ticket 006; then switch CI to full `typecheck`.)

Locally mirror with `pnpm run ci` (not bare `pnpm ci`, which is a clean install).

## Agent rules

- Never commit straight to `dev` or `main`.
- Never open ticket PRs with `--base main`.
- Default base for `gh pr create` in this repo: **`dev`**; enable `gh pr merge --auto --merge`.
- Ticket branches: `git checkout --no-track -b {id} origin/dev` (e.g. `001`; upstream is the ticket branch after push, never `dev`).
- Run **`pnpm run ci`** locally (same steps as GitHub CI) before push/PR; keep remote CI green before merge.
