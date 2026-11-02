---
id: 081
wave: 06-platform
title: Fix 079 hook pending flags, poll errors, and auth ?next=
status: done
depends_on: [079, 080]
epic: SYS-SHELL
docs:
  - .project/docs/architecture.md
---

# Fix 079 hook pending flags, poll errors, and auth ?next=

## Goal

Follow-up to review of PRs **#56 (079)** / **#57 (080)**. Fix medium/low behavioral bugs in the reusable hooks and invitation return path. No workbench/entitlement changes needed (080 gating is fine).

## Bugs

1. **`useExtensionJob.enqueueAndPoll`** — `pollExtensionJob` failures rethrow; `useRatesUpload` uses `void upload()` → unhandled rejection, no toast. Catch non-abort errors, toast, return `{ ok: false }`. Keep `pending` true while polling (set/clear around poll).
2. **`useImpersonation.start`** — success never clears `pending` (unlike `exit`). Use `finally { setPending(false) }`.
3. **`useOrganizations.enterOrganization`** — success leaves `enteringId` set so all org buttons stay disabled. Clear in `finally`.
4. **`useRatesUpload`** — when poll returns `{ status: "running", error }` (timeout), toast an error (today only failed/cancelled/completed toast).
5. **Login / register** — invitation links use `?next=/invitation?...` but forms ignore it. Read `next` via `useSearchParams`, pass safe same-origin path (`startsWith("/")` and not `//`) as `callbackURL` to `signInEmail` / `signUpEmail` / `GoogleButton`.

## Acceptance

- [x] Poll failures surface a toast; no unhandled rejection from rates upload
- [x] Impersonation start and org enter clear pending/`enteringId` in `finally`
- [x] Rates upload toasts on poll timeout / still-running
- [x] `/login?next=` and `/register?next=` honor safe relative paths (email + Google)
- [x] `pnpm run ci` green

## Non-goals

- Messaging sync UX (enqueue without waiting for Temporal completion)
- Workbench contribution changes
- New hooks beyond the listed fixes
