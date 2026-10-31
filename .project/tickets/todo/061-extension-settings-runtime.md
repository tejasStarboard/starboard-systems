---
id: 061
wave: 06-product
title: Extension settings runtime consumption
status: open
depends_on: [057, 058, 055]
epic: SYS-EXT-HOST
docs:
  - .project/docs/extensions.md
  - .project/docs/adr/0005-extension-foundation.md
---

# Extension settings runtime consumption

## Goal

Admin-saved extension settings (057/058) must reach workers and BFF dispatch — e.g. `spot.maersk` `live_strategy`, `messaging.msgraph` `sync_interval_minutes`. Today settings are stored but unused.

## Non-goals

- New setting types
- Org-scoped settings UI
- Implementing full live Maersk API (062)

## Acceptance criteria

- [ ] Documented read path: BFF resolves settings when enqueueing / workers fetch securely
- [ ] `live_strategy` false → fixture path; true → live path stub or error `live_unavailable` until 062
- [ ] `sync_interval_minutes` affects messaging sync schedule or job input
- [ ] Missing DB value → manifest default
- [ ] Secrets never logged

## Files to touch

- `apps/web/lib/domain/platform/**` + extension managers
- `extensions/spot`, `extensions/messaging` workers
- Tests proving setting flips behavior

## Out of scope

Live strategy implementation details beyond the switch (062)
