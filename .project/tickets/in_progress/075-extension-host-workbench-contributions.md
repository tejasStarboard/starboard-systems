---
id: 075
wave: 06-platform
title: Extension host — workbench contributions + defines
status: in_progress
depends_on: [055, 056]
epic: SYS-PLATFORM
docs:
  - .project/docs/extension-points.md
  - .project/docs/extensions.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/reference/extension-migration-inventory-2026-11-02.md
---

# Extension host — workbench contributions + defines

## Goal

Harden `@starboard/ext-host` + BFF contribution loading beyond `nav` / `uiSlots` strings:

1. Manifest: `contributes.activity` / `views` / `editors` / `commands` (as needed for **074**)
2. Manifest: **`defines.extensionPoints`** so built-ins (e.g. `quoting.document`) can own nested points
3. Host APIs to list active contributions + resolve “who owns point X” + “contributions to point X”
4. Cookbook update — no hard-coded extension ids in kernel

Can ship in parallel with **074** UI chrome; both required before **076**/**077**.

## Acceptance

- [x] Zod schemas + registry tests for new contribute/define fields
- [x] `getActiveWorkbenchContributions` (or equivalent) used by workbench host
- [x] Contribution to a defined point fails closed if owner extension inactive
- [x] `extensions.md` + skill cookbook updated
- [x] Legacy `nav` / `uiSlots` still work (compat) or migrated with a note

## Non-goals

Moving React packages (**076+**); implementing quote slots UI (**073**)
