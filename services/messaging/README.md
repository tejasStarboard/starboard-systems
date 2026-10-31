# services/messaging

Python + **Temporal OSS** worker for messaging extensions (first plugin:
`messaging.msgraph`).

Managed by the root **uv** workspace (`pyproject.toml` → `packages/*`,
`services/*`).

## Local

1. From repo root, sync Python deps once:

```bash
uv sync --all-packages --group dev
```

2. Run with the monorepo (starts Temporal OSS via Docker + messaging):

```bash
pnpm dev
# or:
pnpm --filter @starboard/temporal dev
pnpm --filter @starboard/messaging-service dev
```

Temporal UI: http://localhost:8233 · gRPC: `localhost:7233`.

`messaging` `dev` starts the FastAPI API **and** the Temporal worker in one
process (`starboard-messaging-dev`). It waits quietly for Temporal if the server
is still booting.

Default HTTP port: `3202`. Task queue: `messaging.msgraph`.

## Token storage (encrypted)

OAuth refresh tokens are encrypted with **Fernet** (`MESSAGING_TOKEN_KEY`) and
written under `MESSAGING_DATA_DIR` as per-org JSON
(`connection-{orgId}.json`). Ciphertext only — plaintext never hits disk.

Production should keep the same Fernet envelope and move rows to a dedicated
Neon table owned by this service (one writer). Shell/BFF never sees raw tokens.

## Tests

```bash
pnpm --filter @starboard/messaging-service test
# or from root:
uv run --package starboard-messaging pytest
```

Connect/send tests use `FakeGraphClient` and need no Temporal server. Sync
workflow tests use `WorkflowEnvironment`.

## Plugin

`messaging.msgraph` — stub OAuth connect state machine, Temporal inbox sync
job, outbound send API. Shell works with the extension disabled.
