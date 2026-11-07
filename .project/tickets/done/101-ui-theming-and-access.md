---
id: 101
wave: 11-ux-polish
title: UI theming + ease of access
status: done
depends_on: []
epic: SYS-UX
priority: urgent
docs:
  - .project/docs/git-workflow.md
---

# UI theming + ease of access

Urgent polish ticket. Scope grew as ad-hoc UX landed on Next `apps/web` + quoting built-ins.

## Goal

Improve shell/workbench ease of access and quote UX polish: New Tab home, split editors, standalone preview, compact builder, consistent lib-ui primitives, and related chrome.

## Non-goals

- TanStack Start parallel shell (`apps/web_ts`) — **109** (WIP branch) / cutover **108**
- Global workbench commands / keybindings registry — **102**
- Bottom panel host / Workspace State — **103+**
- Streaming / SSE preview refresh

## Files to touch

Primarily `apps/web` workbench + auth/admin chrome; `packages/ui`; `extensions/builtins/quoting-*`, `geo-gazetteer`, `crm-parties`, `rates-catalog`, `org-settings`; `extensions/host` contribution points (`workbench.newTab`, `workbench.statusBar`).

## Acceptance

- [x] New Tab is default `/` home; Quotes list at `/quotes`
- [x] Extension-driven New Tab + status-bar Preview → standalone `quote.preview`
- [x] Horizontal editor split (beside / drag) with resizable panes + sidebar
- [x] Shared `LoadingState` + lib-ui consistency sweep on major surfaces
- [x] Two-step quote builder (Route → Rate), compact lifecycle, lanes panel polish
- [x] Preview soft-refresh after save with updating chrome; Preview | Export split menu
- [x] ButtonGroup / InputGroup patterns on builder, preview modes, lists, settings
- [x] Desktop interaction guard (no context menu / text select outside forms)
- [x] Friendly labels / map Phosphor icons; changelog recorded below

## Changelog (record as we go)

<!-- Append one entry per change: date, short what/why, key paths -->

- **2026-11-07 — New Tab welcome as default home.** `/` no longer auto-opens Quotes. Centered Starboard mark + actions (New Quote, Search Quotes, Upload Rates, Search Rates, Find or create customers). Quotes list moved to `/quotes` (`quote.list` deep link).
  - `apps/web/components/workbench/new-tab-welcome.tsx`, `starboard-mark.tsx`, `editor-group.tsx`
  - `apps/web/app/(app)/page.tsx`, `quotes/page.tsx`
  - `extensions/builtins/quoting-document/src/manifest.ts`

- **2026-11-07 — Public brand assets.** Kept `apps/web/public/` (correct Next.js static root). New Tab uses `/favicon.png`; root layout metadata wires favicon set.
  - `apps/web/public/**`, `starboard-mark.tsx`, `app/layout.tsx`

- **2026-11-07 — New Tab shortcut keycaps.** Cursor-style bordered keycaps on the right of each welcome row; chords work while New Tab is mounted (Mac ⌘ / elsewhere Ctrl). Global contribution registry stays on **102**.
  - `apps/web/components/workbench/new-tab-welcome.tsx`

- **2026-11-07 — New quote tab shows short id.** Create quote API returns `quoteId`; openers pass it as tab title; quote editor renames the tab after load (deep link / refresh).
  - `packages/contracts`, `services/quotes`, create button / New Tab, `tabs.ts` rename, `quote-editor.tsx`

- **2026-11-07 — `workbench.newTab` contribution point.** New Tab list is extension-driven. `quoting.document` registers New Quote (`command`) + Search Quotes (`opens`); rates/CRM register their rows. Shell resolves `command` via `builtinNewTabCommands`.
  - `extensions/host` manifest + workbench merge; builtin manifests; `new-tab-welcome.tsx`; `extension-points.md`

- **2026-11-07 — Standalone quote Preview via status bar.** `workbench.statusBar` contributions; `quoting.document` registers Preview → `quote.preview` center tab (quote picker + PDF \| Email). In-builder side pane / sheet removed; builder Preview button opens the same tab. Bodies stay on `quoting.slots.preview`.
  - `extensions/host` statusBar schema + merge; `bottom-panel.tsx`; `quote-preview-editor.tsx`; `quote-builder-shell.tsx`; `/preview/:resourceId`

