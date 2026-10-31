---
id: 057
wave: 05-foundation
title: Extension settings schema + persistence (ext-host kit)
status: in_progress
depends_on: [050]
epic: SYS-EXT-HOST
docs:
  - .project/docs/extensions.md
  - .project/docs/adr/0005-extension-foundation.md
  - .project/docs/adr/0003-extension-host.md
---

# Extension settings schema + persistence

## Goal

Extend `@starboard/ext-host` so each extension can **declare** admin-configurable settings (booleans, strings, numbers, selects, secrets) on its manifest. Persist values in the platform schema and expose get/set APIs for the admin UI (ticket 058). Rollout on/off stays separate from these settings.

## Non-goals

- Org-facing settings UI in the customer shell (platform admin only for this ticket; `scope: "organization"` may be declared but org UI is follow-up)
- Wiring every setting into Temporal workers end-to-end (document the read path; optional thin helper)
- Replacing rollout modes (`off` / `common` / `beta` / `on`)

## Design (kit)

Add to manifest `contributes`:

```ts
settings?: Array<{
  key: string              // stable id, e.g. "live_strategy"
  label: string
  description?: string
  type: "boolean" | "string" | "number" | "select" | "secret"
  default?: boolean | string | number | null
  options?: Array<{ value: string; label: string }>  // select
  scope: "platform"        // v1: platform admin only
  required?: boolean
}>
```

- Zod schemas + types exported from `@starboard/ext-host`
- Helper: `getDeclaredSettings(manifest)` / validate values against declaration
- Registry: add **1–2 example settings** on existing stubs (e.g. `spot.maersk`: `live_strategy` boolean; `messaging.msgraph`: `sync_interval_minutes` number) so 058 has something to render — defaults only until saved

## Persistence

- Table e.g. `platform.extension_setting` (`extension_id`, `key`, `value` jsonb, `updated_at`, `updated_by`) unique on `(extension_id, key)` for platform scope
- DAO/manager under `apps/web/lib/domain/platform/`
- Audit log on change (reuse `platform_audit_log`)
- Secrets: store encrypted or redact in list responses (document approach; at minimum never echo raw secret back in GET after save — return `configured: true`)

## APIs (staff-only)

- `GET /api/admin/extensions/settings` — all extensions’ declarations + current values (redacted)
- `PUT /api/admin/extensions/settings` — `{ extensionId, values: Record<key, unknown> }` validate against manifest; reject unknown keys

## Acceptance criteria

- [x] Manifest schema accepts `contributes.settings` with unit tests
- [x] At least two registered extensions declare ≥1 setting
- [x] Staff can read/write settings; non-staff 404
- [x] Invalid type/unknown key → 400
- [x] Missing DB row → use manifest `default`
- [x] `.project/docs/extensions.md` documents settings contribution + storage
- [x] Unplug: deleting settings rows when extension removed is documented (optional migrate)

## Files to touch

- `extensions/host/src/manifest.ts` (+ tests)
- `extensions/host/src/registry.ts` (example settings)
- `packages/database/src/schema/platform.ts`
- `apps/web/lib/domain/platform/**`
- `apps/web/app/api/admin/extensions/settings/route.ts`

## Out of scope

Admin collapsible UI (058); org-scoped settings UI; worker consumption beyond a small `getExtensionSettings(extensionId)` helper if trivial
