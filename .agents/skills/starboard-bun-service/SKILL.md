---
name: starboard-bun-service
description: >-
  Create or extend Starboard Bun + Hono domain microservices (controller,
  service, DAO, createContainer). Use when adding domain services/*
  (quotes/geography/rates/crm), or wiring @starboard/lib-service-kit auth.
  Python/Temporal extension workers live under extensions/ — use
  starboard-extension.
---

# Bun domain service

## Pattern (copy from existing services)

Mirror `services/quotes` or `services/geography`:

1. **Controller** — Hono routes + Zod from `@starboard/lib-contracts`
2. **Service** — business rules + typed errors
3. **DAO** — interface + Drizzle impl on `@starboard/lib-db`
4. **`createContainer()`** — composition root / constructor injection

## Auth

- Middleware: `INTERNAL_SERVICE_TOKEN` bearer + `X-Organization-Id` + request id (`@starboard/lib-service-kit`)
- Never read cookies or Better Auth session in the service
- Every query filters by `organizationId` from the header

## Checklist for a new service

- [ ] `services/<name>/` + Dockerfile
- [ ] `packages/contracts/src/<name>.ts` schemas
- [ ] `packages/database` `pgSchema("<name>")` + drizzle `schemaFilter`
- [ ] Workspace / turbo / `.env.example` URL + port
- [ ] `apps/web/lib/domain/<name>/<name>.client.ts` + `<name>.manager.ts` (shell skill)
- [ ] Domain stub update in `.project/docs/domains/`

## Detail

See [reference/layers.md](reference/layers.md) for layer rules and anti-patterns.
