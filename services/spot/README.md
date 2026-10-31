# services/spot

Python + **Temporal OSS** worker for spot / carrier rate-search extensions.
Host plugin interface plus a deterministic `fake` plugin for tests. Real
carriers (`spot.maersk`, `spot.cma`) land in later tickets.

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

## Tests

```bash
pnpm --filter @starboard/spot-service test
# or from root:
uv run --package starboard-spot pytest
```

Fake plugin unit tests need no Temporal server. Search workflow tests use
`WorkflowEnvironment`.

## Plugin

`fake` — deterministic rates for registry / Temporal durability tests. Shell
lists active spot sources via extension-host `quote.rateSources` (manifest
`spot.fake`).
