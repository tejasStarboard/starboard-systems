---
id: 001
wave: 00-shell
title: Extension host skeleton
status: done
depends_on: []
epic: SYS-EXT-HOST
docs:
  - .project/docs/extensions.md
  - .project/docs/adr/0003-extension-host.md
  - .project/docs/architecture.md
---

# Extension host skeleton

## Goal

Add `extensions/host` with manifest types, an in-repo registry of stub manifests, entitlement helper (`credit` | `enterprise`), and wire the shell so nav/settings can read enabled extensions without hardcoding feature names.

## Non-goals

- No Python workers yet
- No real ingest/spot/messaging behavior
- No admin node-graph UI

## Files to touch

- `extensions/host/**` (new)
- `apps/web` — thin client or server helper to list enabled extensions
- Optional stub settings panel showing registered extensions
- Root workspace / turbo if needed to include the package

## Acceptance criteria

- [x] Manifest Zod (or TS) schema matches `.project/docs/extensions.md`
- [x] Stub manifests registered for `ingestion.fcl_v6`, `messaging.msgraph`, `spot.maersk`, `spot.cma` (all `enabled: false` or inert)
- [x] Shell can list manifests; disabled extensions do not appear as active contributions
- [x] Package builds in the monorepo
- [x] Short note in `.project/docs/extensions.md` if schema drifts

## Fixtures / tests

- Unit test: entitlement filter (credit vs enterprise)
- Unit test: disabled extension excluded from contributions

## Out of scope

Implementing any extension worker; billing Stripe checkout (see 005 for plan stubs only)
