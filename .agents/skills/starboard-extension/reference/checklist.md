# Extension implementation checklist

Use with [.project/docs/extensions.md](../../../../.project/docs/extensions.md). For a new `spot.*`, mirror `spot.fake`.

- [ ] Manifest in `extensions/host/src/registry.ts` — stable `domain.name` id, `requiredPlan`, `enabled`, `contributes`, `worker`, `healthPath`
- [ ] `contributes` covers nav and/or `uiSlots` and/or `api` and/or `jobs` (spot: `quote.rateSources` + `spot.search` + pathPrefix)
- [ ] Workbench UI (075): `contributes.activity/views/editors/commands`; own nested points via `defines.extensionPoints`; contribute to others via `contributes.points[pointId]` (host `getActiveWorkbenchContributions` / `getContributionsToPoint`; fails closed if owner inactive; no extension ids in kernel)
- [ ] `worker` block if Python/Temporal needed (`service` + `plugin`)
- [ ] Plugin under `extensions/{service}/src/.../plugins/<plugin>/`; registered in that service’s plugin registry
- [ ] Temporal: workflow defn name + id pattern documented (spot: `spot.search` / `spot.search.{pluginId}-{uuid}`)
- [ ] Python enqueue returns **202** `{ workflowId, runId }`; status via `describe_job` / `GET …/jobs/:workflowId`
- [ ] Spot: add `POST /extensions/spot.<id>/jobs` in `extensions/spot/src/spot/api.py` (per-id today); status route already generic
- [ ] No new per-id Next route tree — use `apps/web/app/api/extensions/[extensionId]/[[...path]]` + `extensions-api-dispatch.ts`
- [ ] BFF: `requireActiveExtension` then manager by `worker.service`
- [ ] Client URLs via `extensionApiPath`; UI polls with `pollExtensionJob` (no ids-only dead-end)
- [ ] Shell fail-closed if rollout map unavailable; missing row still = on
- [ ] No `if (extensionId === "…")` in unrelated shell core
- [ ] Unplug path verified: rollout `off` / `enabled: false` → empty contributions + API 404; delete plugin with zero surgical shell edits
- [ ] Tests: host entitlements/rollout; BFF dispatch + all-off; Python `test_*_plugin.py` (+ job status as needed)
- [ ] Domain doc + extensions.md registry row updated
- [ ] Ticket acceptance covers disable / all-off path
