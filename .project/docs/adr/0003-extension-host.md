# ADR 0003 — VS Code–style extension host

## Status

Accepted

## Context

Starboard’s primary product is quoting (+ CRM). Spot search, rate ingestion, Outlook email, add-ins, etc. are workflow enhancers. Hard-wiring them into the web app recreates the unpluggable monolith.

## Decision

- Treat `apps/web` as a **shell**; optional capabilities are **extensions** with manifests.
- `packages/extension-host` holds manifest types, registry load, and entitlement checks (`credit` | `enterprise`).
- BFF exposes `/api/extensions/<id>/*` only for enabled + entitled extensions.
- Nav, upload tabs, and rate-source slots render from contributions — not hardcoded feature flags scattered in components.
- First extensions: `ingestion.fcl_v6`, `messaging.msgraph`, `spot.maersk`, `spot.cma`.

## Consequences

- Unplug = disable manifest + stop worker; shell stays intact.
- Future admin node-graph reads the same registry.
- Feature agents implement one extension ticket without rewriting shell core.
