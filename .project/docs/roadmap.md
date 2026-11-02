# Roadmap

**Execution order:** [build priority](reference/build-priority-2026-11-01.md)  
**Migration map:** [extension-migration-inventory-2026-11-02.md](reference/extension-migration-inventory-2026-11-02.md)  
**Architecture:** [architecture.md](architecture.md) · [ADR 0006](adr/0006-shell-built-ins-extensions.md) · [extension-points.md](extension-points.md)

---

## Product model (locked)

| Layer                 | What                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------- |
| **Kernel**            | Auth/org + one workbench + extension host                                                 |
| **Driving built-ins** | `quoting.document` (**defines** slots/menus), charges/math/…, geo, catalog, CRM, settings |
| **Optional**          | `spot.*`, `messaging.*`, `ingestion.*` (already under `extensions/`)                      |

---

## Current focus — Phase A (platform)

Restructure app → workbench; harden host; **package and migrate** shell code into built-ins.

| Order | Ticket                                                                                            | Status |
| ----: | ------------------------------------------------------------------------------------------------- | ------ |
|     1 | [074](../tickets/todo/074-workbench-shell.md) Workbench shell                                     | open   |
|     2 | [075](../tickets/todo/075-extension-host-workbench-contributions.md) Host views/editors/`defines` | open   |
|     3 | [076](../tickets/todo/076-builtin-extension-packages-scaffold.md) Scaffold built-in packages      | open   |
|     4 | [077](../tickets/todo/077-migrate-quoting-document-builtin.md) Migrate quote → `quoting.document` | open   |
|     5 | [078](../tickets/todo/078-migrate-crm-settings-builtins.md) Migrate CRM + settings                | open   |
|     6 | [073](../tickets/todo/073-quote-contribution-points.md) Quote-defined slots; peel charges         | open   |

---

## Next — Phase B (QV2 parity inside built-ins)

| Order | Ticket                                                                                  | Status |
| ----: | --------------------------------------------------------------------------------------- | ------ |
|     7 | [071](../tickets/todo/071-quote-charge-table-prod-parity.md) Charge grid + alternatives | open   |
|     8 | [070](../tickets/todo/070-incoterm-bucket-scope.md) Incoterm scope                      | open   |
|     9 | [072](../tickets/todo/072-quote-charge-line-economics-parity.md) Line economics         | open   |

## Then — Phase C

| Order | Ticket                                                                                 | Status |
| ----: | -------------------------------------------------------------------------------------- | ------ |
|    10 | [069](../tickets/todo/069-org-carrier-credentials-settings.md) Org carrier credentials | open   |

---

## Wave 0–5 — Complete

See [tickets/done/](../tickets/done/).

## Wave 6a — Money foundation — Done (060–068)

Apply rate, extension settings runtime, live spot, messaging, CRM shell, surcharge stack, globals + door scope. **Still multi-page shell** — Phase A migrates that.

---

## Later

Excel/PDF ingest · more carriers · Outlook/Gmail · Public API · Stripe · quote stages/PDF · …
