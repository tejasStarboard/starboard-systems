---
id: 085
wave: 07-quote-loop
title: QV2 money follow-ons in quoting.charges (per-CT, row FX, equipment)
status: todo
depends_on: [072, 084]
epic: SYS-PRICING
docs:
  - .project/docs/domains/pricing.md
  - .project/docs/domains/quotes.md
  - .project/docs/extension-points.md
  - .project/docs/reference/rewrite-coverage-2026-11-01.md
---

# QV2 money follow-ons in quoting.charges (per-CT, row FX, equipment)

## Extension model

|                  |                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| **Package / id** | **`quoting.charges`** (existing) — **driving built-in**                                                |
| **Layer**        | Built-in. Deepen contribution to `quoting.slots.chargeTable` / `quoting.totalsHooks`; no new kernel UI |
| **Math**         | Extend `@starboard/lib-pricing` + fixtures; ONE MATH only                                              |
| **Unplug test**  | Charges off → empty chargeTable (existing **073** behavior)                                            |

Documented **072** deferrals only — still a **refactor** of QV2, not a new product.

## Goal

Ship the lean next slice of charge-row parity inside `quoting.charges`:

1. **Per-container markup dials** (or documented subset with fixtures) for multi-CT FCL
2. **Row FX display** when line currency ≠ quote currency (display-only OK if convert path deferred — say which)
3. **Equipment / default column** on charge lines where prod shows it

Prefer fixture-backed cases under `packages/pricing` / shared QV2 fixtures.

## Non-goals

- Full surcharge_matrix every tier
- PDF layout (**083**)
- Changing Incoterm matrix (**070**)
- New optional carrier extensions

## Files to touch (approx)

- `extensions/builtins/quoting-charges`
- `packages/pricing` + fixtures/tests
- Quote editor-context payloads if new fields needed
- `pricing.md` / `quotes.md` / rewrite-coverage

## Acceptance

- [ ] Behavior lives only in `quoting.charges` contributions + pricing package
- [ ] Fixtures prove per-CT / FX / equipment cases that are claimed done
- [ ] Deferred cells explicitly listed in domain docs
- [ ] `pnpm run ci` green

## Out of scope

CargoWise codes; Outlook twin
