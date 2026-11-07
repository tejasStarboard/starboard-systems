# Extension host — developer cookbook

Shell discovers extensions via `extensions/host` (`@starboard/ext-host`). UI and BFF must not hard-code optional features. **Foundation:** [ADR 0005](adr/0005-extension-foundation.md) (tickets **055** / **056**). Skill: [`starboard-extension`](../../.agents/skills/starboard-extension/SKILL.md).

**Admin settings:** `contributes.settings` — per-extension values declared in the kit and stored in `platform.extension_setting`. Ticket [057](../tickets/done/057-extension-settings-schema.md). Admin UI is [058](../tickets/done/058-admin-extension-settings-ui.md). Separate from rollout on/off.

Product tickets (apply rates, live spot, CRM expansion, …) **depend on 055 + 056**. Prefer this cookbook over reading starboard-2.

## Manifest schema

```ts
type ExtensionManifest = {
  id: string // e.g. "spot.maersk"
  version: string
  displayName: string
  requiredPlan: Array<"credit" | "enterprise">
  defines?: {
    // Points THIS extension owns (075). Others contribute via contributes.points.
    // Ids under `workbench.` / `core.` are kernel-reserved and rejected.
    extensionPoints?: Array<{ id: string; description?: string }>
  }
  contributes: {
    // Kernel workbench points (075) — what the workbench host lists:
    activity?: Array<{ id: string; label: string; icon?: string }>
    views?: Array<{
      id: string
      name: string
      activityId: string
      entries?: Array<{ id: string; label: string; href: string }>
    }>
    editors?: Array<{
      viewType: string
      displayName: string
      deepLink?: string
    }>
    commands?: Array<{ id: string; title: string }>
    // Contributions INTO extension-defined points, keyed by point id (075):
    points?: Record<
      string,
      Array<{
        id: string
        label?: string
        component?: string // UI factory key (default: id)
        order?: number // ascending, default 0
        props?: Record<string, string | number | boolean>
      }>
    >
    // Optional / legacy-compatible:
    nav?: Array<{ id: string; label: string; href: string }> // prefer activity/views
    jobs?: Array<{ type: string; carrier?: string }>
    api?: Array<{ pathPrefix: string }>
    uiSlots?: string[] // optional entitlement tags (prefer isExtensionActive)
    settings?: Array<{
      key: string
      label: string
      description?: string
      type: "boolean" | "string" | "number" | "select" | "secret"
      default?: boolean | string | number | null
      options?: Array<{ value: string; label: string }> // select
      scope: "platform" // v1: platform admin only
      required?: boolean
    }>
  }
  worker?: {
    kind: "python-temporal"
    service: string // "ingestion" | "messaging" | "spot"
    plugin: string
  }
  healthPath?: string
  enabled?: boolean
}
```

## Workbench contributions + defined points (075)

Model: [extension-points.md](extension-points.md), [ADR 0006](adr/0006-shell-built-ins-extensions.md). Kernel never names product points; **driving built-ins define them**, siblings contribute.

Host APIs (`@starboard/ext-host`, all activation-aware = `enabled ∩ entitled ∩ rollout`):

| API                                                             | Purpose                                                                                             |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `getActiveWorkbenchContributions(plan, manifests?, rollout?)`   | `{ activity, views, editors, commands, points }`, each item tagged `extensionId`; first id wins     |
| `resolvePointOwner(pointId)` / `resolveActivePointOwner(…)`     | Manifest that `defines` the point (null if undefined/ambiguous); active variant requires activation |
| `getContributionsToPoint(pointId, plan, manifests?, rollout?)`  | Contributions to a defined point; **empty if the owner is inactive** (fail closed)                  |
| `getContributionsForOwner(ownerId, plan, manifests?, rollout?)` | Contributions to **every** point `ownerId` defines, keyed by point id (073); `{}` if owner inactive |
| `validateManifestSet(manifests)`                                | Single owner per point + unique ids (registry load throws on errors)                                |