- **2026-11-07 — Horizontal editor split.** Cursor-style side-by-side panes: tabs live in `primary` | `secondary` groups; Split Right moves the active tab; move arrows between panes. Status-bar / builder Preview open with `side: "beside"` into the right pane. Split columns are resizable via a center drag handle (`ResizablePanelGroup`). Drag a tab to the far-right tab-strip edge (or onto the other pane’s tab strip) to open / move into the split.
  - `apps/web/lib/workbench/tabs.ts`, `types.ts`; `workbench-context.tsx`; `editor-group.tsx`

- **2026-11-07 — Preview pane full height + PDF zoom.** Preview fills the editor column; PDF/Email viewports scroll in x/y with hidden scrollbars. PDF toolbar: Fit to page + zoom slider (50–200%).
  - `quote-preview-editor.tsx`, `quote-preview-pane.tsx`; `quoting-pdf` `pdf-preview.tsx`; `quoting-email` `email-preview.tsx`

- **2026-11-07 — Empty panes show New Tab, not route errors.** Split/empty editor columns and deep-link anchors no longer surface "extension not active" alerts; they render New Tab welcome instead.
  - `editor-group.tsx`; `editor-route-fallback.tsx`; `app/(app)/**/page.tsx` deep links

- **2026-11-07 — New Tab (+) on each tab strip.** Left-end plus on every pane deselects that group’s active tab (tabs stay open) and shows New Tab; clicking a tab restores it.
  - `tabs.ts` `showNewTab`; `workbench-context.tsx`; `editor-group.tsx`

- **2026-11-07 — Resizable primary sidebar.** Desktop extended sidebar vs editor group share a drag handle (`ResizablePanelGroup`); mobile keeps the activity-bar sheet.
  - `workbench-shell.tsx`; `primary-sidebar.tsx`

- **2026-11-07 — Quotes sidebar filter view.** Removed static “All quotes” entry; `QuoteListView` shows search by short id + funnel menu (Filter by status, Sort by date/id); create is icon-only.
  - `quoting-document` `manifest.ts`, `quote-list-view.tsx`

- **2026-11-07 — Quotes sidebar cards match Outlook list item.** Rows use the add-in `StageQuoteCard` structure (id + copy + time · subject · owner + status dot; review = red left edge). Mode/legs/lane omitted until list API is enriched.
  - `quoting-document` `quote-list-card.tsx`, `quote-list-view.tsx`

- **2026-11-07 — lib-ui consistency sweep.** Replaced raw `<button>` / `<select>` / `<label>` / checkbox inputs with `Button`, `Select`, `Label`/`Field`, `Checkbox`, `Tabs`, `Card`, `Skeleton` across settings hub, org picker, CRM/rates lists, quote stepper/lanes, charges table, admin rollout, and workbench chrome.
  - `org-settings` settings-index + team invite; `select-org-form`; `customers-list` / `customer-combobox`; `rates-list` / `search-mode-tabs` / `spot-source`; `quote-stepper` / `quote-lanes-panel` / `quote-form-fields` / `quote-preview-pane`; `quoting-charges` charge-table + editors; `extension-rollout-panel`; workbench `editor-group` / `new-tab-welcome` / `primary-sidebar`

- **2026-11-07 — Shared LoadingState.** New `@starboard/lib-ui` `LoadingState` (centered Spinner + muted text; sizes default/sm/inline). Replaced bland “Loading…” copy across quote/customer/rate editors, lists, settings, previews, auth Suspense, admin settings.
  - `packages/ui/src/components/loading-state.tsx`; quoting/crm/rates/org-settings/email/pdf; `apps/web` auth + admin

- **2026-11-07 — Preview full-height chrome.** Quote picker sits in the same thin toolbar as PDF|Email (no stacked “Quote” label block); Select shows short id · customer. Preview body fills remaining height.
  - `quote-preview-editor.tsx`, `quote-preview-pane.tsx`

- **2026-11-07 — Quote editor header compact.** Lifecycle fields (ID / Status / Effective / Expires) share one aligned row with sm controls; header padding tightened so Export/Save stay on the same bar.
  - `lifecycle-chrome.tsx`, `quote-form-fields.tsx`, `quote-builder-shell.tsx`

