---
id: 010
wave: 01-quoting
title: packages/pricing ONE MATH
status: in_progress
depends_on: [002]
epic: SYS-PRICING
docs:
  - .project/docs/domains/pricing.md
  - .project/docs/deprecations.md
---

# packages/pricing ONE MATH

## Goal

Extract a single `packages/pricing` implementation for buy/sell totals, surcharge inclusion, margin, and rounding. Consume it from quotes service and/or web. Seed conformance tests from legacy `starboard-2` shared-fixtures where practical (read-only copy of fixtures into this repo — do not copy twin TS from webapp/add-in).

## Non-goals

- Porting auto-margin ML
- Full incoterm engine parity in one PR (incremental OK if documented)
- Python twin

## Files to touch

- `packages/pricing/**` (new)
- Move/replace helpers currently in `packages/contracts` if they belong here
- Wire quotes form/manual rate totals through the package
- Fixtures under `packages/pricing` or `packages/fixtures`

## Acceptance criteria

- [x] One exported API for manual rate totals (at minimum)
- [x] Conformance tests pass for copied fixtures
- [x] Web/quotes no longer duplicate the same math in two places
- [x] Documented in `.project/docs/domains/pricing.md`

## Fixtures / tests

- Golden fixtures from legacy shared-fixtures/qv2 (subset)

## Out of scope

Spot pricing; carrier-specific quirks
