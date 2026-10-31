---
id: 066
wave: 06-product
title: Surcharge amount engine in packages/pricing
status: in_progress
depends_on: [065, 010]
epic: SYS-PRICING
docs:
  - .project/docs/domains/pricing.md
  - .project/docs/reference/build-priority-2026-11-01.md
---

# Surcharge amount engine in packages/pricing

## Goal

Compute buy/sell surcharge amounts from unit + quantity + % of freight, reusing `getEffectiveUsageAmount` and `isIncludedInTotal`. Port golden fixtures from starboard-2 shared-fixtures where practical.

## Non-goals

- UI
- FX conversion (stub currency = lane currency)
- Tiered LCL matrices (follow-up)

## Acceptance criteria

- [x] `calculateSurchargeAmount` (or equivalent) for main units + percentage of base freight
- [x] Base freight discovery helper (is_base_freight / name allowlist lean version)
- [x] Fixture tests green
- [x] Exported from `@starboard/lib-pricing`

## Out of scope

Wiring to quote save (067)
