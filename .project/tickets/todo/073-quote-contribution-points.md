---
id: 073
wave: 06-platform
title: quoting.document defines slots; peel charge/rate contributions
status: open
depends_on: [077, 075]
epic: SYS-PLATFORM
docs:
  - .project/docs/extension-points.md
  - .project/docs/reference/extension-migration-inventory-2026-11-02.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
---

# quoting.document defines slots; peel charge/rate contributions

## Goal

After quote lives in **`quoting.document`**:

1. **`defines`** `quoting.slots.chargeTable` / `headerFields` / `totals` / `rateSources` (+ menus as needed)
2. Move surcharge/globals editors → contribute as **`quoting.charges`** (and globals)
3. Catalog + spot rate sources contribute to `quoting.slots.rateSources` only
4. Kernel remains unaware of slot names

## Acceptance

- [ ] Manifest `defines` + contributions resolve; inactive owner → no mounts
- [ ] Charge UI not imported by kernel or by document package except via slot host
- [ ] Spot/catalog still appear when those extensions active
- [ ] Cookbook + inventory updated

## Non-goals

QV2 grid rewrite (**071**); Incoterm field (**070**) — those land *into* these slots afterward
