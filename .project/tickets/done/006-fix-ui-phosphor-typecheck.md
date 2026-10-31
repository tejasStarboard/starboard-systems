---
id: 006
wave: 00-shell
title: Fix @starboard/lib-ui Phosphor icons + typecheck
status: done
depends_on: []
epic: SYS-SHELL
docs:
  - .project/docs/git-workflow.md
---

# Fix @starboard/lib-ui Phosphor icons + typecheck

## Goal

Make `pnpm exec turbo typecheck --filter=@starboard/lib-ui` pass so CI can drop `typecheck:ci` and use full `pnpm typecheck`.

## Non-goals

- Redesigning the UI kit
- Upgrading Next

## Files to touch

- `packages/ui/src/components/**` — `@phosphor-icons/react` imports use v2 names (`Check`, not `CheckIcon`)
- `packages/ui/src/hooks/use-highlighted-code.ts` — resolve `@starboard/lib-ui/lib/highlighter` (export map is `*.ts` but file is `.tsx`)
- Root `package.json` / `.github/workflows/ci.yml` — switch CI back to `pnpm typecheck` when green

## Acceptance criteria

- [x] `@starboard/lib-ui` typecheck passes
- [x] CI workflow uses `pnpm typecheck` (not `typecheck:ci`)
- [x] Lint still passes

## Fixtures / tests

- `pnpm exec turbo typecheck --filter=@starboard/lib-ui`

## Out of scope

Visual redesign; new components
