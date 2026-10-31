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

If tickets `055` / `056` are still open, prefer implementing those over new `spot.*` / ingest modes.

## Rules

1. Shell must work with the extension **disabled**.
2. Contribute nav / UI slots / API prefixes via **manifest only** — no hardcoded feature branches in unrelated shell components.
3. Long work: start Temporal workflow; BFF returns **202 + workflow / run id**.
4. One plugin per carrier (`spot.maersk`) or ingest mode (`ingestion.fcl_v6`).
5. Ocean FCL = **v6 only**. Never port v3–v5.
6. Entitlements: `requiredPlan: ["credit"|"enterprise"]` via extension-host + billing stubs.
7. Unplug: disable manifest → hide UI → stop worker → optional schema drop. Zero surgical shell edits.

## Typical files

- `extensions/host` — types, registry, entitlement filter (`@starboard/ext-host`)
- `apps/web` — list contributions; `/api/extensions/<id>/*` proxy
- `extensions/ingestion|messaging|spot` (Python) + plugin folder + Temporal worker
- `extensions/temporal` — Temporal OSS via Docker (`@starboard/ext-temporal`)
- Manifest stub entry in registry

## More

[reference/checklist.md](reference/checklist.md)