BFF: `listActiveWorkbenchContributions(plan, orgId)` / `listActivePointContributions(pointId, plan, orgId)` in [`apps/web/lib/extensions.ts`](../../apps/web/lib/extensions.ts) (rollout-map failure → empty). `app/(app)/layout.tsx` resolves them through `resolveWorkbenchContributions` / `mergeHostContributions` in [`apps/web/lib/workbench/contributions.ts`](../../apps/web/lib/workbench/contributions.ts). First contribution wins on duplicate ids **and on colliding editor `deepLink` patterns**; views whose `activityId` is not contributed by an active extension are dropped (in the host and again in the merge).

Add a driving built-in (owner):

```ts
{ id: "quoting.document",
  defines: { extensionPoints: [{ id: "quoting.slots.chargeTable" }] },
  contributes: {
    activity: [{ id: "quotes", label: "Quotes" }],
    views: [{ id: "quotes.list", name: "Quotes", activityId: "quotes" }],
    editors: [{ viewType: "quote", displayName: "Quote", deepLink: "/quote/:resourceId" }],
  } }
```

Contribute to someone else's point (never import the owner; ask the host):

```ts
{ id: "quoting.charges",
  contributes: { points: { "quoting.slots.chargeTable": [{ id: "quoting.charges.table" }] } } }
```

Rules: point ids are globally unique and owned by exactly one extension; extensions cannot define `workbench.*` / `core.*`; contributions to an undefined or inactive-owner point are silently dropped; the owner's UI reads its points via `listActivePointContributions` — no `if (extensionId === …)` in the kernel. Optional workers (`ingestion.fcl_v6`, `messaging.msgraph`) contribute workbench activity/views/editors directly (080); `nav` / `uiSlots` remain in the schema for older stubs but the shell no longer builds an Extensions sidebar from them.

### Cookbook: contribute UI to a `quoting.document` slot (073)

1. **Manifest** (pure data, `extensions/builtins/<id>/src/manifest.ts` or `registry.ts` for workers): `contributes.points["quoting.slots.<slot>"] = [{ id, label?, component?, order?, props? }]`. Slots: `headerFields`, `chargeTable`, `totals`, `rateSources` (+ headless `quoting.totalsHooks`, declared only).
2. **UI factory**: export `pointComponents: { [contributionId or component]: Component }` from the package `index.ts`. Props = the slot's contract + `contribution` (types: `@starboard/ext-quoting-document/slots` — import **types only**; never import the document's components, and the document never imports yours).
3. **Register once**: spread the package's `pointComponents` into `builtinPointComponents` in [`builtin-editors.ts`](../../apps/web/lib/workbench/builtin-editors.ts) (+ `apps/web` dep and `transpilePackages`). Optional workers with no JS package reuse a built-in panel via `component` (e.g. `rates.spotSource`).
4. **Unplug = no mount**: slot host mounts only contributions whose owner **and** contributor are active (rollout-aware, from editor-context `slots`) and whose factory is registered. Owner off → nothing; contributor off → only its mounts vanish. Lane actions that need a slot (Search rates, Add manual rate) hide when the slot is empty.

| Slot                         | Props (besides `contribution`)                                                                       | Mounted today                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `quoting.slots.chargeTable`  | `control, register, lanePath, rateFields, currencyCode, excludedBuckets, onAppendRate, onRemoveRate` | `quoting.charges` (table + per-rate surcharges, globals) |
| `quoting.slots.rateSources`  | `origin, destination, onApplyRate`                                                                   | `rates.catalog` (catalog list), `spot.*` panels          |
| `quoting.slots.totals`       | `control, register, lanePath, currencyCode, totals`                                                  | `quoting.markup` (**084**)                               |
| `quoting.slots.headerFields` | `quoteId, control, register, setValue, errors, commercialEditable, layout`                           | `quoting.incoterm` (**084**)                             |
| `quoting.commands`           | `quoteId, status, exportAllowed`                                                                     | `quoting.pdf` Export PDF (**083**)                       |
| `rates.slots.ingestActions`  | `contribution` (+ optional `host.openEditor`); shared panel `rates.ingestUpload`                     | `ingestion.fcl_v6` Upload rates (**087**)                |

