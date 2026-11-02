import { afterEach, describe, expect, mock, test } from "bun:test"

import { enqueueExtensionJobRequest } from "./extension-job-request"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("enqueueExtensionJobRequest", () => {
  test("returns job ids on success", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ workflowId: "wf-1", runId: "run-1" }), {
          status: 202,
        })
      )
    ) as unknown as typeof fetch

    await expect(
      enqueueExtensionJobRequest({ extensionId: "ingestion.fcl_v6" })
    ).resolves.toEqual({
      ok: true,
      job: { workflowId: "wf-1", runId: "run-1" },
    })
  })

  test("returns error payload on HTTP failure", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
      )
    ) as unknown as typeof fetch

    await expect(
      enqueueExtensionJobRequest({ extensionId: "ingestion.fcl_v6" })
    ).resolves.toEqual({
      ok: false,
      error: "Forbidden",
    })
  })

  test("rejects missing workflow ids", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify({}), { status: 202 }))
    ) as unknown as typeof fetch

    await expect(
      enqueueExtensionJobRequest({ extensionId: "ingestion.fcl_v6" })
    ).resolves.toEqual({
      ok: false,
      error: "Unexpected response.",
    })
  })
})
