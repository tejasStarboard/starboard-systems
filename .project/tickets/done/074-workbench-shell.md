---
id: 074
wave: 06-platform
title: Workbench shell (kernel UI regions)
status: done
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

- [x] Workbench layout chrome renders with empty regions when no contributions
- [x] Tab host can open/close/focus editors by `viewType` + resource id (stub editor OK)
- [x] Deep link path for quote id resolves into workbench tab state
- [x] Existing quote/customers/settings pages may still work behind compatibility shims **or** temporary dual-mount — document migration path for **077**/**078**
- [x] Kernel-only lab: sign-in → empty workbench

## Non-goals

Full manifest `defines` schema (**075**); moving quote code (**077**); QV2 parity (**071+**)

## Implementation notes (074)

- **Kernel:** `apps/web/components/workbench/*` (activity bar, primary sidebar, editor tab group, stub panel/status bar) + `apps/web/lib/workbench/*` (types, deep-link matcher, tab reducer). `(app)/layout.tsx` mounts `WorkbenchShell` (replaces `AppShell`/`AppSidebar`/`SiteHeader`).
- **Tabs:** keyed `viewType:resourceId`; `openEditor` / `focusTab` / `closeEditorTab` via `useWorkbench()`. Editors without a `deepLink` render a stub editor.
- **Deep links:** URL → tab state is synced in render (`syncedPath`), so `/quote/:quoteId` opens/focuses a `quote` tab (SSR included). `/` is workbench home (deselects, shows legacy quote list).
- **Compat shim (temporary, `lib/workbench/contributions.ts`):** existing quote/customers/settings/extension pages stay Next routes. Tabs are **route-backed**: the active tab renders the route `children`; switching tabs navigates to the tab href (inactive tab content is not kept mounted). Editors: `quote` (`/quote/:id`), `customer` (`/customers/:id`), catch-all `page` (`/*`). Sidebar/activity entries are static links + active extension nav.
- **Kernel-only lab:** `WORKBENCH_KERNEL_ONLY=1` → empty contributions, product route `children` not mounted → sign-in → empty workbench.
- **Path for 077/078:** `quoting.document` (077) contributes its own sidebar view + `quote` editor (mounting the editor component instead of route children, with data loaded by the editor); `crm.parties` / `org.settings` (078) do likewise; then delete `legacyShellContributions` and the `/*` + `page` fallback and route trees. 075 supplies `defines`/`contributes` resolution to replace the static shim.
