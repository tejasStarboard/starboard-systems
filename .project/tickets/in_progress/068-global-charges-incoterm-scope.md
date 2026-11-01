---
id: 068
wave: 06-product
title: Global charges + incoterm / bucket scope
status: in_progress
depends_on: [067]
epic: SYS-PRICING
docs:
  - .project/docs/domains/pricing.md
  - .project/docs/reference/build-priority-2026-11-01.md
---

# Global charges + incoterm / bucket scope

## Goal

Quote-level global charges (and optional org defaults/settings stamp); apply `isIncludedInTotal` with excluded_buckets / incoterm scope so origin/destination charges drop correctly for door terms.

## Non-goals

- Full settings rate-item admin from prod
- Hidden-charge absorb into freight (can be small follow-up in same PR if cheap)

## Acceptance criteria

- [ ] `global_charge` (or equivalent) on quote
- [ ] Scope exclusion wired through pricing + UI
- [ ] Fixture coverage for global + scope cases
- [ ] Domain doc updated

## Out of scope

Trucking-only “surcharges” remapping edge cases unless needed for FCL path
