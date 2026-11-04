---
id: 100
wave: 10-quality
title: Playwright e2e harness + per-extension specs
status: in_progress
depends_on: []
epic: SYS-QUALITY
docs:
  - .project/docs/git-workflow.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
---

# Playwright e2e harness + per-extension specs

## Goal

Ship a hybrid e2e setup for the rewrite:

1. Shared harness package **`@starboard/tool-e2e`** — credentials, DB seed, auth storageState, domain-service bootstrap, workbench locators, shell/extension Playwright config helpers, `starboard-e2e` orchestrator.
2. **Shell** specs under `apps/web/e2e` — auth gates, protected redirects, API 401s, workbench chrome, admin gate.
3. **Extension-owned** specs under `extensions/builtins/*/e2e` — product smoke for each driving built-in (not baked into the webapp).

## Non-goals

- Porting starboard-2 **GGB** (YAML money journeys, spike hooks, alamos twin, Slack flywheel)
- Messaging / spot optional plugin deep e2e
- Cent-accurate pricing / save-reload / PDF total certification (future layer on this harness)
- Wiring Playwright into required GitHub CI yet (local + `pnpm test:e2e` first)

## Files to touch (approx)

- `tooling/e2e/**` — harness package
- `apps/web/e2e/**`, `apps/web/playwright.config.ts`, `apps/web/package.json`
- `extensions/builtins/{crm-parties,org-settings,quoting-*,rates-catalog,geo-gazetteer}/e2e/**` + `playwright.config.ts` + `package.json`
- Root `package.json`, `turbo.json`, `.gitignore`

## Acceptance

- [x] `@starboard/tool-e2e` exports seed, auth setup, locators, `defineShellE2eConfig` / `defineExtensionE2eConfig`
- [x] `pnpm test:e2e` orchestrates: seed → domain services → web → shell Playwright → builtin extension Playwright
- [x] Shell coverage: login/register/forgot, protected routes, BFF 401s, workbench activities, non-staff admin 404
- [x] Builtin smoke: crm, org-settings, quoting.document / charges / incoterm / markup / pdf, rates.catalog, geo.gazetteer
- [x] Specs live in extension packages (hybrid ownership); web keeps kernel/shell only
- [ ] `pnpm run ci` green on the ticket branch
- [ ] PR into `dev` (squash)

## Fixtures

- Idempotent user `e2e@starboard.test` + org `e2e-org` (override via `E2E_*`)
- Best-effort customer + quote seed when CRM/quotes services are up
- Shared `apps/web/e2e/.auth/` storageState (gitignored)

## Out of scope

- GGB port
- CI Playwright job (follow-up)
- Deep quote money journeys
