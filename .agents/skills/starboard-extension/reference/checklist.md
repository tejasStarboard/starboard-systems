# Extension implementation checklist

- [ ] Manifest id stable (`domain.name`)
- [ ] `contributes` covers nav and/or `uiSlots` and/or `api` and/or `jobs`
- [ ] `worker` block if Python/Temporal needed (`service` + `plugin`)
- [ ] No new per-id Next route tree — use generic `[extensionId]/[[...path]]` + dispatch
- [ ] BFF: `requireActiveExtension` then manager by `worker.service`
- [ ] Enqueue `202 { workflowId, runId }` + `GET …/jobs/:workflowId` status/result
- [ ] Client URLs via `extensionApiPath`; UI polls status (no ids-only dead-end)
- [ ] Shell fail-closed if rollout map unavailable; missing row still = on
- [ ] No `if (extensionId === "…")` in unrelated shell core
- [ ] Health path for future admin graph
- [ ] Domain doc + extensions.md registry row updated
- [ ] Ticket acceptance covers disable / all-off path
