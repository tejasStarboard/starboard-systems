# Build priority — 2026-11-01 (updated 2026-11-03)

**Source of truth for execution order.**

See also: [extension-migration-inventory-2026-11-02.md](extension-migration-inventory-2026-11-02.md) · [ADR 0006](../adr/0006-shell-built-ins-extensions.md) · [extension-points.md](../extension-points.md).

---

## Principles

1. **Platform before more product hardening in the shell** — workbench + host + migrate existing code into built-ins first.
2. **Refactor, not redesign** — QV2 parity tickets run **after** quote is a built-in (work lands in the right package).
3. Kernel = auth/org + workbench + host. Driving built-ins **define** nested points (explorer → context menu). Optionals unplug.
4. **New product UI = contribution** — built-in or optional package; never grow long-lived kernel `app/(app)/…` feature trees.

---

## Phase A — Workbench + extension system — **DONE**

|   # | Ticket                                                                                   | Status |
| --: | ---------------------------------------------------------------------------------------- | ------ |
|   1 | [074](../../tickets/done/074-workbench-shell.md) Workbench shell                         | done   |
|   2 | [075](../../tickets/done/075-extension-host-workbench-contributions.md) Host + `defines` | done   |
|   3 | [076](../../tickets/done/076-builtin-extension-packages-scaffold.md) Scaffold built-ins  | done   |
|   4 | [077](../../tickets/done/077-migrate-quoting-document-builtin.md) Quote → built-in       | done   |
|   5 | [078](../../tickets/done/078-migrate-crm-settings-builtins.md) CRM + settings + geo      | done   |
|   6 | [073](../../tickets/done/073-quote-contribution-points.md) Quote slots; peel charges     | done   |

Also: [079](../../tickets/done/079-apps-web-reusable-hooks.md) hooks · [080](../../tickets/done/080-retire-legacy-shell-shim.md) retire shim · [081](../../tickets/done/081-fix-079-hook-pending-and-auth-next.md) hook fixes.

---

## Phase B — QV2 money parity — **DONE**

|   # | Ticket                                                                                          | Status |
| --: | ----------------------------------------------------------------------------------------------- | ------ |
|   7 | [071](../../tickets/done/071-quote-charge-table-prod-parity.md) Charge grid + rate alternatives | done   |
|   8 | [070](../../tickets/done/070-incoterm-bucket-scope.md) Incoterm scope                           | done   |
|   9 | [072](../../tickets/done/072-quote-charge-line-economics-parity.md) Line economics (lean)       | done   |

---

## Phase C — Optional extension hardening — **DONE**

|   # | Ticket                                                                                    | Status |
| --: | ----------------------------------------------------------------------------------------- | ------ |
|  10 | [069](../../tickets/done/069-org-carrier-credentials-settings.md) Org carrier credentials | done   |

---

## Phase D — Quote close-the-loop (modular built-ins / extras) — **DONE**

All product work lands in **packages** that contribute to the workbench or to `quoting.document`-owned points. Kernel stays thin.

|   # | Ticket                                                                                         | Package / layer                             | Why                          |
| --: | ---------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------- |
|  11 | [082](../../tickets/done/082-quote-stages-validity-numbering.md) Stages + validity + numbering | `quoting.document` **built-in**             | Lifecycle; unlocks PDF/send  |
|  12 | [083](../../tickets/done/083-quote-pdf-export-builtin.md) Quote PDF                            | **`quoting.pdf`** **built-in**              | Export via document commands |
|  13 | [084](../../tickets/done/084-quoting-incoterm-markup-slot-packages.md) Peel Incoterm + markup  | `quoting.incoterm` / `markup` **built-ins** | Fill empty 073 slots         |
|  14 | [085](../../tickets/done/085-qv2-money-follow-ons-charges.md) Per-CT / row FX / equipment      | `quoting.charges` **built-in**              | 072 deferrals                |
|  15 | [086](../../tickets/done/086-rates-catalog-workbench-crud.md) Catalog CRUD workbench           | `rates.catalog` **built-in**                | Beyond apply sheet           |
|  16 | [087](../../tickets/done/087-ingestion-fcl-v6-excel-pdf.md) FCL v6 Excel/PDF ingest            | `ingestion.fcl_v6` **optional**             | Extra; CSV already shipped   |

```text
082 quoting.document lifecycle ──► 083 quoting.pdf (contributes commands)
         │
         └──► 084 quoting.incoterm + quoting.markup → headerFields / totals
                   └──► 085 quoting.charges deepen

086 rates.catalog workbench ── parallel (defines ingest slot for 087)
087 ingestion.fcl_v6 Excel/PDF ── optional parallel
```

---

## Phase E — Quote builder UX — **NOW**

Multistep builder + FCL map + rate cards + live PDF/email preview. Design: [quote-builder-ux-2026-11-03.md](quote-builder-ux-2026-11-03.md).

**Integration branch:** `quote-flow` (off `dev`). Slice branches: `git checkout --no-track -b {id} origin/quote-flow`. PRs target **`quote-flow` only**; **no direct commits** on `quote-flow`. Promote via `quote-flow` → `dev` when the epic is ready.

|   # | Ticket                                                                                              | Package / layer                      | Why                        |
| --: | --------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------- |
|  17 | [088](../../tickets/done/088-quote-builder-ux-epic.md) Epic (docs / orchestration)                  | —                                    | Sequence + git rules       |
|  18 | **[089](../../tickets/done/089-quote-builder-multistep-shell.md)** Multistep shell + preview chrome | `quoting.document`                   | Stepper + Sejda-like pane  |
|  19 | **[090](../../tickets/done/090-quote-fcl-world-map-ports.md)** FCL world-map ports                  | `geo.gazetteer` + document Route     | Country → seaport + curves |
|  20 | **[091](../../tickets/done/091-quote-rate-cards.md)** Uber-style rate cards                         | `rates.catalog` / spot → rateSources | Card rail + schedule chips |
|  21 | **[092](../../tickets/done/092-quote-live-pdf-email-preview.md)** Live PDF + email preview          | `quoting.pdf` + `packages/email`     | Fill preview pane          |

```text
088 epic
089 shell ──► 090 map
         └──► 091 rate cards
089 + 083 ──► 092 live preview
```

`089` before `090` / `091` / `092`. `090` and `091` may run in parallel after `089`. `092` needs `089` + existing PDF built-in (**083**).

---

## Already done (Wave 6a)

060–068 money foundation + live spot/messaging/CRM shell. Optional workers under `extensions/{spot,messaging,ingestion}`.

---

## Later (Phase F+)

RFQ email → draft quote · more spot carriers · settings/billing productization · admin extension node-graph · Outlook/Gmail hosts · Public API · Companion · FFW OS · Air/LCL ingest extras · catalog schedule schema (if rate cards need ETD/ETA on catalog rows) · …
