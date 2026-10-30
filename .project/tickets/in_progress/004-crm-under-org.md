---
id: 004
wave: 00-shell
title: CRM customers under Better Auth org
status: in_progress
depends_on: []
epic: SYS-CRM
docs:
  - .project/docs/domains/crm.md
  - .project/docs/adr/0001-bff-shell.md
---

# CRM customers under Better Auth org

## Goal

Stop treating other Better Auth organizations as customers. Add `services/crm` (or equivalent) with customers/contacts scoped by `organizationId` from the shell’s active org. Quote form customer picker uses CRM.

## Non-goals

- VendorIQ / Elasticsearch / CSV import
- Replacing Better Auth org membership/roles
- Full vendor CRM UI

## Files to touch

- `packages/database` — `crm` schema
- `packages/contracts` — CRM DTOs
- `services/crm/**` (new) — controller/service/DAO/container
- `apps/web` — client, orchestrator, replace org-as-customer picker
- `drizzle.config` schemaFilter + `.env.example` URL if needed

## Acceptance criteria

- [x] Customer list/create scoped to active org only
- [x] Quote create/save references CRM customer id (opaque text), not peer org id
- [x] Better Auth remains source of tenancy/roles
- [x] Service follows Bun layering pattern

## Fixtures / tests

- [x] Org isolation test: org A cannot read org B customers

## Out of scope

Billing; messaging; Elasticsearch
