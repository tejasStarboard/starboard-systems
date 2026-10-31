# Bun service layers

## Allowed imports

| Layer          | May import                                    |
| -------------- | --------------------------------------------- |
| Controller     | contracts, service-kit, service layer types   |
| Service        | DAO interface, domain errors, contracts types |
| DAO impl       | `@starboard/lib-db`, drizzle                  |
| `container.ts` | wires concrete DAO → service → controllers    |

## Anti-patterns

- Business rules in controllers
- Drizzle calls from controllers or from `apps/web`
- Hard FK to other domains’ tables — use opaque string IDs
- Cross-service DB joins — BFF orchestrates HTTP instead
