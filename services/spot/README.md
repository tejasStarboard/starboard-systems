# services/spot

Python + **Temporal OSS** worker for spot / carrier rate-search extensions.
Host plugin interface, deterministic `fake` plugin, and fixture-backed
`maersk` plugin. `spot.cma` lands in a later ticket.

Managed by the root **uv** workspace (`pyproject.toml` → `packages/*`,
`services/*`).

## Local

1. From repo root, sync Python deps once:

```bash
uv sync --all-packages --group dev
```

2. Run with the monorepo (starts Temporal OSS via Docker + spot):

```bash
pnpm dev
# or:
pnpm --filter @starboard/temporal dev
pnpm --filter @starboard/spot-service dev
```

Temporal UI: http://localhost:8233 · gRPC: `localhost:7233`.

`spot` `dev` starts the FastAPI API **and** the Temporal worker in one
process (`starboard-spot-dev`). It waits quietly for Temporal if the server
is still booting.

Default HTTP port: `3203`. Task queue: `spot.search`.

## Maersk credentials

Org credentials for `spot.maersk` (JSON map):

```bash
export SPOT_MAERSK_CREDENTIALS='{"org_id":{"username":"u","password":"p"}}'
```

Default strategy is recorded fixtures (`SPOT_MAERSK_STRATEGY=fixture`). Live
browser scrape is not enabled in this build.

## Tests

```bash
pnpm --filter @starboard/spot-service test
# or from root:
uv run --package starboard-spot pytest
```

Plugin unit tests need no Temporal server. Search workflow tests use
`WorkflowEnvironment`.

## Plugins

- `fake` — deterministic rates for registry / Temporal durability tests.
- `maersk` — normalizes recorded productoffers into spot `NormalizedRate`
  rows; missing credentials return a structured error.
