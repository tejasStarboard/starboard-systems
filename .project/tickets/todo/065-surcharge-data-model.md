---
id: 065
wave: 06-product
title: Surcharge data model + contracts
status: open
depends_on: [002, 020, 010]
epic: SYS-PRICING
docs:
  - .project/docs/domains/pricing.md
  - .project/docs/domains/quotes.md
  - .project/docs/reference/build-priority-2026-11-01.md
---

# Surcharge data model + contracts

## Goal

Persist charge lines for quote rates (and prepare catalog rates): name, leg bucket (`origin` | `freight` | `destination`), usage unit, rate / rate_percentage, currency, inclusion flags, free/min/max usage, buy/sell amounts. Contracts in `@starboard/lib-contracts`. Align with prod `qv2_surcharge` lean subset — not every display-only column.

## Non-goals

- Amount calculation engine (066)
- Global charges table (068)
- Full UI (067)
- Tier matrices / D&D day types

## Acceptance criteria

- [ ] Schema + Zod for surcharge rows linked to quote rates (and/or lane)
- [ ] Usage unit enum (flat, container, teu, cbm, kg, ton, wm, pallet, per_time, percentage, …)
- [ ] Leg + source + is_included_in_total / is_removed / is_visible fields
- [ ] Migrations / db:push path documented
- [ ] Domain docs updated

## Out of scope

Pricing math; admin settings stamp for globals
