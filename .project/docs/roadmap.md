# Roadmap

**Execution order:** [build priority](reference/build-priority-2026-11-01.md)  
**Migration map:** [extension-migration-inventory-2026-11-02.md](reference/extension-migration-inventory-2026-11-02.md)  
**Architecture:** [architecture.md](architecture.md) · [ADR 0006](adr/0006-shell-built-ins-extensions.md) · [extension-points.md](extension-points.md)

---

## Product model (locked)

| Layer                 | What                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Kernel**            | Auth/org + one workbench + extension host                                                                   |
| **Driving built-ins** | `quoting.document` (**defines** slots/menus), charges/math/Incoterm/markup/pdf, geo, catalog, CRM, settings |
| **Optional**          | `spot.*`, `messaging.*`, `ingestion.*` (already under `extensions/`)                                        |

---

## Phase A — Platform — **Done**

Workbench + host + migrate quote/CRM/settings/geo + quote slots + hooks + retire legacy shim (**074–081**). See [tickets/done/](../tickets/done/).

---

## Phase B — QV2 money — **Done**

Charge grid (**071**), Incoterm (**070**), lean line economics (**072**).

---

## Phase C — Spot credentials — **Done**

Org carrier secrets (**069**).

---

## Current focus — Phase D (quote close-the-loop)

Modular **built-ins** and one **optional** ingest extra. No new kernel product trees.

| Order | Ticket                                                                                      | Package                       | Status |
| ----: | ------------------------------------------------------------------------------------------- | ----------------------------- | ------ |
|    11 | [082](../tickets/todo/082-quote-stages-validity-numbering.md) Stages + validity + numbering | `quoting.document`            | open   |
|    12 | [083](../tickets/todo/083-quote-pdf-export-builtin.md) Quote PDF                            | `quoting.pdf`                 | open   |
|    13 | [084](../tickets/todo/084-quoting-incoterm-markup-slot-packages.md) Peel Incoterm + markup  | `quoting.incoterm` / `markup` | open   |
|    14 | [085](../tickets/todo/085-qv2-money-follow-ons-charges.md) Money follow-ons                 | `quoting.charges`             | open   |
|    15 | [086](../tickets/todo/086-rates-catalog-workbench-crud.md) Catalog CRUD workbench           | `rates.catalog`               | open   |
|    16 | [087](../tickets/todo/087-ingestion-fcl-v6-excel-pdf.md) FCL v6 Excel/PDF ingest            | `ingestion.fcl_v6` (optional) | open   |

---

## Wave 0–6a — Complete

See [tickets/done/](../tickets/done/).

---

## Later

RFQ extract · more carriers · settings/billing · admin node-graph · Outlook/Gmail · Public API · Companion · FFW OS · Air/LCL extras · …
