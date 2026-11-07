# Extension points — kernel vs extension-owned

See [ADR 0006](adr/0006-shell-built-ins-extensions.md), [extensions.md](extensions.md).

**Rule:** the kernel only knows **generic** workbench/core hooks. It does **not** know `quote.chargeTable`. Quote is a **driving built-in** (`quoting.document`) that:

1. **Contributes to** kernel points (`workbench.editors`, `workbench.views`, …)
2. **Declares its own** extension points that sibling/optional extensions fill

**File explorer analogy (VS Code / Eclipse):** the explorer (a driving UI) owns the tree and **defines** entrypoints such as the **file context menu**. Other extensions do not own that menu — they **contribute** items into it (`menus` on `view/item/context`). Likewise `quoting.document` owns the quote tab and defines `quoting.slots.*` / quote context menus; charges, Incoterm, spot, etc. only inject.

Same as Eclipse: the platform defines `org.eclipse.ui.editors`; **JDT** defines Java-specific points. The workbench never hardcodes “quote charge table.”

---

## Two registries

| Registry                      | Owner                                      | Examples                                                                |
| ----------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| **Kernel extension points**   | Host / workbench                           | `workbench.views`, `workbench.editors`, `core.jobs`, `core.preferences` |
| **Extension-declared points** | Any extension (usually a driving built-in) | `quoting.document` → `quoting.slots.chargeTable`, `quoting.totalsHooks` |

An extension manifest may both **contribute to** points and **define** points:

```ts
type ExtensionManifest = {
  id: string
  // …
  defines?: {
    // Extension points THIS extension owns (others contribute here)
    extensionPoints?: Array<{
      id: string // e.g. "quoting.slots.chargeTable"
      description?: string
    }>
  }
  contributes?: {
    // …kernel + foreign points (see below)
  }
}
```

Host activation: resolve contribution target `quoting.slots.chargeTable` → owning extension `quoting.document` must be active → mount into that editor’s slot host.

---

## 1. Kernel extension points only (generic)

### Workbench (UI)

| Point                                       | Purpose                       | Who contributes                                    |
| ------------------------------------------- | ----------------------------- | -------------------------------------------------- |
| `workbench.activity`                        | Activity bar icons            | Any                                                |
| `workbench.views`                           | Sidebar / panel views         | `quoting.document` (Quotes list), `crm.parties`, … |
| `workbench.editors`                         | Center tab **document types** | `quoting.document` → viewType `quote`              |
| `workbench.newTab`                          | New Tab welcome quick actions | `quoting.document`, `rates.catalog`, `crm.parties` |
| `workbench.commands` / `menus` / `toolbars` | Actions                       | Any                                                |
| `workbench.statusBar`                       | Footer actions / launchers    | e.g. Preview → `quote.preview` editor (**101**)    |
| `workbench.panel`                           | Bottom drawer tabs            | Activity / inbox / notes (**103–106**)             |
| `workbench.perspectives`                    | Later                         | —                                                  |

**Preview placement (**101**):** do **not** put PDF/email canvas in the bottom drawer. Status-bar **Preview** opens a **center** `quote.preview` tab (quote combobox + PDF \| Email). Bodies stay on `quoting.slots.preview` (`quoting.pdf` / `quoting.email`); the quote **builder** no longer hosts the side pane — open Preview from the status bar (or builder shortcut).

**`workbench.newTab`:** each entry is `{ id, label, order?, keybinding?, opens | command }`. `opens` navigates like a sidebar entry; `command` is a client handler id merged in the shell (`builtinNewTabCommands`). Unplug the contributor → its rows disappear from `/`.

**Not kernel:** nested quote UI regions. Kernel editor host only renders whatever the **active editor extension** returns (including that extension’s internal slot hosts).

### Core (headless)

| Point                               | Purpose                                                         |
| ----------------------------------- | --------------------------------------------------------------- |
| `core.resources` / `resourceEvents` | Resource kinds + adapters (extensions register `kind: "quote"`) |
| `core.contentTypes`                 | URI / MIME recognition                                          |
| `core.jobs` / `jobProgress`         | Async 202 + status (exists)                                     |
| `core.preferences` / `secrets`      | Declared settings                                               |
| `core.api`                          | `/api/extensions/{id}/…`                                        |
| `core.services` (later)             | Shared service interfaces                                       |
| `core.validators`                   | Optional save validators by resource kind                       |
| Entitlements query                  | Kernel-owned API (not an override point)                        |

Kernel does **not** list `quote` as a built-in resource kind in code forever — extensions **register** kinds via `core.resources`. Kernel may ship zero product kinds.

---

## 2. Points owned by `quoting.document` (primary built-in)

`quoting.document` contributes a `workbench.editors` entry (`viewType: "quote"`) and a Quotes `workbench.views` entry. It also **`defines`**:

