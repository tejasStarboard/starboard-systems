---
name: starboard-extension
description: >-
  Build Starboard VS Code-style extensions (manifests, UI contributions,
  Python + Temporal OSS workers, per-carrier or per-mode plugins). Use when
  working on extension-host, ingestion.fcl_v6, messaging.msgraph, spot.*, or
  plug/unplug.
---

# Starboard extensions

## Read first

- [extensions.md](../../../.project/docs/extensions.md)
- [adr/0005-extension-foundation.md](../../../.project/docs/adr/0005-extension-foundation.md) — **foundation before new product extensions**
- [adr/0003-extension-host.md](../../../.project/docs/adr/0003-extension-host.md)
- [adr/0002-python-temporal-extensions.md](../../../.project/docs/adr/0002-python-temporal-extensions.md)

If ticket `056` is still open, prefer finishing the cookbook over new product carriers.

## Rules

1. Shell must work with the extension **disabled** (and when rollout map read fails — fail closed).
2. Contribute nav / UI slots / API prefixes via **manifest only** — no `if (extensionId === "…")` in unrelated shell components.
3. Long work: start Temporal workflow; BFF returns **202 + workflow / run id**; expose **GET job status** `{ status, result?, error? }`.
4. BFF is **generic** (`/api/extensions/[extensionId]/[[...path]]`) — never add a new per-id Next `route.ts` tree.
5. One plugin per carrier (`spot.maersk`) or ingest mode (`ingestion.fcl_v6`).
6. Ocean FCL = **v6 only**. Never port v3–v5.
7. Entitlements: `requiredPlan: ["credit"|"enterprise"]` via extension-host + billing stubs. Missing rollout row = **on**.
8. Unplug: disable manifest / rollout off → hide UI → stop worker → optional schema drop. Zero surgical shell edits.

## Typical files

- `extensions/host` — types, registry, entitlement filter (`@starboard/ext-host`)
- `apps/web` — `lib/extensions.ts`, `lib/extensions-api-dispatch.ts`, generic extensions API route
- `extensions/ingestion|messaging|spot` (Python) + plugin folder + Temporal worker
- `packages/python-kit` — `describe_job` shared status helper
- `extensions/temporal` — Temporal OSS via Docker (`@starboard/ext-temporal`)

## More

[reference/checklist.md](reference/checklist.md)
