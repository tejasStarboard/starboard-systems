---
id: 002
wave: 00-shell
title: Quote lane/cargo/rate persistence
status: open
depends_on: []
epic: SYS-QUOTES
docs:
  - .project/docs/domains/quotes.md
  - docs/architecture.md
---

# Quote lane/cargo/rate persistence

## Goal

Persist quote lanes, cargo, and rates end-to-end: form → BFF orchestrator → quotes service → `quotes` schema → reload into the quote form.

## Non-goals

- Spot search / contract rate search UI
- PDF / email send
- Full ONE MATH package (ticket 010)
- Status workflow machine beyond saving current fields

## Files to touch

- `packages/database` quotes schema (lane / rate tables already sketched — verify)
- `packages/contracts` quote form / save schemas if needed
- `services/quotes` DAO + service `save` / `findFormValues`
- `apps/web/lib/quotes/orchestrator.ts` + API routes
- `apps/web/components/quotes/**` as needed for save/load

## Acceptance criteria

- [ ] Creating/saving a quote with ≥1 lane and cargo round-trips correctly
- [ ] Rates attached to a lane persist and reload
- [ ] Org scoping unchanged (`organizationId` on all queries)
- [ ] No dual-write from Next directly to Drizzle for quote tables (service only)

## Fixtures / tests

- Service-level test or contract test for save → get form values
- Manual smoke: create quote, refresh page, fields intact

## Out of scope

Pricing package extraction; CRM customer entity (004)
