# services/ingestion

Python + **Temporal OSS** worker for rate-doc ingestion extensions.

Managed by the root **uv** workspace (`pyproject.toml` → `packages/*`, `services/*`).

## Local

1. From repo root, sync Python deps once:

```bash
uv sync --all-packages --group dev
```

2. Run with the monorepo (starts Temporal OSS via Docker + ingestion):

```bash
pnpm dev
# or:
pnpm --filter @starboard/temporal dev
pnpm --filter @starboard/ingestion-service dev
```

Temporal UI: http://localhost:8233 · gRPC: `localhost:7233`.

`ingestion` `dev` starts the FastAPI enqueue API **and** the Temporal worker in
one process (`starboard-ingestion-dev`). It waits quietly for Temporal if the
server is still booting.

Default HTTP port: `3201`. Task queue: `ingestion.fcl_v6`.

## Tests

```bash
pnpm --filter @starboard/ingestion-service test
# or from root:
uv run --package starboard-ingestion pytest
```

Pipeline/gate tests need no Temporal server; workflow tests use `WorkflowEnvironment`.

## Plugin

`ingestion.fcl_v6` — ocean FCL CSV vertical slice (plan → extract → gate → HTTP save to `services/rates`). No v3–v5 ports.
