---
id: 074
wave: 06-platform
title: Workbench shell (kernel UI regions)
status: open
depends_on: []
epic: SYS-PLATFORM
docs:
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/extension-points.md
  - .project/docs/architecture.md
  - .project/docs/reference/extension-migration-inventory-2026-11-02.md
  - .project/docs/reference/build-priority-2026-11-01.md
---

# Workbench shell (kernel UI regions)

## Goal

Replace the multi-page `(app)` product UX owner model with a **VS Code–style workbench** in the kernel:

- Auth routes + **one** authenticated workbench surface
- Region hosts: activity bar, sidebar, **center editor tabs**, (stub) panels
- Deep links open/focus editor tabs (preserve shareable quote URLs)
- **No** product feature modules permanently owned by kernel pages

Inventory: [extension-migration-inventory-2026-11-02.md](../../docs/reference/extension-migration-inventory-2026-11-02.md).

## Acceptance

- [ ] Workbench layout chrome renders with empty regions when no contributions
- [ ] Tab host can open/close/focus editors by `viewType` + resource id (stub editor OK)
- [ ] Deep link path for quote id resolves into workbench tab state
- [ ] Existing quote/customers/settings pages may still work behind compatibility shims **or** temporary dual-mount — document migration path for **077**/**078**
- [ ] Kernel-only lab: sign-in → empty workbench

## Non-goals

Full manifest `defines` schema (**075**); moving quote code (**077**); QV2 parity (**071+**)
