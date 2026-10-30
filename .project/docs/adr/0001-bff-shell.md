# ADR 0001 — Next.js BFF as shell

## Status

Accepted

## Context

Production Starboard dual-writes from Next API routes and Python into the same Postgres, with business logic in ~550 BFF routes. The rewrite needs a single auth boundary and thin orchestration.

## Decision

- `apps/web` (Next.js) is the **only** cookie / Better Auth boundary.
- Domain Bun services are stateless and authenticate with `INTERNAL_SERVICE_TOKEN` + `X-Organization-Id` + `X-Request-Id`.
- BFF owns session resolution, RBAC, cross-domain enrichment, and extension activation.
- BFF does **not** own domain persistence for quotes/geo/rates/crm (those services do).

## Consequences

- Clear tenancy and auth story via Better Auth organization plugin.
- Fan-out timeouts and error normalization live in `packages/service-kit`.
- Optional work goes through extension host, not new fat API routes with business rules.
