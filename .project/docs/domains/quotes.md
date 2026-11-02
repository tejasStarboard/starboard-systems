# Domain: quotes

|           |                                                                |
| --------- | -------------------------------------------------------------- |
| Service   | `services/quotes`                                              |
| Schema    | `quotes.*`                                                     |
| Contracts | `@starboard/lib-contracts` quotes                              |
| Status    | Partial — header + lanes/cargo/rates + surcharge lines persist |

## Owns

Quote aggregate: header, lanes, cargo, selected rates, charge lines under rates, stages, validity, numbering.

## Does not own

Pricing math (`packages/pricing`), geography resolution, CRM customer records, spot fetch, rate-doc ingest.

## Rates + surcharges

Each lane stores `manualRates: ManualRateLine[]` (`label` + `amount` + nested `surcharges`). Quote also stores `globalCharges` (quote-level). Persist shape:

- `quotes.rate` — one alternative (label, flat or per-eq base, optional equipment amounts)
- `quotes.lane.selected_rate_id` — which alternative prices the lane
- `quotes.surcharge` — charge lines on that rate (`leg`, `usage_unit`, rate / rate_percentage, inclusion flags, usage bounds, buy/sell amounts)
- `quotes.global_charge` — quote-level charges (`source: global`); shown in the charge grid Globals section; immune to door bucket scope

Save path is still full lane-tree replace (`replaceLanes`, which also replaces globals); deleting a lane cascades rates → surcharges.

### Schema push

After pulling schema changes:

```bash
pnpm --filter @starboard/lib-db db:push
```

`quotes` is in drizzle `schemaFilter`. Tables: `quotes.surcharge`, `quotes.global_charge`. No checked-in SQL migrations — push is the path (same as CI `db:push:ci`).

## Apply rate → lane

From `RatesSearchSheet`, catalog rows and completed spot offers **Apply to lane** by appending a `ManualRateLine` (`label` + `amount` + nested `surcharges` when the source has charge lines) on the active lane. Totals use `@starboard/lib-pricing` (base + included surcharge amounts by unit / % freight + globals; door absence excludes origin/destination buckets); persist via existing quote save (no catalog/spot FK on `quotes.rate`). Spot UI only when active spot sources are present; catalog + manual surcharge editing work with extensions off.

## Product model

Quote UI/data activation is the driving built-in **`quoting.document`** (not kernel); its UI lives in `extensions/builtins/quoting-document` (077) and loads via `/api/quotes/**` (incl. `/:id/editor-context`). It **defines** extension points (`quoting.slots.*`, menus) that charges / Incoterm / markup / spot contribute into — [extension-points.md](../extension-points.md), [ADR 0006](../adr/0006-shell-built-ins-extensions.md).

## Product parity (refactor rule)

Match **starboard-2 QV2** quote money UX/semantics. Architecture may differ (ONE MATH package, `global_charge` table); **user-visible behavior must not**. Silent simplifications are bugs until ticketed.

## Incoterm scope (070)

Quote header stores `incoterm` and `customerRole` (`shipper` | `consignee`). Lane totals call `excludedBucketsForIncoterm`. A blank Incoterm excludes nothing, including port-to-port origin charges. Globals stay in the total. Door presence does not knock buckets out.

## Charge grid (071)

One table for the **selected** rate inside `quoting.charges` (`quoting.slots.chargeTable`). Rate tabs are alternatives; totals do not sum every rate. **Add charge** adds a surcharge line. **Add rate** (and apply catalog/spot) adds an alternative and selects it.

Base freight is flat, or per-eq (`amount ×` container count). Lean equipment buys are `equipmentAmounts` on the rate (amount per container type). No TEU table.

FCL unit labels: `container` Per Eq, `kg` Per KG, `per_time` Per Day. Enum values are unchanged.

## Charge line economics (072)

Each surcharge and global charge row edits a buy rate (`rate`, or `%` when the unit is percentage), an optional line sell (`sellAmount`; blank mirrors the calculated buy), Include (`isIncludedInTotal`), and Split (`isVisible`). Split off marks the line Absorbed: it still counts in the total and is not drawn as its own customer line. Free / min / max usage feed `getEffectiveUsageAmount`. When the quote Incoterm excludes a bucket, the row shows Auto / Include / Exclude (`scopeOverride`). Lane markup stays one `$` / `%` dial on the selected rate, including mixed equipment. Totals are `sell = buy + markup`, and a sell override’s gap vs buy is part of markup.

## Stages, validity, numbering (082)

Persisted on `quotes.quote` and exposed on `QuoteFormValues` / list items:

| Field                        | Meaning                                                                                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`                     | Lean QV2 stages: `draft` \| `review` \| `sent` \| `win` \| `loss` \| `expired` (rewrite SoT; not won/lost)                                                                   |
| `effectiveFrom` / `expiryAt` | Quote validity window (also copied onto rate `validFrom`/`validTo` on save)                                                                                                  |
| `quoteId`                    | Human-facing number — **6-char A–Z0–9**, unique per `organizationId` (unique index). Assigned on create via random collision-retry (not a sequential counter; no CargoWise). |

UI chrome (id / stage / dates) mounts only via `quoting.slots.lifecycle`, self-contributed by `quoting.document`. Toolbar **Export PDF** comes from `quoting.pdf` into `quoting.commands` (**083**). Kernel has no stage/PDF imports.

### Lean stage gates

- Free select among enum values on save (no full prod state machine).
- Terminal `win` / `loss` / `expired` → commercial body read-only (lanes, charges, customer, currency, Incoterm); status + validity stay editable.
- Export / destructive command contributions: allowed when status ∈ `sent` \| `win` \| `loss` (`exportAllowed` on commands slot props).

## Current gaps (vs prod QV2)

See [build-priority](../reference/build-priority-2026-11-01.md) · [migration inventory](../reference/extension-migration-inventory-2026-11-02.md).

**Phase A:** workbench (**074**) → host (**075**) → scaffold (**076**) → migrate quote (**077**) → slots (**073**).  
**Phase B:** charge grid (**071**) and Incoterm (**070**) shipped. Economics (**072**) is the lean subset in [Charge line economics](#charge-line-economics-072). Still deferred: per-container markup dials, row FX, surcharge equipment column, tier matrix.

Also: no delete yet; no catalog/spot provenance FK. Full prod stage-transition edge cases deferred. PDF is lean (not pixel-perfect prod template).

## Quote PDF (083)

Built-in **`quoting.pdf`** (`extensions/builtins/quoting-pdf`) contributes Export PDF into `quoting.commands`. Totals use `@starboard/lib-pricing` only. Download via BFF `GET /api/quotes/:id/pdf` (gated on extension active + status ∈ sent|win|loss). Unplug → no export control; editor intact.

## Next tickets

**Phase D (cont.):** peel Incoterm/markup (**084**); money follow-ons in `quoting.charges` (**085**).
