---
name: starboard-shell-bff
description: >-
  Next.js shell BFF patterns for Starboard Systems: Better Auth organization
  tenancy, requireApiSession, domain managers, service clients, entitlements.
  Use when editing apps/web domain clients/managers, auth, settings, or
  quote/CRM UI that calls domain services.
---

# Shell BFF (apps/web)

## Auth / tenancy

- Better Auth + **organization plugin** = tenant, members, roles, invitations.
- CRM customers are **not** other orgs — org-scoped CRM domain records.
- API routes: `requireApiSession()` → 401 without session, 400 without active org.
- Pass `organizationId` / `userId` into service clients via `createServiceOptions`.

## Layering

- **Call site** (`route.ts` / `page.tsx`): auth/session only; call `getXManager().method(...)`.
- **Manager** (`lib/domain/<domain>/<domain>.manager.ts`): cross-client orchestration / enrichment; injectable deps + module `get`/`set`.
- **HTTP client** (`lib/domain/<domain>/<domain>.client.ts`): thin typed fetch to Bun services; constructor `{ baseUrl }`, singleton `get`/`set`. Shared fetch helpers live in `lib/clients/http.ts`.
- **Local DAO** (e.g. `lib/domain/organizations/organizations.dao.ts`): shell DB reads that are not a remote service.
- No free-function domain APIs and no thin wrappers around managers.
- Domain Bun services remain `dao → service → controller`.

## Related skills

- Org plugin details → `organization-best-practices`
- Auth setup → `better-auth-best-practices` / `create-auth`
- Domain HTTP services → `starboard-bun-service`
