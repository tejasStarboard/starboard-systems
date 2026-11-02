# ADR 0006 — Kernel workbench, driving built-ins, optional extensions

## Status

Accepted (2026-11-02) — amended: thin kernel; quote = driving built-in; **workbench regions** (not per-feature Next page trees).

## Context

ADR 0003 put optional carriers/ingest/messaging behind the extension host, but the web app still uses **hard-coded App Router trees** (`/quote/[id]`, `/customers/…`, `/settings/…`) with feature UI imported by the shell. That is a multi-page app with extension APIs bolted on — not a VS Code–style workbench.

Product rule: **refactor of QV2, not a redesign**. Default-on built-ins still deliver full quoting. Modularity is ownership, contribution regions, and unplug surfaces.

## Decision — three layers + workbench

### 1. Kernel — auth/org + workbench chrome + extension host

Always on. **No quote/CRM/settings product UI.**

| Owns | Does not own |
|------|----------------|
| Better Auth, organization, plan, entitlements | Quotes, customers, rates product screens |
| Extension host: manifests, activation, contribution registry | Hard-coded feature page modules |
| **Workbench shell** (single authenticated app surface) | Domain managers for quotes/CRM as kernel |
| Auth routes (`/login`, …) | Per-feature `app/(app)/quote/…` trees as product home |

**Kernel routes (target):**

- Auth routes only outside the workbench
- **One** authenticated workbench route (e.g. `/` or `/app`) that loads the shell layout
- Generic BFF plumbing (`/api/auth/*`, `/api/extensions/[extensionId]/…`, session helpers)

Shareable URLs (e.g. `/q/:quoteId`) are **workbench deep links**: same shell route (or thin rewrite into it) that opens an **editor tab**; they are not separate Next.js page implementations owned by the kernel.

**Kernel test:** built-ins + optionals off → sign in → empty workbench (activity bar/sidebar/editor regions with no contributions).

### 2. Workbench regions (VS Code analogy)

| VS Code | Starboard workbench region | Who fills it |
|---------|----------------------------|--------------|
| Editor group (multi-tab documents) | **Center editor tabs** | `quoting.document` → quote tabs; later other document types |
| File explorer / sidebar views | **Primary sidebar** | Built-ins list platform features: Quotes list, Customers, … — open tabs in center |
| Activity bar | **Activity / view switcher** | One icon per contributed sidebar view |
| Panel (terminal) | **Bottom panel** (later) | Jobs, logs, messaging preview, … |
| Secondary sidebar (chat) | **Auxiliary panel** (later) | AI / assist extensions |
| Settings UI | **Settings editor tab or view** | Contributed by org/settings built-in(s), not kernel pages |

**Analogies locked:**

1. **Text document → quote document** — opens as a **center tab** (`quoting.document`).
2. **File explorer → app sidebar** — lists Quotes / Customers / …; selecting a row **opens a tab** (does not navigate to a separate full-page app tree).

Charge table, Incoterm, markup, rate sources are **editor-internal** contributions on the quote document (slots inside the quote tab), not top-level routes.

### 3. Driving built-ins — default-on

| Built-in | Contributes |
|----------|-------------|
| `quoting.document` | Sidebar “Quotes” view + **quote editor** for center tabs; declares editor slots |
| `quoting.charges` / `math` / `incoterm` / `markup` / `globals` | Slots inside quote editor |
| `crm.parties` | Sidebar “Customers” (+ customer editor tab if needed); quote header party picker |
| `geo.gazetteer` | APIs/widgets used by quote editor (not necessarily its own top-level view) |
| `rates.catalog` | Rate sources / catalog UI into quote slots (+ optional sidebar later) |
| `org.settings` (proposed) | Settings view/tabs (company, team, profile, …) |

**Driving test:** optionals off → workbench shows Quotes/Customers/Settings contributions; open quote tab; full manual QV2. Kernel-only → empty regions.

### 4. Optional extensions

`spot.*`, `messaging.*`, `ingestion.*`, … — contribute to existing regions/slots (e.g. `quote.rateSources`, bottom panel jobs). Unplug freely.

## Extension points catalog

**[extension-points.md](../extension-points.md)** — kernel points are **generic only**. Nested quote UI (`chargeTable`, …) is **`defines`’d by `quoting.document`**, not by the kernel (Eclipse: plugins declare their own extension points).

v1 kernel hosts: `workbench.activity` / `views` / `editors` / `commands`; `core.api` / `jobs` / `preferences` / `resources`; plus manifest **`defines.extensionPoints`** resolution.

Workbench **view state** lives in client shell (+ deep-link sync). Quote **data** stays in `services/quotes` behind the `quoting.document` built-in.

## Packages / services

Unchanged ownership of Bun services; **UI activation** is contribution-based. Today’s `app/(app)/quote/[quoteId]/page.tsx` etc. are **legacy multi-page** and migrate into workbench editors under ticket **074**.

## Consequences

- **074** — workbench shell + region host; collapse feature page trees into contributions
- **073** — quote **editor** slots once quote opens as a tab
- **071 / 070 / 072** — QV2 parity inside quote editor / pricing built-ins
- ADR 0003 optional host still applies; this ADR defines kernel workbench + built-in vs optional

## Non-goals

- Pixel-perfect VS Code clone; marketplace UI; node-graph admin
- Dropping shareable quote URLs (deep links stay; implementation becomes workbench state)
- Making Better Auth an extension
- Shipping empty-kernel as a sold SKU in v1
