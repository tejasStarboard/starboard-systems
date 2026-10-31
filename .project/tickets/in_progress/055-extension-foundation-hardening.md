---
id: 055
wave: 05-foundation
title: Extension foundation hardening (UI / BFF / Temporal contract)
status: in_progress
depends_on: [001, 050]
epic: SYS-EXT-HOST
docs:
  - .project/docs/adr/0005-extension-foundation.md
  - .project/docs/adr/0003-extension-host.md
  - .project/docs/extensions.md
  - .agents/skills/starboard-extension/SKILL.md
---

# Extension foundation hardening

## Goal

Make the extension host the **stable platform** for building future extensions (contract rates, spot, ingest modes, messaging). After this ticket, a developer can add a new extension by: manifest + worker plugin + contributions — **without** forking one-off Next routes or crashing the shell when the extension is off.

## Non-goals

- Live carrier scrapers / real Graph OAuth / Excel ingest
- Applying rates onto quote lanes (follow-up product ticket)
- Admin node-graph UI
- Changing Temporal itself

## Deliverables

### 1. Activation resilience

- [x] `(app)` layout / `listActive*` helpers: if `getRolloutMap()` fails, **fail closed** (treat as no extra rollouts / or empty active set) **without** crashing Quotes — document choice in ADR/extensions.md (prefer: log + empty contributions so shell stays up; API gates still require successful activation when DB is healthy)
- [x] Decide and document: missing rollout row = `on` (current) stays

### 2. Generic BFF extension API

- [x] Replace per-extension duplicated `app/api/extensions/<literal-id>/…` with a **generic** pattern, e.g. `app/api/extensions/[extensionId]/[[...path]]/route.ts` (or thin factories), always calling `requireActiveExtension(extensionId)` first
- [x] Dispatch to the correct domain manager using `manifest.worker` / contributes.api (spot search, ingest jobs, messaging) — unknown id or inactive → 404
- [x] Client helpers build URLs from `extensionId`, not string-literal sprawl in random components

### 3. Shared async job contract

- [x] Standard enqueue response: `{ workflowId, runId }` + 202
- [x] Standard status/result: `GET …/jobs/:workflowId` (or query) returning `{ status, result?, error? }` for ingestion + spot at minimum
- [x] UI: upload form + spot sheet poll or refresh status (no “ids only” dead-end)

### 4. Contribution-only UI

- [x] Nav / uiSlots already contribution-driven — keep that
- [x] Spot rate sources + upload/inbox pages remain gated on slots
- [x] Document forbidden pattern: `if (extensionId === "spot.maersk")` in shell core

### 5. Cookbook + proof

- [x] Expand `.project/docs/extensions.md` into a **how to add an extension** guide (manifest → worker → BFF → UI slot)
- [x] Update `starboard-extension` skill checklist to match
- [x] Automated test or scripted smoke: all manifests `enabled: false` (or rollout `off`) → quotes page still renders; extension APIs 404; nav has no Rate upload / Inbox

## Acceptance criteria

- [x] Toggling any registered extension off (rollout `off` or `enabled: false`) does not 500 the app shell
- [x] Adding a new spot carrier requires registry + plugin + (at most) manager dispatch entry — **not** a new copy-pasted `route.ts` tree
- [x] Ingest and spot expose job status/result usable from the web UI
- [x] ADR 0005 + extensions.md cookbook merged
- [x] Unit tests for generic gate + entitlements; smoke for all-off shell

## Files to touch (expected)

- `extensions/host/**`
- `apps/web/app/api/extensions/**`
- `apps/web/lib/extensions.ts`, `lib/auth/require-active-extension.ts`
- `apps/web/lib/domain/{spot,ingestion,messaging}/**`
- `apps/web/components/{rates,quotes,messaging}/**` as needed for status
- `.project/docs/extensions.md`, skill reference
- Possibly Python workers: status query handlers

## Out of scope

Product “apply rate to lane”; CRM fields; Stripe
