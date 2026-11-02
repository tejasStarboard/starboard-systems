# Build priority — 2026-11-01 (updated 2026-11-02)

**Source of truth for execution order.**

See also: [extension-migration-inventory-2026-11-02.md](extension-migration-inventory-2026-11-02.md) · [ADR 0006](../adr/0006-shell-built-ins-extensions.md) · [extension-points.md](../extension-points.md).

---

## Principles

1. **Platform before more product hardening in the shell** — workbench + host + migrate existing code into built-ins first.
2. **Refactor, not redesign** — QV2 parity tickets run **after** quote is a built-in (work lands in the right package).
3. Kernel = auth/org + workbench + host. Driving built-ins **define** nested points (explorer → context menu). Optionals unplug.

---

## Phase A — Workbench + extension system (NOW)

| # | Ticket | Why |
| -: | ------ | --- |
| 1 | **[074](../../tickets/todo/074-workbench-shell.md)** Workbench shell | Region hosts + tab model + deep links |
| 2 | **[075](../../tickets/todo/075-extension-host-workbench-contributions.md)** Host contributions + `defines` | Manifest/API for views/editors/extension-points |
| 3 | **[076](../../tickets/todo/076-builtin-extension-packages-scaffold.md)** Scaffold built-in packages | Empty `quoting.document`, crm, settings, … + registry |
| 4 | **[077](../../tickets/todo/077-migrate-quoting-document-builtin.md)** Migrate quote → built-in | Largest shell extraction |
| 5 | **[078](../../tickets/todo/078-migrate-crm-settings-builtins.md)** Migrate CRM + settings (+ geo) | Clear kernel of remaining product pages |
| 6 | **[073](../../tickets/todo/073-quote-contribution-points.md)** Quote-defined slots | Peel charges / rateSources into contributions |

`074` ∥ `075` OK if coordinated on contracts.

```text
074 workbench ──┐
075 host APIs ──┴──► 076 scaffold ──► 077 quote migrate ──► 078 crm/settings
                                              │
                                              └──► 073 define slots + peel charges
```

---

## Phase B — QV2 money parity (after quote is a built-in)

| # | Ticket | Why |
| -: | ------ | --- |
| 7 | **[071](../../tickets/todo/071-quote-charge-table-prod-parity.md)** Charge grid + rate alternatives | Prod table shape |
| 8 | **[070](../../tickets/todo/070-incoterm-bucket-scope.md)** Incoterm scope | Replace door-only |
| 9 | **[072](../../tickets/todo/072-quote-charge-line-economics-parity.md)** Line economics | Markup/sell/Split |

Implement inside built-in packages / quote-defined slots — **not** new kernel pages.

---

## Phase C — Optional extension hardening

| # | Ticket | Why |
| -: | ------ | --- |
| 10 | **[069](../../tickets/todo/069-org-carrier-credentials-settings.md)** Org carrier credentials | Spot secrets in settings |

---

## Already done (Wave 6a)

060–068 money foundation + live spot/messaging/CRM shell (still multi-page). Optional workers under `extensions/{spot,messaging,ingestion}` exist.

---

## Later

Quote stages/PDF · FCL Excel/PDF · more carriers · Outlook/Gmail · Public API · …
