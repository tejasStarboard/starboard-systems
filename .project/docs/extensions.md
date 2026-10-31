# Extension host — manifests

Shell discovers extensions via `extensions/host` (`@starboard/ext-host`; see ticket 001). UI and BFF must not hard-code optional features.

**Foundation:** [ADR 0005](adr/0005-extension-foundation.md) + tickets **055** / **056**. Full developer walkthrough lands with 056.

**Admin settings (planned):** `contributes.settings` — per-extension toggles/inputs declared in the kit, stored in platform DB, edited in collapsible admin rows. Tickets [057](../tickets/todo/057-extension-settings-schema.md) (schema + API) → [058](../tickets/todo/058-admin-extension-settings-ui.md) (UI). Separate from rollout on/off.

## Manifest schema (sketch)

```ts
type ExtensionManifest = {
  id: string // e.g. "spot.maersk"
  version: string
  displayName: string
  requiredPlan: Array<"credit" | "enterprise">
  contributes: {
    nav?: Array<{ id: string; label: string; href: string }>
    jobs?: Array<{ type: string; carrier?: string }>
    api?: Array<{ pathPrefix: string }>
    uiSlots?: string[] // e.g. "quote.rateSources", "rates.upload"
    // Planned (057): admin-configurable fields
    settings?: Array<{
      key: string
      label: string
      description?: string
      type: "boolean" | "string" | "number" | "select" | "secret"
      default?: boolean | string | number | null
      options?: Array<{ value: string; label: string }>
      scope: "platform"
    }>
  }
  // Async extensions use Temporal OSS (ADR 0002). kind is always python-temporal.
  worker?: {
    kind: "python-temporal"
    service: string // "ingestion" | "messaging" | "spot"
    plugin: string
  }
  healthPath?: string
  enabled?: boolean // deploy / org flag
}
```

## How to add an extension (contract)

1. **Manifest** — register in `extensions/host` registry (`enabled`, `requiredPlan`, `contributes`, `worker`).
2. **Worker plugin** — Python package under `extensions/{service}` with Temporal workflow; enqueue returns `{ workflowId, runId }`.
3. **BFF** — use generic `apps/web/app/api/extensions/[extensionId]/[[...path]]/route.ts`. Gate with `requireActiveExtension`. Dispatch by `manifest.worker.service` + path (no new per-id `route.ts`).
4. **Job status** — Python `GET /extensions/{id}/jobs/{workflowId}` → `{ status, result?, error? }` via `starboard_python_kit.describe_job`; BFF forwards; UI polls with `extensionApiPath` + `pollExtensionJob`.
5. **UI** — mount only via active `nav` / `uiSlots` contributions. Client URLs from `extensionApiPath(extensionId, …)`.
6. **Rollout** — admin modes `on` / `off` / `beta` / `common`. Missing row = **on**. Map-read failure → empty contributions (shell stays up); APIs inactive.
7. **Unplug** — see checklist below.

### Forbidden in shell core

```ts
// Do NOT branch product UI on literal extension ids in unrelated shell code:
if (extensionId === "spot.maersk") { … }
```

Use contributions / activation helpers instead. Domain pages that belong to a single slot (e.g. rates upload → ingestion) may call that extension’s API via `extensionApiPath`.

## Async job contract

| Step    | HTTP                     | Body                                                                 |
| ------- | ------------------------ | -------------------------------------------------------------------- |
| Enqueue | `POST …/jobs` → **202**  | `{ workflowId, runId }`                                              |
| Status  | `GET …/jobs/:workflowId` | `{ status: running\|completed\|failed\|cancelled, result?, error? }` |

## Registered extensions (stubs)

| id                  | Wave | Worker                | Notes                            |
| ------------------- | ---- | --------------------- | -------------------------------- |
| `ingestion.fcl_v6`  | 2    | Python + Temporal OSS | Ocean FCL only; gate-first save  |
| `messaging.msgraph` | 3    | Python + Temporal OSS | First email provider             |
| `spot.fake`         | 4    | Python + Temporal OSS | Host test plugin (deterministic) |
| `spot.maersk`       | 4    | Python + Temporal OSS | API and/or scraper strategies    |
| `spot.cma`          | 4    | Python + Temporal OSS | API and/or scraper strategies    |

## Planned later (not registered yet)

- `ingestion.air_v2`, `ingestion.lcl`, `ingestion.cartage_v2`, `ingestion.drayage_v2`
- `messaging.gmail`, `messaging.front`, `messaging.imap`
- More `spot.*` carriers
- Outlook add-in host, companion, public-api, intelligence.*

## Unplug checklist

1. Set `enabled: false` (or remove from registry) **or** rollout `off`.
2. Confirm shell hides nav / UI slots / API proxy (404).
3. Stop deploying the worker plugin.
4. Expand/contract drop optional schema if any.
5. Delete plugin package. Shell feature code needs **zero** surgical edits.