| Point id                           | Purpose                                                | Typical contributors                         |
| ---------------------------------- | ------------------------------------------------------ | -------------------------------------------- |
| `quoting.slots.headerFields`       | Header region inside quote editor                      | `quoting.incoterm`, `crm.parties`            |
| `quoting.slots.chargeTable`        | Charge grid region                                     | `quoting.charges`, `quoting.globals`         |
| `quoting.slots.totals`             | Footer / markup                                        | `quoting.markup`, `quoting.math`             |
| `quoting.slots.rateSources`        | Search/apply rates UI                                  | `rates.catalog`, `spot.*`                    |
| `quoting.slots.lifecycle`          | Stage / validity / numbering chrome (shipped **082**)  | `quoting.document` (self)                    |
| `quoting.slots.preview`            | Preview pane body, PDF \| Email (chrome **089**)       | `quoting.pdf` + `quoting.email` (**092**)    |
| `quoting.slots.laneRoute`          | FCL Route step port picker; empty → `PortCombobox`     | `geo.gazetteer` world map (**090**)          |
| `quoting.commands`                 | Editor/toolbar actions (host shipped **082**)          | `quoting.pdf` (**083**), later send          |
| `quoting.pdf.templates`            | PDF layouts `{ id, label, renderPdf(view) }` (**094**) | `quoting.pdf` (self: standard, letterhead)   |
| `quoting.email.templates`          | Email layouts `{ id, label, render(view) }` (**094**)  | `quoting.email` (self: standard, letterhead) |
| `quoting.totalsHooks`              | Headless hooks into ONE MATH pipeline                  | `quoting.incoterm`, `quoting.markup`         |
| `quoting.chargeProviders`          | Extra lines/sections into charge model                 | globals, apply-rate                          |
| `quoting.documentModel` (optional) | Extend aggregate fields                                | carefully versioned                          |

The **quote editor React tree** (inside the built-in) hosts these slots. Kernel never imports `ChargeTable`.

Other driving built-ins follow the same pattern when they grow nested UI:

- `crm.parties` might define `crm.slots.contactPanel`
- `rates.catalog` defines `rates.slots.ingestActions` (086 stub; 087 fills upload)
- `rates.catalog` defines `rates.slots.spotSearch` (**098**) — standalone Spot search editor (no quote document); `spot.*` contribute `rates.spotSource` offer UI. Quote apply-to-lane remains `quoting.slots.rateSources`. Unplug spot → empty/gated Spot search; catalog Search/Sheets still work.

Rates activity IA (Search / Sheets / Sell / Spot sidebar): [rates-catalog-ux-2026-11-03.md](reference/rates-catalog-ux-2026-11-03.md) · tickets **095–099**.

---

## 3. Specialty elsewhere (also extension-owned)

