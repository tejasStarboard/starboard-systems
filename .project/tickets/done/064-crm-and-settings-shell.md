---
id: 064
wave: 06-product
title: CRM fields/contacts + settings shell pages
status: done
depends_on: [004]
epic: SYS-CRM
docs:
  - .project/docs/domains/crm.md
---

# CRM fields/contacts + settings shell pages

## Goal

Expand CRM beyond name-only customers (contacts + core fields aligned with freight CRM needs) and replace empty settings placeholders (`company`, `team`, `profile`, `preferences`, `quote-rules`) with real pages using Better Auth org membership where applicable. Follow-on UX: paginated CRM/quotes lists, separate Active toggle, and extension nav grouping.

## Non-goals

- VendorIQ / Elasticsearch
- Stripe checkout
- Full prod `companies` flag explosion in one PR — pick a lean field set (address, email, phone, role flags customer/vendor at minimum)

## Acceptance criteria

- [x] Customer create/edit with expanded fields; list/search still org-scoped
- [x] Contacts CRUD under a customer
- [x] Quote picker still works (label = customer name)
- [x] Team page: members + invite via Better Auth org plugin
- [x] Company / profile pages persist meaningful data (not empty h1)
- [x] Domain doc updated
- [x] CRM / settings / auth forms use RHF + zodResolver; validation errors toast (not inline-only)
- [x] Customer Active is a separate bottom-bar toggle (not a form field); inactive disables Undo/Save and all account fields while showing saved values
- [x] Customers list + contacts sheet paginate via DB `limit`/`offset` (`page`, `pageSize`, `total`, optional `q`)
- [x] Quotes table paginates the same way through quotes DAO → BFF → UI
- [x] Extension nav renders in `NavExtensions` under Platform (not mixed into `NavMain`)

## Out of Scope

Public API; ERP; infinite-scroll / cursor pagination
