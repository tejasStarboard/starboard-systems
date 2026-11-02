# Extension migration inventory — 2026-11-02

What exists today vs target packages. Optional workers already live under `extensions/{spot,messaging,ingestion}`; **driving built-ins are still hard-wired in `apps/web`**.

## Already extension-shaped (optional)

| Id                                                          | Code today                                                                                                                                | Gap                                          |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `spot.fake` / `maersk` / `cma` — **slot-contributed (073)** | `extensions/spot` + host registry; contribute `quoting.slots.rateSources` (`component: rates.spotSource`, panel owned by `rates.catalog`) | **069** creds                                |
| `messaging.msgraph` — **workbench (080)**                   | `extensions/messaging` + `/messaging/inbox` route anchor; contributes `messaging` activity / inbox editor                                 | Thin page remains; UI package optional later |
| `ingestion.fcl_v6` — **workbench (080)**                    | `extensions/ingestion` + `/rates/upload` route anchor; contributes `rates` activity / upload editor                                       | Thin page remains; UI package optional later |

## Still in shell — package as driving built-ins

| Target id                                                      | Move from `apps/web` (approx)                                                                                                                                                                                                                                                                                                                                                                                        | Backend (stays service; BFF client moves with UI) |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **`quoting.document`** — **migrated (077)**                    | `extensions/builtins/quoting-document/src/{components,editors,lib}` (form, lanes, list view/table, create, schema re-exports, apply-rate). Kernel keeps only `app/(app)/page.tsx` (null home), `app/(app)/quote/[quoteId]/page.tsx` (null deep-link anchor), `app/api/quotes/**` BFF, `lib/domain/quotes/{client,manager}`                                                                                           | `services/quotes`                                 |
| **`quoting.charges`** (+ globals for now) — **migrated (073)** | `extensions/builtins/quoting-charges/src/{components,slots}`: `rate-surcharges-editor`, `global-charges-editor`, manual-rate rows → contributions to `quoting.slots.chargeTable` (`quoting.charges.table`, `quoting.charges.globals`)                                                                                                                                                                                | `quotes.surcharge` / `global_charge`              |
| **`quoting.math`**                                             | call sites of `@starboard/lib-pricing` in quote form                                                                                                                                                                                                                                                                                                                                                                 | `packages/pricing` (already separate)             |
| **`crm.parties`** — **migrated (078)**                         | `extensions/builtins/crm-parties/src/{components,editors,lib}` (customers list + detail, `customer-combobox`, forms schema). Kernel keeps only `app/(app)/customers/page.tsx` + `customers/[customerId]/page.tsx` (null deep-link anchors), `app/api/customers/**` BFF, `lib/domain/crm/{client,manager}`                                                                                                            | `services/crm`                                    |
| **`geo.gazetteer`** — **migrated (078)**                       | `extensions/builtins/geo-gazetteer/src/components/{port,address}-combobox` exported as `widgets` (consumed by quote lane fields; no workbench UI). Kernel keeps `app/api/geography/**` BFF + `lib/domain/geography/*`                                                                                                                                                                                                | `services/geography`                              |
| **`rates.catalog`** — **migrated (073)**                       | `extensions/builtins/rates-catalog/src/{slots,lib}`: catalog list (`rates.catalog.source`) + generic spot panel (`rates.spotSource`), `apply-rate-to-lane`, extension-api/poll helpers → contributions to `quoting.slots.rateSources`; `rates-search-sheet` keeps only the sheet chrome + slot host. Kernel keeps `lib/domain/rates/*`                                                                               | `services/rates`                                  |
| **`org.settings`** — **migrated (078)**                        | `extensions/builtins/org-settings/src/{components,editors,lib}` (company, team, profile, preferences, quote-rules, billing, integrations + overview; own Better Auth client, org-metadata, forms schema). Kernel keeps `app/(app)/settings/page.tsx` + `settings/[page]/page.tsx` (null anchors), `settings/customers/**` redirect shims → `/customers`, `app/api/settings/context` BFF (plan + active integrations) | Better Auth org + future settings APIs            |
| **`quoting.incoterm` / `markup`**                              | mostly missing / lane markup footer only                                                                                                                                                                                                                                                                                                                                                                             | after **070**/**072**                             |

Kernel should retain: auth routes, `(app)/layout` → **workbench host**, `lib/extensions*`, `lib/auth*`, `lib/domain/platform/*`, admin, generic `/api/extensions/[id]`.

## Host today vs needed

| Have                                                                 | Need                                       |
| -------------------------------------------------------------------- | ------------------------------------------ |
| `contributes.nav` (href links)                                       | `workbench.activity` / `views` / `editors` |
| `uiSlots` string tags (legacy; quote slots now `contributes.points`) | Slot hosts + **`defines.extensionPoints`** |
| `api` / `jobs` / `settings`                                          | Keep; wire UI factories by contribution id |
| Entitlements + rollout                                               | Unchanged                                  |

## Package layout (decided in 076)

```text
extensions/
  host/                 # @starboard/ext-host (registry + types)
  spot|messaging|ingestion/  # optional Python workers
  builtins/             # driving built-ins (JS/TS, default-on credit+enterprise)
    quoting-document/   # @starboard/ext-quoting-document  → id quoting.document
    quoting-charges/    # quoting.charges (contributes quoting.slots.chargeTable, 073)
    crm-parties/        # crm.parties
    geo-gazetteer/      # geo.gazetteer
    rates-catalog/      # rates.catalog (+ spot panel; contributes quoting.slots.rateSources, 073)
    org-settings/       # org.settings
packages/pricing/       # quoting.math implementation (keep)
```

Convention: `extensions/builtins/<id with dots → dashes>` → `@starboard/ext-<same>`. Each package exports `./manifest` (pure data, no imports; host bundles + Zod-validates it in `extensions/host/src/builtins.ts`) and `.` (manifest + UI/widget factories; React only here). Editor factories (`editors`, keyed by contributed `workbench.editors` viewType) and sidebar view factories (`views`, keyed by `workbench.views` id) receive a `BuiltinHost` (`openEditor`, `activeEditor`) from the kernel and are registered in `apps/web/lib/workbench/builtin-editors.ts`. Built-in UI never imports `apps/web`; data comes via BFF routes (e.g. `GET /api/quotes/:id/editor-context`). `pnpm-workspace.yaml` lists `extensions/builtins/*`; `pyproject.toml` excludes `extensions/builtins` from uv.

## Migration order (matches build-priority)

1. Harden host + workbench chrome (**074**, **075**)
2. Scaffold empty built-in packages + manifests (**076**)
3. ~~Move **quote** into `quoting.document` (**077**)~~ — done: `quotes` activity, `quoting.document.list` view, `quote` (`/quote/:id`) + `quote.list` (home `/`, auto-opens) editors; legacy shim entries removed. Charge UI peeled in **073**.
4. ~~Move CRM + settings (+ geo widgets as deps) (**078**)~~ — done: `customers` activity (`customer.list` `/customers`, `customer` `/customers/:id`), `settings` activity (`settings.index` `/settings`, `settings` `/settings/:slug`), `geo.gazetteer` widgets.
5. ~~Quote-defined slots; peel charges/rateSources (**073**)~~ — done: `quoting.document` `defines` `quoting.slots.{headerFields,chargeTable,totals,rateSources}` + `quoting.totalsHooks` (declared, headless); slot host `QuoteSlot` mounts contributions resolved by the editor-context `slots` payload + `builtinPointComponents`; `quoting.charges` → `chargeTable`; `rates.catalog` + `spot.*` → `rateSources` only. `headerFields` / `totals` hosted but unclaimed (070 / 072 land there). Legacy `uiSlots: ["quote.rateSources"]` removed.
6. ~~Retire legacy shell shim (**080**)~~ — done: `legacyShellContributions` / catch-all `page` removed; `ingestion.fcl_v6` + `messaging.msgraph` contribute workbench activity/views/editors; pages gated with `isExtensionActive`.
7. QV2 parity inside those packages (**071→070→072**)
8. Org carrier secrets (**069**)
