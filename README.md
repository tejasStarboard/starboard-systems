# Starboard Systems

pnpm + Turborepo monorepo: Next.js BFF with Bun domain microservices.

See [docs/architecture.md](docs/architecture.md) for the production layout (auth in Next, quotes + geography as stateless Bun services, shared Neon with `geo` / `quotes` schemas).

## Apps & services

| Path                   | Role                                            |
| ---------------------- | ----------------------------------------------- |
| `apps/web`             | Next.js orchestrator (Better Auth, UI)          |
| `services/quotes`      | Quotes API (Bun + Hono)                         |
| `services/geography`   | Geography / currency API (Bun + Hono)           |
| `packages/contracts`   | Shared Zod API contracts                        |
| `packages/database`    | Drizzle schemas + client                        |
| `packages/service-kit` | Service token, request IDs, HTTP client helpers |
| `packages/ui`          | Shared UI                                       |
| `packages/email`       | Resend templates                                |

## Develop

```bash
pnpm install
cp .env.example .env   # fill secrets + INTERNAL_SERVICE_TOKEN + service URLs
pnpm --filter @starboard/contracts build
pnpm --filter @starboard/service-kit build
pnpm --filter @starboard/db build
pnpm --filter @starboard/db db:push
pnpm --filter @starboard/db db:seed
pnpm dev
```

## UI components

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

Import from `@workspace/ui/components/button`.
