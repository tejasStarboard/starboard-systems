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

| Point                                           | Purpose                       | Who contributes                                    |
| ----------------------------------------------- | ----------------------------- | -------------------------------------------------- |
| `workbench.activity`                            | Activity bar icons            | Any                                                |
| `workbench.views`                               | Sidebar / panel views         | `quoting.document` (Quotes list), `crm.parties`, … |
| `workbench.editors`                             | Center tab **document types** | `quoting.document` → viewType `quote`              |
| `workbench.commands` / `menus` / `toolbars`     | Actions                       | Any                                                |
| `workbench.perspectives` / `statusBar` / panels | Later                         | —                                                  |

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

---

## 3. Specialty elsewhere (also extension-owned)

| Owner                                  | Defines                                         | Contributors                 |
| -------------------------------------- | ----------------------------------------------- | ---------------------------- |
| `rates.catalog` or rates host built-in | `rates.offerProviders`, `rates.ingestPipelines` | `spot.*`, `ingestion.fcl_v6` |
| Messaging host / `messaging.msgraph`   | mail account / send hooks                       | future gmail, …              |

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

## 5. What kernel implements first (**074**)

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

## 6. Kernel-owned (not swappable)

Session/auth, org/plan, activation algorithm, empty workbench chrome, generic extension API gate.

---

## Related tickets

- **074** — kernel workbench hosts + generic points only
- **073** — `quoting.document` defines slots; charges/Incoterm/… contribute
- **071 / 070 / 072** — QV2 parity implementations behind those contributions
