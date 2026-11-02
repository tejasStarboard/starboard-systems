---
id: 078
wave: 06-platform
title: Migrate CRM + org.settings (+ geo widgets) into built-ins
status: open
depends_on: [076, 077]
epic: SYS-PLATFORM
docs:
  - .project/docs/reference/extension-migration-inventory-2026-11-02.md
  - .project/docs/domains/crm.md
  - .project/docs/architecture.md
---

# Migrate CRM + org.settings (+ geo widgets) into built-ins

## Goal

- **`crm.parties`** — customers list/detail + customer combobox contributions
- **`org.settings`** — settings views/editors (company, team, profile, …)
- **`geo.gazetteer`** — port/address comboboxes as exports consumed by quote (or contribute widgets into quote-defined slots once **073** exists)

Optional: thin wrap of existing messaging/ingest pages as contributed views (pages already slot-gated).

## Acceptance

- [ ] Customers + settings open via workbench contributions
- [ ] Kernel settings/customers App Router trees deprecated or shim-only
- [ ] Quote still resolves customer + ports
- [ ] Inventory updated

## Non-goals

Full settings product parity with prod; **069** secrets
