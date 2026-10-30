# Git workflow

## Branches

| Branch | Role |
|--------|------|
| `dev` | **Default / primary.** Integration branch. All ticket PRs target `dev`. |
| `main` | Production-stable. Updated by **cherry-pick** (or promote PR) from `dev`, never by feature PRs. |

Both `dev` and `main` are **protected**: no direct pushes; changes only via pull request.

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

## Agent rules

- Never commit straight to `dev` or `main`.
- Never open ticket PRs with `--base main`.
- Default base for `gh pr create` in this repo: **`dev`**.
