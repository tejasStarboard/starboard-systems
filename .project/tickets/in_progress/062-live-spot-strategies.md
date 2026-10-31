---
id: 062
wave: 06-product
title: Live spot strategies (Maersk, then CMA)
status: in_progress
depends_on: [061, 069, 041, 042]
epic: SYS-EXT-SPOT
docs:
  - .project/docs/domains/spot.md
  - .project/docs/extensions.md
---

# Live spot strategies (Maersk, then CMA)

## Goal

Behind `live_strategy` (and org credentials from [069](../todo/069-org-carrier-credentials-settings.md)), run real or near-real carrier search for Maersk first, then CMA. Keep fixture fallback when live is off or unavailable. Surface offers through existing job status/result for 060 apply.

## Non-goals

- Companion desktop
- All carriers
- Scraping hardening / residential proxies at prod scale in one ticket

## Acceptance criteria

- [x] Maersk live path invocable when setting + credentials present
- [x] CMA live path same pattern
- [x] Fixture path unchanged when live off
- [x] Structured offers in job `result`; failures as `status: failed` + error
- [x] No starboard-2 runtime imports; rewrite cleanly into plugins

## Out of scope

Apply-to-lane UI (060); messaging
