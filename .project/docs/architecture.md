# Program architecture — shell + extension host

Runtime deploy details for the monorepo live in [docs/architecture.md](../../docs/architecture.md). This doc is the **rewrite product model**.

## VS Code analogy (workbench + three layers)

See **[ADR 0006](adr/0006-shell-built-ins-extensions.md)** · **[extension-points.md](extension-points.md)**.

| VS Code | Starboard |
| ------- | --------- |
| Workbench window + host API | **Kernel:** auth/org + **one** workbench shell + extension host |
| Multi-tab text editor | **Center tabs** — quote documents (`quoting.document`) |
| File explorer (+ context menu hooks) | **Sidebar** + built-in-**defined** menus/slots others inject into |
| Terminal / chat panels | Bottom / aux panels (later) |
| Built-in extensions | Driving: quoting.*, geo, catalog, CRM, settings |
| Marketplace | Optional: `spot.*`, `messaging.*`, `ingestion.*` |

**Target routes:** auth + single workbench surface. `/quote/[id]`, `/customers/…`, `/settings/…` → contributed views/editors (deep links open tabs). Ticket **074**.

**Extension points:** kernel = generic `workbench.*` / `core.*` only. Nested quote UI is **`defines`’d by `quoting.document`** — not by the kernel.

## Kernel (always on)

- Better Auth + organization; plan/entitlements
- Extension host (`contributes` + `defines.extensionPoints` resolution)
- Workbench chrome: activity bar, sidebar host, editor tab host, optional panels
- **No** quote/CRM/settings product modules; **no** `quote.chargeTable` in kernel

## Driving built-ins (default-on)

- **`quoting.document`** — Quotes sidebar + quote editor; **defines** `quoting.slots.*` / context menus
- `quoting.charges` / `math` / `incoterm` / `markup` / `globals` — **contribute** into quote-defined points
- `crm.parties`, `geo.gazetteer`, `rates.catalog`, `org.settings`

## Optional extensions

Contribute into kernel regions and/or quote-defined points; Temporal workers as today. Unplug freely.

## Process topology

```
Browser --cookie--> Next shell/BFF --service token--> Bun domain services --> Neon
                         |
                         +--> extension-host (entitlements + manifests)
                         |
                         +--202--> Python workers (ingest / messaging / spot) --> Temporal OSS
```

## Data ownership

| Schema / concern | Owner |
| ---------------- | ----- |
| `public` / Better Auth | Next shell (kernel) |
| Org plan (`credit` \| `enterprise`) | Next shell (`organization.plan`) |
| `geo.*` | `services/geography` (built-in) |
| `quotes.*` | `services/quotes` (`quoting.document` + siblings) |
| `rates.*` | `services/rates` |
| `crm.*` | `services/crm` |
| Extension job / workflow state | Python worker / Temporal OSS |

Cross-domain FKs are opaque text IDs; BFF enforces integrity.

## Execution order

[build-priority-2026-11-01.md](reference/build-priority-2026-11-01.md) · [roadmap.md](roadmap.md)
