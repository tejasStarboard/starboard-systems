# Starboard Systems

pnpm + Turborepo monorepo: Next.js BFF, Bun domain microservices, and Python+Temporal extensions.

See [docs/architecture.md](docs/architecture.md) for layout, package naming, and auth boundaries.

## Layout

| Path                | Package name              | Role                                   |
| ------------------- | ------------------------- | -------------------------------------- |
| `apps/web`          | `@starboard/app-web`      | Next.js orchestrator (Better Auth, UI) |
| `services/<domain>` | `@starboard/svc-<domain>` | Bun + Hono domain APIs                 |
| `extensions/<name>` | `@starboard/ext-<name>`   | Extension host / workers / Temporal    |
| `packages/<lib>`    | `@starboard/lib-<name>`   | Shared libraries                       |
| `tooling/<name>`    | `@starboard/tool-<name>`  | ESLint / TS configs                    |

Python extension projects use `starboard-ext-<name>`; shared Python libs use `starboard-lib-<name>`.

## Develop

```bash
pnpm install
cp .env.example .env   # fill secrets + INTERNAL_SERVICE_TOKEN + service URLs
pnpm --filter @starboard/lib-contracts build
pnpm --filter @starboard/lib-service-kit build
pnpm --filter @starboard/lib-db build
pnpm --filter @starboard/lib-db db:push
pnpm --filter @starboard/lib-db db:seed
pnpm dev
```

## UI components

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

Import from `@starboard/lib-ui/components/button`.
