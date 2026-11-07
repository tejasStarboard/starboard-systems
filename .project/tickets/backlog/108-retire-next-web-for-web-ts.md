---
id: 108
wave: 14-shell-tanstack
title: Retire apps/web (Next) — make web_ts the sole shell BFF
status: backlog
depends_on: []
epic: SYS-SHELL
docs:
  - apps/web_ts/README.md
  - .project/docs/git-workflow.md
  - .project/docs/adr/0001-bff-shell.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
---

# Retire apps/web (Next) — make web_ts the sole shell BFF

**Decision (2026-11-07):** keep developing on **Next.js [`apps/web`](../../../apps/web)** for now. Promote / cut over to TanStack [`apps/web_ts`](../../../apps/web_ts) **later**, after higher-priority backlogs are cleared (101 UX done, 102 commands, 103–107 panel/invoke, etc.). Parallel WIP lands on ticket **109** (branch `109`) — not on UX PRs. Do not block feature work on the TanStack port.

Product surface of `web_ts` is already a near 1:1 structural port (same route map, BFF APIs, domain managers, workbench, e2e specs). Root turbo currently excludes `@starboard/app-web` from default `dev` / `build` / `start` — when continuing on Next, prefer `pnpm --filter @starboard/app-web …` (or restore root filters) until this ticket runs.

Parity review (2026-11-07): structural port is strong; blockers are git/e2e/CI/docs, not missing product routes.

## Goal

When ready: make `@starboard/app-web-ts` the only shell BFF, then remove `apps/web`.

## Prerequisites (acceptance before delete)

- [ ] **Land `web_ts`:** package tracked via ticket **109** / branch `109` (then merge to `dev` when ready)
- [ ] **E2E:** [`tooling/e2e`](../../../tooling/e2e) uses `apps/web_ts` / `@starboard/app-web-ts` (`paths.ts` `webAppRoot`, `run.ts` filter/start, `load-env.ts`, auth under `web_ts/e2e/.auth`, playwright comments); `pnpm test:e2e` green against TanStack (shell + builtin specs)
- [ ] **CI:** [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) writes env into `apps/web_ts` (include `VITE_APP_URL`; drop “Write CI env for Next” → `apps/web` / `NEXT_PUBLIC_*` only); turbo quality includes `@starboard/app-web-ts`
- [ ] **Turbo / root scripts:** `pnpm ci` builds and tests web_ts; no required path still depends on `@starboard/app-web`
- [ ] **Docs / skills / ADR:** retarget shell to TanStack in ADR 0001, README, architecture, extensions.md, `starboard-shell-bff` (+ `*.http.ts` not `*.client.ts`), tickets that hardcode Next paths (e.g. 100–103)
- [ ] **Smoke:** auth (email + OAuth cookies on Start), org switch, impersonation, admin gate, quote create/save/editor-context/PDF, rates, carrier credentials, `/api/extensions/*`
- [ ] Stop new feature work on `apps/web`; fix forward on `web_ts` only (**start of this ticket**, not before)
- [ ] Remove `apps/web` from workspace, lockfile, CI path filters; update `web_ts` README (no longer “parallel reference”)

## Non-goals

- Rewriting extension packages (they already mount in both shells)
- Changing domain Bun/Python services
- Feature work on New Tab / panels (101 / 103–107) beyond path updates when this ticket eventually runs
- Required Playwright in GitHub CI (still ticket **100** follow-up)
- Parallel feature development on both shells (until cutover, **Next only**)

## Notes

- Until this ticket is pulled: land product work on **`apps/web`**; treat `web_ts` as parked / sync opportunistically or re-port at cutover
- Port deltas to keep: `*.http.ts` (not `*.client.ts`), `tanstackStartCookies()`, TanStack route trees under `src/routes/**`, `VITE_APP_URL` (may fall back to `APP_URL` / legacy `NEXT_PUBLIC_APP_URL`)
- Dual-tree drift is expected while Next remains primary — re-sync or regenerate the port when cutover starts
- `router.refresh()` no-ops in some auth hooks on Start — confirm session invalidation UX during smoke

## Out of scope

- Deleting Next or forcing TanStack as default before higher-priority backlogs are done and the checklist above is green
