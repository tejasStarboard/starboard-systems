# Architecture

## Overview

Starboard uses a **BFF + domain microservices** layout:

| Process                           | Role                                                                        | State                       |
| --------------------------------- | --------------------------------------------------------------------------- | --------------------------- |
| `apps/web` (Next.js)              | Orchestrator / BFF: Better Auth, session cookies, RBAC, response enrichment | **Stateful** (auth context) |
| `services/quotes` (Bun + Hono)    | Quote CRUD + reference container/pallet types                               | **Stateless**               |
| `services/geography` (Bun + Hono) | Currencies (ports/locations next)                                           | **Stateless**               |

Domain services never read cookies or Better Auth. The BFF resolves `userId` / `organizationId`, then calls services with `Authorization: Bearer <INTERNAL_SERVICE_TOKEN>` and `X-Organization-Id`.

```
Browser --cookie--> Next BFF --service token--> Bun services --> Neon
                       |
                       +--> auth schema (Better Auth)
```

## Layers (each Bun service)

1. **Controller** — HTTP + Zod validation
2. **Service** — business rules
3. **DAO** — Drizzle persistence
4. **Composition root** — `createContainer()` wires constructor injection

## Data ownership (shared Neon)

Postgres schemas:

- `public` / auth tables — owned by Next + Better Auth
- `geo.*` — geography service
- `quotes.*` — quotes service

Cross-domain foreign keys are **softened** to opaque text IDs. Integrity for `ownerId` / `organizationId` / `customerId` is enforced by the BFF.

### Path to DB-per-service

1. Keep API contracts stable (`@starboard/contracts`).
2. Point the service at its own `POSTGRES_URL` (Neon project/branch).
3. Migrate only that service’s schema (`geo` or `quotes`).
4. Drop leftover same-instance assumptions (none required at the HTTP boundary today).

## Local development

```bash
# root .env — see .env.example
pnpm install
pnpm --filter @starboard/contracts build
pnpm --filter @starboard/service-kit build
pnpm --filter @starboard/db build
# drizzle.config schemaFilter includes public + geo + quotes (default is public-only)
pnpm --filter @starboard/db db:push
pnpm --filter @starboard/db db:seed
pnpm dev   # turbo: web + quotes + geography
```

If `db:push` only drops old `public` tables and seed fails with `relation "quotes.*" does not exist`, create the schemas once then push again:

```sql
CREATE SCHEMA IF NOT EXISTS geo;
CREATE SCHEMA IF NOT EXISTS quotes;
```

Default ports: web `3000`, geography `3101`, quotes `3102`.

## Deploy

- **Next** — Vercel (or any Node host)
- **Bun services** — Dockerfiles under `services/*/Dockerfile` (Fly, Railway, Render, etc.)
- Share `INTERNAL_SERVICE_TOKEN` and each service’s `POSTGRES_URL` (same Neon until split)
