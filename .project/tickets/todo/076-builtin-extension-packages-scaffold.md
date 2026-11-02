---
id: 076
wave: 06-platform
title: Scaffold driving built-in extension packages + manifests
status: open
depends_on: [075]
epic: SYS-PLATFORM
docs:
  - .project/docs/reference/extension-migration-inventory-2026-11-02.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/extension-points.md
---

# Scaffold driving built-in extension packages + manifests

## Goal

Create empty (or stub) packages and register **driving** manifests default-on for credit+enterprise:

| Id                 | Package (convention TBD in ticket) |
| ------------------ | ---------------------------------- |
| `quoting.document` | stub view + editor factories       |
| `quoting.charges`  | stub (or defer stub until **073**) |
| `crm.parties`      | stub                               |
| `geo.gazetteer`    | stub widgets export                |
| `rates.catalog`    | stub                               |
| `org.settings`     | stub                               |

Wire into `extensions/host` registry. Workbench shows activity/views from stubs. **No** large code moves yet (**077**/**078**).

## Acceptance

- [ ] Package layout convention documented (e.g. `extensions/builtins/quoting-document`)
- [ ] Manifests registered; rollout/entitlements treat as default-on
- [ ] Stub Quotes view + quote editor open in workbench from contribution
- [ ] Kernel-only (built-ins off) → empty workbench still
- [ ] Optional spot/messaging/ingestion unchanged

## Non-goals

Migrate real quote/CRM UI; QV2 parity
