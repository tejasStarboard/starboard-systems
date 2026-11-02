---
id: 084
wave: 07-quote-loop
title: Peel Incoterm + markup into quoting.incoterm / quoting.markup
status: todo
depends_on: [070, 072, 073]
epic: SYS-PLATFORM
docs:
  - .project/docs/extension-points.md
  - .project/docs/adr/0006-shell-built-ins-extensions.md
  - .project/docs/reference/extension-migration-inventory-2026-11-02.md
  - .project/docs/domains/quotes.md
---

# Peel Incoterm + markup into quoting.incoterm / quoting.markup

## Extension model

|                    |                                                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Packages / ids** | **`quoting.incoterm`**, **`quoting.markup`** — new **driving built-ins** (or one package with two manifests only if forced — prefer two ids)   |
| **Layer**          | Built-ins (default-on). Siblings of `quoting.charges`; not kernel; not optional.                                                               |
| **Owner of slots** | Still **`quoting.document`** (`defines` already: `quoting.slots.headerFields`, `quoting.slots.totals`, `quoting.totalsHooks`)                  |
| **Contributes**    | Incoterm/role controls → `headerFields` (+ headless `totalsHooks` if needed). Markup dial/footer → `totals` / `totalsHooks`                    |
| **Unplug test**    | Either built-in off → that slot region empty; charge grid and document remain. Document package must **not** import Incoterm/markup UI modules |

## Goal

1. Scaffold builtin packages + host registry entries (**076** pattern).
2. Move UI shipped under document/charges for **070** / **072** into these packages as `contributes.points`.
3. Register factories in `builtinPointComponents` (or package exports) — same pattern as **073** charges/rateSources.
4. Leave behavior unchanged (refactor, not redesign).

## Non-goals

- New Incoterm matrix cells (**070** already shipped)
- Per-CT dials / row FX (**085**)
- Renaming kernel APIs

## Files to touch (approx)

- `extensions/builtins/quoting-incoterm/`, `quoting-markup/`
- `extensions/builtins/quoting-document` — remove direct UI imports; keep slot hosts
- `extensions/host` builtins list + tests
- Inventory + extension-points table (typical contributors column)

## Acceptance

- [ ] Manifests contribute only to document-owned points; host resolves when document active
- [ ] Document package has no static import of Incoterm/markup UI
- [ ] Unplug either sibling → slot empty; quote still opens
- [ ] Manual QV2 path with optionals off still shows Incoterm + markup when both built-ins on
- [ ] `pnpm run ci` green

## Out of scope

CRM party picker peel (already `crm.parties`); PDF (**083**)
