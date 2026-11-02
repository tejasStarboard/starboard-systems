---
id: 077
wave: 06-platform
title: Migrate quote UI into quoting.document built-in
status: done
depends_on: [074, 075, 076]
epic: SYS-PLATFORM
docs:
  - .project/docs/reference/extension-migration-inventory-2026-11-02.md
  - .project/docs/domains/quotes.md
  - .project/docs/architecture.md
---

# Migrate quote UI into quoting.document built-in

## Goal

Move existing quote product UI from `apps/web` into the **`quoting.document`** package:

- Quotes list → `workbench.views`
- Quote form / lanes → `workbench.editors` (`viewType: quote`)
- Domain clients/managers for quotes travel with the built-in (or shared `lib` imported only by that package)
- Remove kernel ownership of `app/(app)/quote/**` and home quotes table as long-term model

Keep behavior (including current charge UI) working — parity fixes are **071+** after mount.

## Acceptance

- [x] Opening a quote is a workbench editor tab via contribution
- [x] Quotes list is a contributed sidebar/view
- [x] Kernel has no direct import of quote form modules (only workbench hosts)
- [x] Save/load quote still works; CI green
- [x] Inventory doc updated (quote row → migrated)

## Non-goals

Peeling charges into separate package (**073**); Incoterm/markup parity (**070**/**072**)