- **2026-11-07 — Drop custom PDF zoom chrome.** Removed Fit / slider / % toolbar; preview iframe fills the pane and uses the browser PDF viewer’s zoom.
  - `quoting-pdf` `pdf-preview.tsx`

- **2026-11-07 — Quote builder action layout.** Lifecycle bar is full-width; Back/Next sit on the stepper row (right). Bottom: Preview + Export left, Cancel + Save right.
  - `quote-builder-shell.tsx`

- **2026-11-07 — Validity fields.** Kept separate Effective / Expires native `type="date"` inputs (range picker abandoned — Base UI modal popover clicks unreliable in the shell).
  - `quote-form-fields.tsx` `QuoteEffectiveField` / `QuoteExpiryField`; `lifecycle-chrome.tsx`

- **2026-11-07 — Two-step quote builder.** Collapsed create/edit flow to **Route** (ports + cargo) → **Rate** (basics + rates + charges/totals). Rate stays gated on ports + valid cargo.
  - `quote-builder-steps.ts`, `quote-builder-shell.tsx`, `quote-step-content.tsx`, `quote-stepper.tsx`

- **2026-11-07 — Compact stepper + lanes chrome.** Full-width stepper; lanes as right sidebar parent (strip when panel narrow via `useElementWidth`); lane Cards with CardAction delete; help icons for field hints; desktop-first builder layout.
  - `quote-stepper.tsx`, `quote-lanes-panel.tsx`, `quote-builder-shell.tsx`, `packages/ui` `use-element-width.ts`

- **2026-11-07 — Raw → friendly labels audit.** Status / equipment / port / currency display cleaned across form, list, charges, rates.
  - quoting-document form/list; quoting-charges; rates-catalog; related label helpers

- **2026-11-07 — Route map Phosphor icons.** Fixed missing `@phosphor-icons/react` in `geo-gazetteer`; world/fit control pinned bottom-left on the map.
  - `geo-gazetteer` `package.json`, `route-map-fields.tsx`

- **2026-11-07 — App interaction guard.** Disable context menu and text selection app-wide; forms/inputs remain selectable.
  - `apps/web/components/app-interaction-guard.tsx`; `packages/ui` globals; layout wiring

- **2026-11-07 — Preview refresh after save.** Same-window `emitQuoteSaved` / `subscribeQuoteSaved` bus (not SSE / cross-ext RPC). Standalone preview soft-reloads editor context; PDF/Email keep prior frame while regenerating with “Updating preview…” overlay; toolbar “Updating…”.
  - `quote-events.ts`, `quote-form.tsx`, `quote-preview-editor.tsx`, `quote-preview-pane.tsx`, `pdf-preview.tsx`, `email-preview.tsx`

- **2026-11-07 — Preview | Export ButtonGroup.** Primary Preview + caret menu hosts `quoting.commands` (Export PDF as menu item). Cancel/Save and Back/Next use ButtonGroup (+ separator where mixed variants).
  - `quote-builder-shell.tsx`, `export-pdf-button.tsx`, `quote-commands-slot.tsx`; e2e opens menu first

- **2026-11-07 — ButtonGroup / InputGroup sweep.** PDF|Email mode switch as ButtonGroup; email Copy/Open draft; theme system/light/dark; customer Undo/Save; rate Deactivate/Delete; search-rates sort+export + pagination with ButtonGroupText; customers pagination; select-org Cancel/Create; carrier Save/Validate.
  - `quote-preview-pane.tsx`, `email-preview.tsx`, `preferences-settings-form.tsx`, `customer-detail.tsx`, `rate-detail.tsx`, `search-rates-results.tsx`, `customers-list.tsx`, `select-org-form.tsx`, `carrier-credentials-panel.tsx`

- **2026-11-07 — Quote list tools layout.** Nested ButtonGroup: New quote (+) left; search InputGroup with filter menu inside on the right (shadcn input-group pattern).
  - `quote-list-view.tsx`

## Out of scope

- `apps/web_ts` TanStack Start parallel shell (ticket **109**, branch `109`)
- Retiring Next for TanStack cutover (**108**)
- Workbench commands/keybindings (**102**)
- Panel host / invoke RPC (**103–107**)
