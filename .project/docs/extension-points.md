# Extension points — kernel vs extension-owned

See [ADR 0006](adr/0006-shell-built-ins-extensions.md), [extensions.md](extensions.md).

**Rule:** the kernel only knows **generic** workbench/core hooks. It does **not** know `quote.chargeTable`. Quote is a **driving built-in** (`quoting.document`) that:

1. **Contributes to** kernel points (`workbench.editors`, `workbench.views`, …)
2. **Declares its own** extension points that sibling/optional extensions fill

**File explorer analogy (VS Code / Eclipse):** the explorer (a driving UI) owns the tree and **defines** entrypoints such as the **file context menu**. Other extensions do not own that menu — they **contribute** items into it (`menus` on `view/item/context`). Likewise `quoting.document` owns the quote tab and defines `quoting.slots.*` / quote context menus; charges, Incoterm, spot, etc. only inject.

Same as Eclipse: the platform defines `org.eclipse.ui.editors`; **JDT** defines Java-specific points. The workbench never hardcodes “quote charge table.”

---

## Two registries

| Registry | Owner | Examples |
|----------|--------|----------|
| **Kernel extension points** | Host / workbench | `workbench.views`, `workbench.editors`, `core.jobs`, `core.preferences` |
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

| Point | Purpose | Who contributes |
|-------|---------|-----------------|
| `workbench.activity` | Activity bar icons | Any |
| `workbench.views` | Sidebar / panel views | `quoting.document` (Quotes list), `crm.parties`, … |
| `workbench.editors` | Center tab **document types** | `quoting.document` → viewType `quote` |
| `workbench.commands` / `menus` / `toolbars` | Actions | Any |
| `workbench.perspectives` / `statusBar` / panels | Later | — |

**Not kernel:** nested quote UI regions. Kernel editor host only renders whatever the **active editor extension** returns (including that extension’s internal slot hosts).

### Core (headless)

| Point | Purpose |
|-------|---------|
| `core.resources` / `resourceEvents` | Resource kinds + adapters (extensions register `kind: "quote"`) |
| `core.contentTypes` | URI / MIME recognition |
| `core.jobs` / `jobProgress` | Async 202 + status (exists) |
| `core.preferences` / `secrets` | Declared settings |
| `core.api` | `/api/extensions/{id}/…` |
| `core.services` (later) | Shared service interfaces |
| `core.validators` | Optional save validators by resource kind |
| Entitlements query | Kernel-owned API (not an override point) |

Kernel does **not** list `quote` as a built-in resource kind in code forever — extensions **register** kinds via `core.resources`. Kernel may ship zero product kinds.

---

## 2. Points owned by `quoting.document` (primary built-in)

`quoting.document` contributes a `workbench.editors` entry (`viewType: "quote"`) and a Quotes `workbench.views` entry. It also **`defines`**:

| Point id | Purpose | Typical contributors |
|----------|---------|----------------------|
| `quoting.slots.headerFields` | Header region inside quote editor | `quoting.incoterm`, `crm.parties` |
| `quoting.slots.chargeTable` | Charge grid region | `quoting.charges`, `quoting.globals` |
| `quoting.slots.totals` | Footer / markup | `quoting.markup`, `quoting.math` |
| `quoting.slots.rateSources` | Search/apply rates UI | `rates.catalog`, `spot.*` |
| `quoting.totalsHooks` | Headless hooks into ONE MATH pipeline | `quoting.incoterm`, `quoting.markup` |
| `quoting.chargeProviders` | Extra lines/sections into charge model | globals, apply-rate |
| `quoting.documentModel` (optional) | Extend aggregate fields | carefully versioned |

The **quote editor React tree** (inside the built-in) hosts these slots. Kernel never imports `ChargeTable`.

Other driving built-ins follow the same pattern when they grow nested UI:

- `crm.parties` might define `crm.slots.contactPanel`
- `rates.catalog` might define `rates.slots.ingestActions`

---

## 3. Specialty elsewhere (also extension-owned)

| Owner | Defines | Contributors |
|-------|---------|----------------|
| `rates.catalog` or rates host built-in | `rates.offerProviders`, `rates.ingestPipelines` | `spot.*`, `ingestion.fcl_v6` |
| Messaging host / `messaging.msgraph` | mail account / send hooks | future gmail, … |

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
    // target must match a defined extension point id
    "quoting.slots.chargeTable": [{ id: "charges.grid", /* factory ref */ }],
  },
}

// spot.maersk
{
  id: "spot.maersk",
  contributes: {
    "quoting.slots.rateSources": [{ id: "spot.maersk.source" }],
    api: [{ pathPrefix: "/api/extensions/spot.maersk" }],
    jobs: [{ type: "spot.search", carrier: "maersk" }],
  },
}
```

---

## 5. What kernel implements first (**074**)

| Ship | Do not put in kernel |
|------|----------------------|
| Empty activity / view / editor / command hosts | `quoting.slots.*` |
| `defines` / `contributes` resolution in host | Hardcoded quote layout |
| `core.api` / `jobs` / `preferences` | Charge/Incoterm/markup imports |
| Deep link → `workbench.editors` open | Feature `page.tsx` as long-term model |

**073:** implement slot **hosts + `defines`** inside `quoting.document`; wire sibling contributions.

---

## 6. Kernel-owned (not swappable)

Session/auth, org/plan, activation algorithm, empty workbench chrome, generic extension API gate.

---

## Related tickets

- **074** — kernel workbench hosts + generic points only  
- **073** — `quoting.document` defines slots; charges/Incoterm/… contribute  
- **071 / 070 / 072** — QV2 parity implementations behind those contributions  
