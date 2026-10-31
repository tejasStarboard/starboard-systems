import { extensionApiPath } from "@/lib/extension-api-path"

export type PolledJobStatus = {
  status: "running" | "completed" | "failed" | "cancelled"
  result?: unknown
  error?: string
}

const TERMINAL = new Set(["completed", "failed", "cancelled"])

export async function pollExtensionJob(input: {
  extensionId: string
  workflowId: string
  intervalMs?: number
  maxWaitMs?: number
  signal?: AbortSignal
}): Promise<PolledJobStatus> {
  const intervalMs = input.intervalMs ?? 2000
  const maxWaitMs = input.maxWaitMs ?? 60_000
  const started = Date.now()
  const url = extensionApiPath(input.extensionId, "jobs", input.workflowId)

  while (true) {
    if (input.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError")
    }
    const response = await fetch(url, { signal: input.signal })
    const payload = (await response.json().catch(() => null)) as
      (PolledJobStatus & { error?: string }) | null
    if (!response.ok) {
      throw new Error(
        typeof payload?.error === "string" ? payload.error : "Job status failed"
      )
    }
    if (!payload?.status) {
      throw new Error("Invalid job status response")
    }
    if (TERMINAL.has(payload.status)) {
      return payload
    }
    if (Date.now() - started >= maxWaitMs) {
      return { status: "running", error: "Timed out waiting for job" }
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
}