**Context model:** the **host slot** supplies identity + callbacks in props (above). For **actions / jobs / headless** work, the child exposes handlers on **its own** BFF; the host (or the child’s UI) **invokes** that API with explicit args (`quoteId`, …). Child re-checks org access. There is no extension↔extension RPC bus — only mediated HTTP to `/api/extensions/<childId>/…`. See [extension-points.md §5](extension-points.md#5-context-for-child-contributions--ui-props-vs-invoke-rpc) and ticket **[107](../tickets/backlog/107-contribution-invoke-rpc.md)**.

| Mechanism                         | When                                                          |
| --------------------------------- | ------------------------------------------------------------- |
| Slot props + host callbacks       | Interactive UI inside the owner’s tree (forms, apply-to-lane) |
| Invoke child BFF (RPC-style HTTP) | Commands, exports, searches, headless hooks                   |
| Shell Workspace State (**103**)   | Bottom-panel / global chrome outside the document tree        |

## Async job contract

| Step    | HTTP                     | Body                                                                 |
| ------- | ------------------------ | -------------------------------------------------------------------- |
| Enqueue | `POST …/jobs` → **202**  | `{ workflowId, runId }`                                              |
| Status  | `GET …/jobs/:workflowId` | `{ status: running\|completed\|failed\|cancelled, result?, error? }` |

## How to add an extension (file-exact)

Canonical slice for a new **`spot.*`** plugin (ingestion/messaging follow the same BFF rules; their Python layouts differ).

### 1. Manifest — `extensions/host`

Register in [`extensions/host/src/registry.ts`](../../extensions/host/src/registry.ts):

- `id`: `spot.<plugin>` (stable)
- `requiredPlan`, `enabled: true`
- `contributes.jobs`: `{ type: "spot.search", carrier: "<plugin>" }`
- `contributes.api`: `{ pathPrefix: "/api/extensions/spot.<plugin>" }`
- `contributes.points`: quote apply path + standalone Spot search — `{ "quoting.slots.rateSources": [{ id: "spot.<plugin>.source", label: "<Display name>", component: "rates.spotSource", props: { carrier: "<plugin>" } }], "rates.slots.spotSearch": [{ id: "spot.<plugin>.spotSearch", label: "<Display name>", component: "rates.spotSource", props: { carrier: "<plugin>" } }] }` (**073** / **098**; `rates.catalog` ships the generic `rates.spotSource` panel, so no JS package is needed)
- `worker`: `{ kind: "python-temporal", service: "spot", plugin: "<plugin>" }`
- `healthPath`: `"/health"`

Rebuild/publish `@starboard/ext-host` as the package’s usual build expects.

### 2. Worker plugin — `extensions/spot`

| Touch                 | Path                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Plugin class          | `extensions/spot/src/spot/plugins/<plugin>/plugin.py` (implement `SpotPlugin` / mirror `fake/`)                                      |
| Activities / workflow | Reuse shared `spot.search` workflow when possible (`plugins/fake/workflows.py`); carrier-specific activities under the plugin folder |
| Register              | `extensions/spot/src/spot/plugins/registry.py` — add to `_PLUGIN_REGISTRY`                                                           |
| Worker imports        | `extensions/spot/src/spot/worker.py` / `dev.py` if new activities/workflows must be registered with Temporal                         |

### 3. Temporal naming

- Workflow **defn name:** `spot.search` (`@workflow.defn(name="spot.search")`)
- Workflow **id:** `spot.search.{pluginId}-{uuid}` (see `enqueue_search` in [`extensions/spot/src/spot/api.py`](../../extensions/spot/src/spot/api.py))
- Enqueue response: **202** + `{ workflowId, runId }`
- Status: `describe_job` → `{ status, result?, error? }` with `status ∈ running \| completed \| failed \| cancelled`

### 4. Python HTTP surface

**Today:** BFF is generic; **Python enqueue routes are still per extension id.**

- Add `POST /extensions/spot.<plugin>/jobs` next to fake/maersk/cma in [`extensions/spot/src/spot/api.py`](../../extensions/spot/src/spot/api.py) that calls `enqueue_search("<plugin>", body)`.
- Status is already generic: `GET /extensions/{extension_id}/jobs/{workflow_id}` (validates plugin via `spot.` prefix strip + `get_plugin`).

Do **not** add a new Next.js `app/api/extensions/spot.<id>/…` tree.

### 5. BFF — generic dispatch only

| Piece               | Path                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Route               | `apps/web/app/api/extensions/[extensionId]/[[...path]]/route.ts`                            |
| Gate                | `apps/web/lib/auth/require-active-extension.ts` → `requireActiveExtension`                  |
| Dispatch            | `apps/web/lib/extensions-api-dispatch.ts` — `worker.service === "spot"` + `POST/GET …/jobs` |
| Client URL helper   | `apps/web/lib/extension-api-path.ts` → `extensionApiPath(extensionId, …)`                   |
| Poll helper         | `apps/web/lib/poll-extension-job.ts` → `pollExtensionJob`                                   |
| Spot manager/client | `apps/web/lib/domain/spot/spot.manager.ts`, `spot.client.ts` — already take `extensionId`   |

For an existing `service` (`spot` / `ingestion` / `messaging`), **no new dispatch branch** is required if paths match the existing job/connection patterns. New HTTP shapes need a dispatch arm + manager method — still not a per-id `route.ts`.

### 6. UI — contributions only

- Quote slots (**073**): `quoting.document` **defines** `quoting.slots.{headerFields,chargeTable,totals,rateSources}` (+ headless `quoting.totalsHooks`). The BFF `GET /api/quotes/:id/editor-context` returns `slots` = `listActiveOwnerPointContributions("quoting.document", …)` (active contributions per defined point; empty when the owner is inactive). The quote editor's slot host (`QuoteSlot`) mounts each contribution via the UI factory registered under its `component ?? id` in a package's `pointComponents` export (merged in [`builtin-editors.ts`](../../apps/web/lib/workbench/builtin-editors.ts); the kernel never names slots).
- Spot rate sources: contribution to `quoting.slots.rateSources` (above). Enqueue/poll lives in [`extensions/builtins/rates-catalog/src/slots/spot-source.tsx`](../../extensions/builtins/rates-catalog/src/slots/spot-source.tsx) (`extensionApiPath` + `pollExtensionJob` with the contributing `extensionId`) — no new sheet or UI for a new carrier.
- Workbench UI: declare `contributes.activity` / `views` / `editors`; shell reads `listActiveWorkbenchContributions`. Gate route pages with `isExtensionActive`.
- Workbench activity / views / editors / commands and defined points: see [Workbench contributions + defined points](#workbench-contributions--defined-points-075).

### Forbidden in shell core

```ts
// Do NOT branch product UI on literal extension ids in unrelated shell code:
if (extensionId === "spot.maersk") { … }
```

Use contributions / activation helpers. Domain pages owned by a single slot (e.g. rates upload → ingestion) may call that extension’s API via `extensionApiPath`.

### 7. Rollout

- Admin modes: `on` / `off` / `beta` / `common` ([admin extensions page](<../../apps/web/app/(admin)/admin/extensions/page.tsx>)).
- Missing rollout row = **on**.
- `getRolloutMap()` failure → **fail closed**: log, empty contributions, `isExtensionActive` false (APIs 404). Shell Quotes stays up. See `apps/web/lib/extensions-rollout.ts`.

### 7b. Admin settings

Declared on `contributes.settings`. `scope` is `"platform"` or `"organization"`. Stored in Postgres schema `platform`, table `extension_setting` (`organization_id`, `extension_id`, `key`, `value` jsonb, `updated_at`, `updated_by`). Platform rows use an empty `organization_id`. Unique on `(organization_id, extension_id, key)`.

Secret values are AES-256-GCM envelopes keyed by `EXTENSION_SETTINGS_SECRET` (same role as `BETTER_AUTH_SECRET`, never the database URL). Ciphertext only in Postgres. List responses return `{ configured: true | false }` and omit plaintext. Decrypt happens in the BFF when a spot worker asks for org credentials, or when a save runs carrier `validate`.

| Call                                              | Behavior                                                                                                                                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/admin/extensions/settings`              | Staff only. Every extension’s declarations plus effective values. Missing row uses the manifest `default`. Secrets return `{ configured: true \| false }` and omit the raw value. |
| `PUT /api/admin/extensions/settings`              | Body `{ extensionId, values }`. Platform scope only. Unknown key or wrong type → **400**. Unknown extension → **404**. Organization-scoped keys are rejected here.                |
| `GET /api/settings/carrier-credentials`           | Active org session. Maersk and CMA secret fields plus validation status. No plaintext.                                                                                            |
| `PUT /api/settings/carrier-credentials`           | Saves org secrets (blank fields keep the stored value), then calls carrier `validate`.                                                                                            |
| `POST /api/settings/carrier-credentials/validate` | Re-validates stored secrets. The handler waits on the stub (~5s → `{ ok: true }`).                                                                                                |
| `GET /api/internal/carrier-credentials`           | Service token. Query `extensionId` and `organizationId`. Returns decrypted credentials for the spot worker.                                                                       |
| Auth                                              | No session → **401**. Signed-in non-staff → **404** (`requireStaffApiSession`).                                                                                                   |
| Audit                                             | `platform_audit_log` action `extension_setting.update` records the changed keys, not secret values.                                                                               |

**Runtime read path (061):** BFF managers call `getPlatformManager().getExtensionSettings(extensionId)` when enqueueing jobs. Missing DB rows use the manifest `default` via `resolveExtensionSettingValues`. Non-secret values are forwarded on the worker job body (`liveStrategy` for `spot.maersk` / `spot.cma`, `syncIntervalMinutes` for `messaging.msgraph`). `settingsForJobInput` strips `type: "secret"` keys so secrets never land in Temporal history or logs. Workers do **not** read Postgres directly.

**Live spot (062):** When `liveStrategy` is true, Maersk/CMA workers use HTTPS `LiveOfferStrategy`. Fixture path when false. CI uses `httpx.MockTransport` — no carrier network.

**Org carrier credentials (069):** Integrations settings edits `spot.maersk` (`username`, `password`, `customerCode`) and `spot.cma` (`apiKey`, `clientId`). After save, the BFF calls `POST /extensions/spot.<carrier>/validate` (stub sleeps ~5s and returns ok; real probes stay with live strategies). The search activity loads decrypted credentials from the internal BFF route and does not put them on the Temporal job. `SPOT_MAERSK_CREDENTIALS` / `SPOT_CMA_CREDENTIALS` remain a dev fallback when that lookup is empty. `extension_credential_check` stores status and `validated_at` only. Schema push: `pnpm --filter @starboard/lib-db db:push`.

### 8. Unplug checklist (verified post-055)

1. Set `enabled: false` in the registry **or** org rollout `off` (admin).
2. Confirm shell: `listActiveWorkbenchContributions` / `isExtensionActive` omit the extension; `requireActiveExtension` + generic route → **404**. Covered by `apps/web/lib/extensions-all-off.test.ts`.
3. Stop deploying the worker process / plugin package for that carrier.
4. Expand/contract drop optional schema if the extension owned any (most stubs: none). Delete that extension’s rows in `platform.extension_setting` and `platform.extension_credential_check`. Nothing drops those rows automatically.
5. Delete the plugin package + registry row + Python POST route. **Zero** surgical edits to unrelated shell feature components.

### 9. Test matrix

| Layer       | What to add/run                                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | `extensions/host` entitlements / rollout unit tests                                                                                      |
| BFF         | `apps/web/lib/extensions-api-dispatch.test.ts`, `extension-api-path.test.ts`, `extensions-all-off.test.ts`, `extensions-rollout.test.ts` |
| Spot Python | `extensions/spot/tests/test_<plugin>_plugin.py`, job status (`test_job_status_api.py`), workflow smoke as needed                         |
| Manual      | Rollout `off` → source hidden in rates sheet; `POST /api/extensions/spot.<id>/jobs` → 404                                                |

Also update this doc’s **Registered extensions** table when shipping a new id.

---

## Walkthrough: clone `spot.fake` → `spot.example`

Reference extension: **`spot.fake`** (deterministic host test plugin). Steps to add a fictional `spot.example`:

1. **Registry** — copy the `spot.fake` block in `extensions/host/src/registry.ts`; set `id: "spot.example"`, `carrier: "example"`, `plugin: "example"`, `pathPrefix: "/api/extensions/spot.example"`, `displayName` accordingly.

2. **Plugin** — copy `extensions/spot/src/spot/plugins/fake/` → `plugins/example/`; set `id = "example"` on the plugin class; adjust `search()` as needed. Prefer reusing `SpotSearchWorkflow` (`name="spot.search"`) and activities that take `pluginId`.

3. **Register plugin** — in `plugins/registry.py`:

```python
from spot.plugins.example.plugin import ExampleSpotPlugin
# …
_PLUGIN_REGISTRY: dict[str, SpotPlugin] = {
    # …
    ExampleSpotPlugin.id: ExampleSpotPlugin(),
}
```

4. **Python enqueue** — in `api.py`, add:

```python
@app.post(
    "/extensions/spot.example/jobs",
    response_model=EnqueueResponse,
    status_code=202,
    dependencies=[Depends(require_service_token)],
)
async def enqueue_example_search(body: SearchJobBody) -> EnqueueResponse:
    return await enqueue_search("example", body)
```

Job status route is already parameterized — no new GET handler.

5. **BFF / UI** — nothing new if you only contribute to `quoting.slots.rateSources`. Active sources arrive in the editor-context `slots`, and the generic `rates.spotSource` panel does:

```ts
await fetch(extensionApiPath(extensionId, "jobs"), { method: "POST", … })
await pollExtensionJob({ extensionId, workflowId })
```

6. **Tests** — `test_example_plugin.py` (deterministic search like `test_fake_plugin.py`); extend job-status tests if paths differ.

7. **Docs** — add a row to **Registered extensions** below; optional domain note under `.project/docs/domains/`.

8. **Rollout** — deploy worker; missing DB row defaults to **on** for entitled orgs. Use admin to set `off` / `beta` / `common` as needed.

Files touched for a thin spot carrier (typical):

- `extensions/host/src/registry.ts`
- `extensions/spot/src/spot/plugins/example/**`
- `extensions/spot/src/spot/plugins/registry.py`
- `extensions/spot/src/spot/api.py` (one POST)
- `extensions/spot/tests/test_example_plugin.py`
- `.project/docs/extensions.md` (this table)

**Not** touched: `apps/web/app/api/extensions/**` (generic route stays), rates-search-sheet / `rates.catalog` (contribution-driven).

---

## Registered extensions (stubs)

| id                  | Wave | Worker                | Notes                                                                                         |
| ------------------- | ---- | --------------------- | --------------------------------------------------------------------------------------------- |
| `ingestion.fcl_v6`  | 2    | Python + Temporal OSS | Ocean FCL CSV/XLSX/PDF; gate-first save; `rates.slots.ingestActions` via `rates.ingestUpload` |
| `messaging.msgraph` | 3    | Python + Temporal OSS | First email provider                                                                          |
| `spot.fake`         | 4    | Python + Temporal OSS | Host test plugin (deterministic)                                                              |
| `spot.maersk`       | 4    | Python + Temporal OSS | Fixture + live HTTPS (`live_strategy`)                                                        |
| `spot.cma`          | 4    | Python + Temporal OSS | Fixture + live HTTPS (`live_strategy`)                                                        |

## Planned later (not registered yet)

- `ingestion.air_v2`, `ingestion.lcl`, `ingestion.cartage_v2`, `ingestion.drayage_v2`
- `messaging.gmail`, `messaging.front`, `messaging.imap`
- More `spot.*` carriers
- Outlook add-in host, companion, public-api, intelligence.*
