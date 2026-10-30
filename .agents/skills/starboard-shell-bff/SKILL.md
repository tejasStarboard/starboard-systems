---
name: starboard-shell-bff
description: >-
  Next.js shell BFF patterns for Starboard Systems: Better Auth organization
  tenancy, requireApiSession, orchestrators, service clients, entitlements.
  Use when editing apps/web lib/clients, orchestrators, auth, settings, or
  quote/CRM UI that calls domain services.
---

# Shell BFF (apps/web)

## Auth / tenancy

- Better Auth + **organization plugin** = tenant, members, roles, invitations.
- CRM customers are **not** other orgs — org-scoped CRM domain records.
- API routes: `requireApiSession()` → 401 without session, 400 without active org.
- Pass `organizationId` / `userId` into service clients via `createServiceOptions`.

## Orchestration

- Keep route handlers thin; put aggregation in `lib/*/orchestrator.ts`.
- Enrich across domains in the BFF (e.g. owner name from auth, customer name from CRM).
- Timeouts + normalized errors via `@starboard/service-kit` / existing `ServiceClientError`.
- Optional features: ask extension-host what’s enabled — don’t hardcode extension ids in random components.

## Next.js note

This repo’s Next may differ from training data. Before new App Router APIs, check `apps/web/node_modules/next/dist/docs/` (or workspace Next package docs).

## Related skills

- Org plugin details → `organization-best-practices`
- Auth setup → `better-auth-best-practices` / `create-auth`
- Domain HTTP services → `starboard-bun-service`
