---
id: 109
wave: 14-shell-tanstack
title: Land TanStack Start parallel shell (apps/web_ts)
status: todo
depends_on: []
epic: SYS-SHELL
docs:
  - apps/web_ts/README.md
  - .project/docs/git-workflow.md
  - .project/tickets/backlog/108-retire-next-web-for-web-ts.md
---

# Land TanStack Start parallel shell (`apps/web_ts`)

Park the WIP TanStack Start port **outside** UX ticket **101**. Product work stays on Next `apps/web` until cutover (**108**).

**Branch:** `109` (do not merge into `101` PRs).

## Goal

Track and land `@starboard/app-web-ts` as a **parallel** shell BFF (TanStack Start + Vite) so it can be developed without blocking Next UX/polish.

## Non-goals

- Deleting or retiring `apps/web` — that is **108**
- Replacing default `pnpm dev` / CI quality gate with TanStack only
- Feature parity chase for every **101** polish delta on day one (re-port or sync as needed)

## Files to touch

- `apps/web_ts/**` (untracked WIP at ticket write — restore from branch `109`)
- Root wiring only as needed for optional filter runs: `package.json` (`--filter=!@starboard/app-web-ts` on default `dev`/`build`/`start`), `turbo.json` (`.output/**`, `VITE_APP_URL`), `.env.example` (`VITE_APP_URL`), `.github/workflows/ci.yml` path filters, `pnpm-lock.yaml`

## Acceptance

- [ ] `apps/web_ts` committed on branch `109` (or merged to `dev` when ready) with README run instructions
- [ ] Default root `pnpm dev` / `build` / `start` still exclude `@starboard/app-web-ts` so Next remains the daily driver
- [ ] `pnpm --filter @starboard/app-web-ts dev` boots; auth + org smoke documented
- [ ] Lockfile / workspace includes the package without forcing it into every turbo pipeline
- [ ] Ticket **108** prerequisites updated if landing on `dev` changes “Land web_ts” checkbox

## Out of scope

- Full e2e harness cutover, ADR retarget, deleting Next (**108**)
- Quote UX polish already shipped on Next under **101**

## Notes

- Structural port is near 1:1 with `apps/web` (routes, BFF, workbench). Better Auth uses `tanstackStartCookies()`; domain HTTP clients are `*.http.ts`.
- Keep developing product on **`apps/web`** until **108**.
