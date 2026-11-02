---
id: 080
wave: 06-platform
title: Retire legacy shell shim and temporary markings
status: in_progress
depends_on: [073, 078, 079]
epic: SYS-PLATFORM
docs:
  - .project/docs/reference/extension-migration-inventory-2026-11-02.md
  - .project/docs/extensions.md
  - .project/docs/architecture.md
---

# Retire legacy shell shim and temporary markings

## Goal

Clear remaining **temporary / legacy** markings left after Phase A:

1. Delete `legacyShellContributions` (`TEMPORARY` catch-all `page` + Extensions-nav shim from **074**).
2. Migrate `ingestion.fcl_v6` / `messaging.msgraph` from `contributes.nav` + `uiSlots` to proper `activity` / `views` / `editors` with static deep links (`/rates/upload`, `/messaging/inbox`).
3. Gate those route pages with `isExtensionActive` (drop `uiSlots` for those two).
4. Remove dead deprecated `portOptionSchema` alias; fix stale “until 073” / shim comments.

## Audit (what this ticket covers)

| Marker                                          | Action                                              |
| ----------------------------------------------- | --------------------------------------------------- |
| `legacyShellContributions` TEMPORARY (074)      | **Delete** — rates/messaging contribute editors     |
| `contributes.nav` + Extensions activity         | **Replace** with workbench activity/views           |
| `uiSlots: rates.upload` / `messaging.inbox`     | **Remove**; page gates use `isExtensionActive`      |
| `portOptionSchema` `@deprecated`                | **Delete** (unused)                                 |
| Stale comments (geo “until 073”, “compat shim”) | **Rewrite** to current model                        |
| `/settings/customers` redirects                 | **Keep** as permanent URL redirects (not temporary) |

## Acceptance

- [x] No `legacyShellContributions` / catch-all `/*` page editor
- [x] Rates upload + messaging inbox appear via host workbench contributions when active
- [x] Page routes still entitlement-gated; inactive extension → redirect/unavailable
- [x] `portOptionSchema` gone; comments/docs updated
- [x] `pnpm run ci` green

## Non-goals

- Moving rates/messaging UI into builtin packages (pages stay thin route anchors)
- Removing `contributes.nav` / `uiSlots` schema fields (other extensions may use later)
- QV2 parity (**071**/**070**/**072**) or carrier credentials (**069**)
