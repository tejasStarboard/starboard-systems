# Extension migration inventory — 2026-11-02

What exists today vs target packages. Optional workers already live under `extensions/{spot,messaging,ingestion}`; **driving built-ins are still hard-wired in `apps/web`**.

## Already extension-shaped (optional)

| Id                             | Code today                                                                   | Gap                                              |
| ------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| `spot.fake` / `maersk` / `cma` | `extensions/spot` + host registry; UI via `quote.rateSources` in rates sheet | Still assumes quote page in shell; **069** creds |
| `messaging.msgraph`            | `extensions/messaging` + `/messaging/inbox` page gated by slot               | Page should become workbench view/editor         |
| `ingestion.fcl_v6`             | `extensions/ingestion` + `/rates/upload`                                     | Same — contribute view, not shell route owner    |

## Still in shell — package as driving built-ins

| Target id                                 | Move from `apps/web` (approx)                                                                                        | Backend (stays service; BFF client moves with UI) |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **`quoting.document`**                    | `components/quotes/*` (form, lanes, list, create), `app/(app)/page.tsx`, `app/(app)/quote/**`, `lib/domain/quotes/*` | `services/quotes`                                 |
| **`quoting.charges`** (+ globals for now) | `rate-surcharges-editor`, `global-charges-editor`, surcharge bits of lane editor                                     | `quotes.surcharge` / `global_charge`              |
| **`quoting.math`**                        | call sites of `@starboard/lib-pricing` in quote form                                                                 | `packages/pricing` (already separate)             |
| **`crm.parties`**                         | `components/quotes/customer-combobox`, `app/(app)/customers/**`, `lib/domain/crm/*`, customer settings redirects     | `services/crm`                                    |
| **`geo.gazetteer`**                       | `port-combobox`, `address-combobox`, `lib/domain/geography/*`                                                        | `services/geography`                              |
| **`rates.catalog`**                       | rates search (catalog half of `rates-search-sheet`), `lib/domain/rates/*`                                            | `services/rates`                                  |
| **`org.settings`**                        | `app/(app)/settings/**`, `components/settings/*`, org metadata                                                       | Better Auth org + future settings APIs            |
| **`quoting.incoterm` / `markup`**         | mostly missing / lane markup footer only                                                                             | after **070**/**072**                             |

Kernel should retain: auth routes, `(app)/layout` → **workbench host**, `lib/extensions*`, `lib/auth*`, `lib/domain/platform/*`, admin, generic `/api/extensions/[id]`.

## Host today vs needed

| Have                           | Need                                       |
| ------------------------------ | ------------------------------------------ |
| `contributes.nav` (href links) | `workbench.activity` / `views` / `editors` |
| `uiSlots` string tags          | Slot hosts + **`defines.extensionPoints`** |
| `api` / `jobs` / `settings`    | Keep; wire UI factories by contribution id |
| Entitlements + rollout         | Unchanged                                  |

## Package layout (decided in 076)

```text
extensions/
  host/                 # @starboard/ext-host (registry + types)
  spot|messaging|ingestion/  # optional Python workers
  builtins/             # driving built-ins (JS/TS, default-on credit+enterprise)
    quoting-document/   # @starboard/ext-quoting-document  → id quoting.document
    quoting-charges/    # quoting.charges (stub until 073)
    crm-parties/        # crm.parties
    geo-gazetteer/      # geo.gazetteer
    rates-catalog/      # rates.catalog
    org-settings/       # org.settings
packages/pricing/       # quoting.math implementation (keep)
```

Convention: `extensions/builtins/<id with dots → dashes>` → `@starboard/ext-<same>`. Each package exports `./manifest` (pure data, no imports; host bundles + Zod-validates it in `extensions/host/src/builtins.ts`) and `.` (manifest + UI/widget factories; React only here). Editor factories are keyed by contributed `workbench.editors` viewType and registered in `apps/web/lib/workbench/builtin-editors.ts`. `pnpm-workspace.yaml` lists `extensions/builtins/*`; `pyproject.toml` excludes `extensions/builtins` from uv.

## Migration order (matches build-priority)

1. Harden host + workbench chrome (**074**, **075**)
2. Scaffold empty built-in packages + manifests (**076**)
3. Move **quote** into `quoting.document` (**077**) — largest
4. Move CRM + settings (+ geo widgets as deps) (**078**)
5. Quote-defined slots; peel charges/rateSources (**073**)
6. QV2 parity inside those packages (**071→070→072**)
7. Org carrier secrets (**069**)
