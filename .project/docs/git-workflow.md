# Git workflow

## Branches

| Branch | Role                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------- |
| `dev`  | **Default / primary.** Integration branch. All ticket PRs target `dev`.                         |
| `main` | Production-stable. Updated by **cherry-pick** (or promote PR) from `dev`, never by feature PRs. |

Both `dev` and `main` must be treated as **protected**: no direct pushes; changes only via pull request.

### GitHub branch protection status

This repo is **private** on GitHub Free. Classic branch protection and rulesets returned **HTTP 403** (“Upgrade to GitHub Pro or make this repository public”). Until Pro/public is enabled, enforce the same rules via:

1. Agent/skills + this doc (no push to `dev`/`main`).
2. Optional local hook: `scripts/git-hooks/pre-push` (blocks `git push` to `dev`/`main`).
3. When available, turn on GitHub ruleset **Protect dev and main**: require pull request, no force push, no deletion.

```bash
# Install local guard (once per clone)
ln -sf ../../scripts/git-hooks/pre-push .git/hooks/pre-push
# or: cp scripts/git-hooks/pre-push .git/hooks/pre-push && chmod +x .git/hooks/pre-push
```

## Per-ticket flow

1. Sync: `git fetch origin && git checkout dev && git pull`
2. Branch from `dev`:
   ```bash
   git checkout -b ticket/001-extension-host-skeleton
   ```
   Naming: `ticket/{id}-{slug}` matching `.project/tickets/…`.
3. Implement the ticket; keep the branch scoped to that ticket.
4. Push and open a PR **into `dev`**:
   ```bash
   git push -u origin HEAD
   gh pr create --base dev --title "ticket 001: …" --body "…"
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

Locally mirror with `pnpm ci`.

## Agent rules

- Never commit straight to `dev` or `main`.
- Never open ticket PRs with `--base main`.
- Default base for `gh pr create` in this repo: **`dev`**.
- Keep CI green before merge.
