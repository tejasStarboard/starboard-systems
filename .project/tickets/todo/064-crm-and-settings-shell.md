---
id: 064
wave: 06-product
title: CRM fields/contacts + settings shell pages
status: open
depends_on: [004]
epic: SYS-CRM
docs:
  - .project/docs/domains/crm.md
---

# CRM fields/contacts + settings shell pages

## Goal

Expand CRM beyond name-only customers (contacts + core fields aligned with freight CRM needs) and replace empty settings placeholders (`company`, `team`, `profile`, `preferences`, `quote-rules`) with real pages using Better Auth org membership where applicable.

## Non-goals

- VendorIQ / Elasticsearch
- Stripe checkout
- Full prod `companies` flag explosion in one PR — pick a lean field set (address, email, phone, role flags customer/vendor at minimum)

## Acceptance criteria

- [ ] Customer create/edit with expanded fields; list/search still org-scoped
- [ ] Contacts CRUD under a customer
- [ ] Quote picker still works (label = customer name)
- [ ] Team page: members + invite via Better Auth org plugin
- [ ] Company / profile pages persist meaningful data (not empty h1)
- [ ] Domain doc updated

## Out of scope

Public API; ERP
