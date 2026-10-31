---
id: 058
wave: 05-foundation
title: Admin extensions page — collapsible per-extension settings
status: in_progress
depends_on: [057]
epic: SYS-PLATFORM-ADMIN
docs:
  - .project/docs/extensions.md
  - .project/tickets/in_progress/057-extension-settings-schema.md
---

# Admin extensions page — collapsible per-extension settings

## Goal

On `/admin/extensions`, each extension is a **collapsible** row. Expanded body shows:

1. Existing rollout controls (mode + beta org list + save) — keep behavior
2. **Declared settings** from the manifest (inputs, toggles, selects, secret fields) loaded/saved via 057 APIs

Extensions with zero `contributes.settings` still collapse/expand but show only rollout (or a short “No settings declared” note).

## Non-goals

- Customer org settings pages
- Building settings for every future extension — use whatever 057 registered as examples
- Redesigning the entire admin IA

## UX

- List of extensions (same order as registry)
- Collapsible header: displayName, id, manifest enabled badge, rollout mode summary
- Expand: rollout section + settings form
- Settings controls mapped by `type`:
  - `boolean` → switch/checkbox
  - `string` / `number` → input
  - `select` → select from `options`
  - `secret` → password input; if already configured, placeholder “••••” + optional clear
- Save settings (separate button or combined with rollout — prefer **separate** “Save settings” to avoid accidental rollout changes)
- Empty settings: muted copy “This extension exposes no admin settings.”
- Loading / error / success feedback consistent with current rollout panel

## Acceptance criteria

- [x] Collapsed by default (or remember open id in local state only — no persistence required)
- [x] Expanding shows settings fields for extensions that declared them
- [x] Toggle/input changes persist via PUT and survive refresh
- [x] Extension with no settings still has rollout UI inside the collapsible
- [x] Non-staff still cannot reach `/admin/extensions`
- [x] No crash if settings GET fails — show error inside panel

## Files to touch

- `apps/web/app/(admin)/admin/extensions/page.tsx` — pass declarations + values
- `apps/web/components/admin/extension-rollout-panel.tsx` (or split `extension-admin-panel.tsx`)
- Prefer `@starboard/lib-ui` collapsible/accordion if available; otherwise minimal disclosure pattern matching existing admin chrome

## Out of scope

Kit/schema work (057); Temporal job wiring of settings
