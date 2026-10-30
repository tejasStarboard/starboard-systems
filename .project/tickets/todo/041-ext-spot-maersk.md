---
id: 041
wave: 04-spot
title: Extension spot.maersk
status: open
depends_on: [040]
epic: SYS-EXT-SPOT
docs:
  - .project/docs/domains/spot.md
  - .project/docs/extensions.md
---

# Extension spot.maersk

## Goal

Implement `spot.maersk` plugin with API and/or scraper strategies behind the spot host interface. Enable manifest; results normalize into rates catalog / quote rate sources.

## Non-goals

- Companion twin sync
- All Maersk edge cases from prod in one PR
- Other carriers

## Files to touch

- Spot worker `plugins/maersk/**`
- Manifest `spot.maersk` enabled path
- Credential config for org
- Reference starboard-2 Maersk code **read-only**; rewrite cleanly into plugin shape

## Acceptance criteria

- [ ] Search job for a sample lane returns structured rates or a clear structured error
- [ ] Extension can be disabled without code changes in shell
- [ ] No imports from starboard-2 at runtime

## Fixtures / tests

- Recorded/fixtures HTTP where possible; avoid live scrape in CI

## Out of scope

Hapag/MSC; OTP/residential IP pool hardening beyond minimal secure config
