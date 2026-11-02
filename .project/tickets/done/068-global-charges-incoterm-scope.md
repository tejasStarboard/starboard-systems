---
id: 068
wave: 06-product
title: Global charges + incoterm / bucket scope
status: done
depends_on: [067]
epic: SYS-PRICING
docs:
  - .project/docs/domains/pricing.md
  - .project/docs/reference/build-priority-2026-11-01.md
---

# Global charges + door bucket scope

## Shipped (clarification 2026-11-02)

Title said “incoterm” but **068 delivered door → bucket scope only** (no pickup → drop origin; no delivery → drop destination) plus quote-level `global_charge`. **No Incoterm field.** Full Incoterm × role knock-out is ticket **[070](../todo/070-incoterm-bucket-scope.md)**.

## Goal

Quote-level global charges (and optional org defaults/settings stamp); apply `isIncludedInTotal` with `excluded_buckets` derived from **door presence** so origin/destination charges drop for port-to-port moves.

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
