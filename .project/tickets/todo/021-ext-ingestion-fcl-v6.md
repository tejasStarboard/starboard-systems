---
id: 021
wave: 02-rates-ingest
title: Extension ingestion.fcl_v6
status: open
depends_on: [001, 020]
epic: SYS-EXT-FCL-V6
docs:
  - .project/docs/extensions.md
  - .project/docs/deprecations.md
  - .project/docs/adr/0002-python-dbos-extensions.md
  - .project/docs/domains/rates.md
---

# Extension ingestion.fcl_v6

## Goal

Ship the first ingestion extension: Python worker + DBOS job for ocean FCL v6-style pipeline (upload → plan → extract → **blocking gate** → save into `services/rates`). Register `ingestion.fcl_v6` in extension-host; shell upload UI appears only when enabled.

## Non-goals

- Porting FCL v3/v4/v5
- Air / LCL / cartage / drayage (separate future extensions)
- Full parity with every prod edge case in one ticket (vertical slice: happy path + failed gate)

## Files to touch

- `services/ingestion` (Python) + fcl_v6 plugin
- `packages/python-kit` if needed
- Extension manifest `enabled` path + BFF `/api/extensions/ingestion.fcl_v6/*`
- Web upload slot contributed by manifest
- Writes to rates service (HTTP), not dual DB write from worker if avoidable

## Acceptance criteria

- [ ] Manifest contributes upload UI only when enabled + entitled
- [ ] Job enqueued; HTTP returns 202 + job id
- [ ] Failed gate does not save rates as success
- [ ] Successful save visible via rates list
- [ ] No imports/ports of v3–v5 pipelines

## Fixtures / tests

- One sample FCL sheet fixture; gate fail fixture

## Out of scope

Other modes; Outlook upload
