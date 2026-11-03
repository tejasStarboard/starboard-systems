---
id: 093
wave: 08-quote-builder-ux
title: Quote currency comboboxes, live FX, Preferences (default base currency)
status: in_progress
depends_on: [089, 085, 078]
epic: SYS-QUOTE-UX
docs:
  - .project/docs/reference/quote-builder-ux-2026-11-03.md
  - .project/docs/domains/quotes.md
  - .project/docs/domains/geography.md
  - .project/docs/domains/pricing.md
  - .project/docs/extension-points.md
  - .project/docs/git-workflow.md
---

# Quote currency comboboxes, live FX, Preferences (default base currency)

## Git

| Rule    | Detail                                                                   |
| ------- | ------------------------------------------------------------------------ |
| Base    | `origin/quote-flow` — `git checkout --no-track -b 093 origin/quote-flow` |
| PR      | Into **`quote-flow` only** (not `dev` / `main`)                          |
| Landing | No direct commits on `quote-flow`                                        |

## Extension model

|                 |                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Packages**    | `quoting.document` (Basics currency); `quoting.charges` (line CCY); `org-settings` (Preferences); geography BFF/service; optional thin FX fetch in BFF or geography |
| **Layer**       | Built-ins + geography; ONE MATH stays in `@starboard/lib-pricing`                                                                                                   |
| **Defines**     | None required                                                                                                                                                       |
| **Contributes** | Settings pages under Preferences; currency options into quote form                                                                                                  |
| **Unplug test** | Org-settings off → no Preferences editor; quote still opens. Geography off → currency lists empty with clear empty state                                            |
| **Math**        | Line amounts in foreign CCY convert to quote **base** via `exchangeRates` / `tryConvertCurrency` — **no twin pricing**                                              |

## Problem (current)

1. **Basics (Step 1):** quote currency is a Radix `Select` fed only from `geo.currency` rows. Fresh orgs have **no rows** until a code is saved via `ensureCurrency` → empty control, no search.
2. **Build (Step 5):** surcharge / global **charge currency** is a free-text 3-char input — error-prone, inconsistent with quote currency.
3. Totals already support FX (`quote.exchangeRates` + pricing `convertToQuoteCurrency`), but rates are mostly **manual** (085 row FX hint). Product wants **live FX** so mixed-currency charges convert into Step 1 base for totals while **displaying** in their own currency.
4. Settings **Quote rules** (`/settings/quote-rules`) is a separate nav item (validity days only). Product wants that under **Preferences** with **App** / **Quote** sections, plus a **default base currency** for new quotes.

## Goal

1. **Currency list UX:** searchable **combobox** for Step 1 base currency and for charge-line / global currencies (shared component if practical). Options must not depend on an empty `geo.currency` table alone — seed or sync a usable ISO list (from FX provider currency set and/or static ISO-4217 subset) and keep `ensureCurrency` for persistence.
2. **Live FX:** integrate a **public FX rates API** (prefer **Frankfurter** / ECB — HTTPS, no API key; document the choice in domain docs). When quote base currency is set (and on refresh / currency change), fetch rates and populate `quote.exchangeRates` (from → base and/or inverse as pricing expects). Cache sensibly (e.g. session / short TTL); failures show a non-blocking warning and leave prior rates.
3. **Totals semantics (unchanged math package):** Quote is quoted in Step 1 **base** currency. Charge lines keep their own `currencyCode` for display/PDF; amounts convert into base via ONE MATH when rates exist. Missing rate → existing missing-FX behavior (row hint / exclude from convert) — do not invent rates.
4. **Preferences IA:** Remove standalone **Quote rules** nav entry. Fold into **Preferences** (`/settings/preferences`) with sections:
   - **App** — existing theme (and any other app prefs already there).
   - **Quote** — former Quote rules fields (e.g. default validity days) + **default base currency** (searchable currency combobox).
5. **New quotes:** apply org **default base currency** when creating / opening a draft with blank `currencyCode` (editor-context or create path).
6. Deep-link `/settings/quote-rules` redirects or resolves to Preferences → Quote section (no dead link).

## Non-goals

- Live finStore / bank FX productization beyond one public provider
- Historical rate-as-of quote date (use latest daily rate for v1)
- Changing Incoterm / markup / surcharge economics beyond FX wire-up
- Pixel PDF work; map / rate cards
- Merge to `dev` (stay on `quote-flow`)

## Files to touch (approx)

- `extensions/builtins/quoting-document` — Basics currency combobox; wire FX refresh into `exchangeRates`
- `extensions/builtins/quoting-charges` — surcharge/global CCY → searchable combobox
- `extensions/builtins/org-settings` — Preferences sections; migrate Quote rules; `org-metadata` default currency; settings nav / deep links
- `services/geography` + contracts + BFF — currency list seed/sync; optional FX proxy route (prefer server-side fetch so the browser does not call third parties directly)
- `packages/pricing` — only if FX map shape needs a helper; **no second totals engine**
- Domain docs: `quotes.md`, `geography.md`, `pricing.md`; build-priority Phase E follow-on row

## Acceptance

- [x] Basics base currency: searchable combobox with selectable options on a fresh DB (no manual seed ritual)
- [x] Build charge / global currency: searchable combobox (not free text)
- [x] Live FX from public API fills `exchangeRates` for quote base; mixed-currency lines convert into base in totals via ONE MATH while UI still shows line currency
- [x] Missing FX rate does not invent a number; user sees existing/clear affordance
- [x] Preferences has **App** + **Quote** sections; Quote rules content lives under Quote; default base currency saved on org and applied to new quotes
- [x] Standalone Quote rules nav removed; old `/settings/quote-rules` deep link still reaches Quote prefs
- [ ] Branch from `quote-flow`; PR targets `quote-flow`; `pnpm run ci` green

## Out of scope

Outlook send; multi-provider FX marketplace; per-user (vs org) currency default unless already the prefs model; promote `quote-flow` → `dev`