| Owner                                  | Defines                                                                 | Contributors                 |
| -------------------------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| `rates.catalog`                        | `rates.slots.ingestActions`, `rates.slots.spotSearch` (**096**/**098**) | `spot.*`, `ingestion.fcl_v6` |
| `rates.catalog` or rates host built-in | `rates.offerProviders`, `rates.ingestPipelines` (future / specialty)    | `spot.*`, `ingestion.fcl_v6` |
| Messaging host / `messaging.msgraph`   | mail account / send hooks                                               | future gmail, …              |

Optional extensions should prefer contributing to **driving** points, not inventing kernel specialty APIs.

---

## 4. Manifest sketch

```ts
// quoting.document (defines + contributes to kernel)
{
  id: "quoting.document",
  defines: {
    extensionPoints: [
      { id: "quoting.slots.chargeTable" },
      { id: "quoting.slots.headerFields" },
      { id: "quoting.slots.totals" },
      { id: "quoting.slots.rateSources" },
      { id: "quoting.totalsHooks" },
    ],
  },
  contributes: {
    activity: [{ id: "quotes", label: "Quotes" }],
    views: [{ id: "quotes.list", name: "Quotes", activityId: "quotes" }],
    editors: [{ viewType: "quote", displayName: "Quote" }],
    resources: [{ kind: "quote" }],
  },
}

// quoting.charges (contributes to quoting.document’s point)
{
  id: "quoting.charges",
  contributes: {
    // keyed by a defined extension point id (075: under `contributes.points`)
    points: {
      "quoting.slots.chargeTable": [
        { id: "quoting.charges.table" },
        { id: "quoting.charges.globals" },
      ],
    },
  },
}

// spot.maersk
{
  id: "spot.maersk",
  contributes: {
    points: { "quoting.slots.rateSources": [{ id: "spot.maersk.source" }] },
    api: [{ pathPrefix: "/api/extensions/spot.maersk" }],
    jobs: [{ type: "spot.search", carrier: "maersk" }],
  },
}
```

---

## 5. Context for child contributions — UI props vs invoke RPC

Driving extensions **host** contribution points; children **contribute** UI and/or **handlers**. There is **no peer extension↔extension gateway**. Context reaches the child in one of two ways:

### A. In-tree UI (interactive slots) — shipped

The **owner’s React tree** mounts the child’s component and passes a typed **slot props** contract (identity, form handles, callbacks). Contributors import **types only** from the owner (e.g. `@starboard/ext-quoting-document/slots`).

| Passes                  | Examples                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------- |
| Identity / scope        | `quoteId` (row UUID), `status`, `lanePath`, ports                                       |
| Live UI                 | RHF `control` / `register`, debounced `quote` snapshot                                  |
| Host callbacks          | `onApplyRate`, `onAppendRate` — child asks host to update **host-owned** document state |
| Static manifest `props` | `{ carrier: "maersk" }`                                                                 |

Use for charge grids, rate-source panels, preview bodies, anything that must feel local to the editor. **Do not** RPC per keystroke.

### B. Invoke RPC (actions / headless) — planned

Child contributes an **invoke contract** on **its own** BFF (`/api/extensions/<childId>/…`, session + org). Host chrome (command, toolbar, headless hook) calls it with **explicit JSON args** (e.g. `quoteId`, lane). Child **re-validates** org access to those ids (never trust args alone). Result returns to the host; host applies to form / UI if needed. Quote aggregate writes stay on the quotes / document path unless a dedicated one-writer API exists.

```text
Host (slot chrome / command)
  → invoke({ extensionId, path or method, args })
  → POST/GET /api/extensions/<child>/…   (session + X-Organization-Id)
  → child handler on child BFF
  → result → host applies (callback / form) when required
```

| Use invoke RPC for                             | Do not use invoke RPC for                                       |
| ---------------------------------------------- | --------------------------------------------------------------- |
| Toolbar / commands (export, send, run job)     | Live form binding, charge editing                               |
| Headless hooks (validators, totals hooks)      | Replacing `onApplyRate` with a write into quotes from the child |
| Jobs the child already owns (`spot.search`, …) | Peer calls into another extension’s private API                 |

**Shell Workspace State** ([103](../tickets/backlog/103-workspace-state-and-panel-host.md)) is a third, thinner channel: org + active editor for **panel** UIs outside the document tree — not a substitute for slot props or invoke.

Formalize invoke contribution schema + shell helper in ticket **[107](../tickets/backlog/107-contribution-invoke-rpc.md)**. Commands/keybindings (**102**) may dispatch to client handlers and/or invoke RPCs.

---

## 6. What kernel implements first (**074**)

| Ship                                           | Do not put in kernel                  |
| ---------------------------------------------- | ------------------------------------- |
| Empty activity / view / editor / command hosts | `quoting.slots.*`                     |
| `defines` / `contributes` resolution in host   | Hardcoded quote layout                |
| `core.api` / `jobs` / `preferences`            | Charge/Incoterm/markup imports        |
| Deep link → `workbench.editors` open           | Feature `page.tsx` as long-term model |

**073 (done):** slot **hosts + `defines`** live inside `quoting.document`; `quoting.charges` → `chargeTable`, `rates.catalog` + `spot.*` → `rateSources`; `quoting.totalsHooks` declared (headless, consumed by 072). How-to: [extensions.md cookbook](extensions.md#cookbook-contribute-ui-to-a-quotingdocument-slot-073).

**082 (done):** `quoting.slots.lifecycle` + `quoting.commands` defined; document self-contributes lifecycle chrome.

**083 (done):** `quoting.pdf` contributes `quoting.pdf.export` into `quoting.commands`; BFF `GET /api/quotes/:id/pdf`.

**089 (in progress):** `quoting.document` owns the 5-step builder shell (Basics → Route → Cargo → Rates → Build) and defines `quoting.slots.preview`; empty = stub. Existing slots remount by step: `headerFields` → Basics, `rateSources` → Rates, `chargeTable` / `totals` → Build.

**094 (done):** `quoting.pdf` / `quoting.email` are _non-document_ owners that **define** their own template registries (`quoting.pdf.templates`, `quoting.email.templates`) and self-contribute `standard` + `letterhead`; both render the shared `QuoteDocumentView` (see [quotes.md](domains/quotes.md#document-view--templates-094)). Headless points: no UI factory — the contribution makes the id _active_, the package's registry supplies the renderer. Org picks via `organization.metadata.quoteTemplates.{pdf,email}`; unknown/inactive → default. To add a tenant layout: contribute `{ id, label }` into the point from your manifest and call `registerQuotePdfTemplate({ id, label, renderPdf })` (or the email twin) from your package.

**084 (done):** `quoting.incoterm` → `headerFields`; `quoting.markup` → `totals`.

---

## 7. Kernel-owned (not swappable)

Session/auth, org/plan, activation algorithm, empty workbench chrome, generic extension API gate.

---

## Related tickets

- **074** — kernel workbench hosts + generic points only
- **073** — `quoting.document` defines slots; charges/Incoterm/… contribute
- **071 / 070 / 072** — QV2 parity implementations behind those contributions
- **102** — workbench commands + keybindings (may invoke child RPCs)
- **103** — shell Workspace State + `workbench.panel` host
- **107** — contribution invoke RPC contract (child BFF handlers + context args)
