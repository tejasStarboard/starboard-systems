# Program architecture — shell + extension host

Runtime deploy details for the monorepo live in [docs/architecture.md](../../docs/architecture.md). This doc is the **rewrite product model**.

## VS Code analogy

| VS Code                  | Starboard Systems                                                    |
| ------------------------ | -------------------------------------------------------------------- |
| Workbench / bare editor  | `apps/web` shell: quote editor, CRM, settings, org switcher          |
| Extension Host           | `packages/extension-host` + BFF activation                           |
| Extension `package.json` | Extension **manifest** (see [extensions.md](extensions.md))          |
| Built-ins                | Always-on packages/services (pricing, geography, quotes, rates, CRM) |
| Disable extension        | Flag off → hide contributions → stop worker deploy                   |
| Extensions view          | Future admin node-graph (deferred)                                   |

## Shell (always on)

- Better Auth + organization plugin (tenant, members, roles, invitations)
- Quotes (QGS) + `packages/pricing` (ONE MATH)
- CRM customers/contacts/vendors as **domain data scoped to the active org**
- Geography (ports, currencies, locations)
- Rates catalog (manual + written by extensions)
- Billing: **credit** and **enterprise** plans; entitlements gate extensions.
  Plan is stored on Better Auth `organization.plan` (default **`credit`**, not
  client-writable). `packages/extension-host` filters manifests by `requiredPlan`.

## Extensions (optional)

Examples: `ingestion.fcl_v6`, `messaging.msgraph`, `spot.maersk`, `spot.cma`.

Each extension may contribute nav, API proxies, UI slots, and/or a Python +
Temporal OSS worker. Shell must remain usable with all extensions disabled
(manual quote still works).

## Process topology

```
Browser --cookie--> Next shell/BFF --service token--> Bun domain services --> Neon
                         |
                         +--> extension-host (entitlements + manifests)
                         |
                         +--202--> Python workers (ingest / messaging / spot) --> Temporal OSS
```

## Data ownership

| Schema / concern                    | Owner                            |
| ----------------------------------- | -------------------------------- |
| `public` / Better Auth              | Next shell                       |
| Org plan (`credit` \| `enterprise`) | Next shell (`organization.plan`) |
| `geo.*`                             | `services/geography`             |
| `quotes.*`                          | `services/quotes`                |
| `rates.*`                           | `services/rates`                 |
| `crm.*`                             | `services/crm`                   |
| Extension job / workflow state      | Python worker / Temporal OSS     |

Cross-domain FKs are opaque text IDs; BFF enforces integrity.
