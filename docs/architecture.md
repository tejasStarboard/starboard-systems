# Architecture

## Monorepo layout

| Directory | Responsibility |
| --- | --- |
| `apps/` | Product apps (Next.js shell BFF) |
| `packages/` | Shared product libraries (`contracts`, `db`, `pricing`, `ui`, …) |
| `tooling/` | Monorepo toolchain (`eslint-config`, `typescript-config`) |
| `services/` | Domain Bun + Hono HTTP APIs (quotes, geography, crm, rates) |
| `extensions/` | Extension host, Python+Temporal workers, Temporal OSS |

### Package naming

| Layer | npm / pnpm name | Python project name |
| --- | --- | --- |
| App | `@starboard/app-<name>` | — |
| Shared lib | `@starboard/lib-<name>` | `starboard-lib-<name>` |
| Tool | `@starboard/tool-<name>` | — |
| Domain service | `@starboard/svc-<name>` | — |
| Extension | `@starboard/ext-<name>` | `starboard-ext-<name>` |

All packages are `private: true`, `license: UNLICENSED`, and should set a one-line `description` plus `repository.directory` pointing at their folder.

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

1. Keep API contracts stable (`@starboard/lib-contracts`).
2. Point the service at its own `POSTGRES_URL` (Neon project/branch).
3. Migrate only that service’s schema (`geo` or `quotes`).
4. Drop leftover same-instance assumptions (none required at the HTTP boundary today).

## Local development

```bash
# root .env — see .env.example
pnpm install
uv sync --all-packages --group dev   # Python workspace: packages/* + extensions/*
pnpm --filter @starboard/lib-contracts build
pnpm --filter @starboard/lib-service-kit build
pnpm --filter @starboard/lib-db build
# drizzle.config schemaFilter includes public + geo + quotes (default is public-only)
pnpm --filter @starboard/lib-db db:push
pnpm --filter @starboard/lib-db db:seed
pnpm dev   # turbo: web + Bun services + Temporal OSS (Docker) + ingestion
```

If `db:push` only drops old `public` tables and seed fails with `relation "quotes.*" does not exist`, create the schemas once then push again:

```sql
CREATE SCHEMA IF NOT EXISTS geo;
CREATE SCHEMA IF NOT EXISTS quotes;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS rates;
```

Default ports: web `3000`, geography `3101`, quotes `3102`, crm `3103`, rates
`3104`, ingestion (Python) `3201`. Async extension workflows use **Temporal OSS**
(`TEMPORAL_ADDRESS`, default `localhost:7233`).

## Deploy

- **Next** — Vercel (or any Node host)
- **Bun services** — Dockerfiles under `services/*/Dockerfile` (Fly, Railway, Render, etc.)
- **Extensions** — Python workers under `extensions/*` + Temporal OSS (`extensions/temporal`)
- Share `INTERNAL_SERVICE_TOKEN` and each service’s `POSTGRES_URL` (same Neon until split)
