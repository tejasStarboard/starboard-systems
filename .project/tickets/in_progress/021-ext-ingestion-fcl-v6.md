---
id: 021
wave: 02-rates-ingest
title: Extension ingestion.fcl_v6
status: in_progress
depends_on: [001, 020]
epic: SYS-EXT-FCL-V6
docs:
  - .project/docs/extensions.md
  - .project/docs/deprecations.md
  - .project/docs/adr/0002-python-temporal-extensions.md
  - .project/docs/domains/rates.md
---

# Extension ingestion.fcl_v6

## Goal

Ship the first ingestion extension: Python worker + **Temporal OSS** workflow for
ocean FCL v6-style pipeline (upload → plan → extract → **blocking gate** → save
into `services/rates`). Register `ingestion.fcl_v6` in extension-host; shell
upload UI appears only when enabled.

## Non-goals

- Porting FCL v3/v4/v5
- Air / LCL / cartage / drayage (separate future extensions)
- Full parity with every prod edge case in one ticket (vertical slice: happy path + failed gate)
- Temporal Cloud (OSS / local or self-hosted server only)

## Files to touch

- `services/ingestion` (Python) + fcl_v6 plugin + Temporal worker
- `packages/python-kit` if needed (Temporal client helpers, service token)
- Extension manifest `worker.kind: python-temporal` + `enabled` path + BFF
  `/api/extensions/ingestion.fcl_v6/*`
- Web upload slot contributed by manifest
- Writes to rates service (HTTP), not dual DB write from worker if avoidable

## Acceptance criteria

- [x] Manifest contributes upload UI only when enabled + entitled
- [x] Workflow started; HTTP returns 202 + workflow / run id
- [x] Failed gate does not save rates as success
- [x] Successful save visible via rates list
- [x] No imports/ports of v3–v5 pipelines
- [x] Durability via Temporal OSS

## Fixtures / tests

- One sample FCL sheet fixture; gate fail fixture

## Out of scope

Other modes; Outlook upload; Temporal Cloud
